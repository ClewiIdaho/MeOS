import { db } from '@/db';
import type {
  Goal,
  GoalMilestone,
  GoalContribution,
  GoalContributionSource,
  GoalMetric,
} from '@/db';
import { eventBus } from '@/utils/events';
import { BASE_XP } from '@/utils/xp';
import { todayYmd, daysBetween } from '@/utils/dates';

/**
 * Wires module events to goal contributions, milestone hits, and completion.
 *
 * Resolution strategy by metric:
 *   cash_on_hand          → snapshot (one-time + adjustments − payments).
 *                           Recomputed on cash:adjusted and bill:paid.
 *   cash_saved_to_goal    → manual only; applied via contributeToGoal().
 *   bills_paid            → +1 per bill:paid whose billId is linked.
 *   task_completions      → +1 per task:completed whose taskId is linked
 *                           (no link → all completions count).
 *   task_streak           → snapshot of streakState.current on task:completed.
 *   workout_count         → +1 per workout:logged.
 *   workout_volume        → recomputed from liftSets table on workout:logged
 *                           and pr:set. Non-PR mid-session sets reflect on
 *                           the next event in this window.
 *   pr_weight             → max(weight) on pr:set when exerciseId is linked.
 *
 * All non-manual updates write a GoalContribution row, set goal.currentValue,
 * and check for milestone hits + completion.
 */

let activeTeardown: (() => void) | null = null;

export function startGoalsEngine(): () => void {
  if (activeTeardown) return activeTeardown;

  const offs: Array<() => void> = [];

  offs.push(
    eventBus.on('bill:paid', async (e) => {
      const goals = await activeGoals();

      for (const g of goals) {
        if (g.metric === 'bills_paid') {
          const links = g.linkedBillIds;
          if (links && links.length > 0 && !links.includes(e.billId)) continue;
          await applyDelta(g, 1, 'bill_paid', String(e.billId), `Bill paid — ${e.label}`);
        }
      }

      await refreshCashOnHandGoals('bill_paid', `Cash adjusted by paid bill — ${e.label}`);
    }),
  );

  offs.push(
    eventBus.on('cash:adjusted', async (e) => {
      await refreshCashOnHandGoals('cash_adjustment', `Cash move — ${e.label}`);
    }),
  );

  offs.push(
    eventBus.on('task:completed', async (e) => {
      const goals = await activeGoals();
      const streak = await db.streakState.get(1);
      const streakNow = streak?.current ?? 0;

      for (const g of goals) {
        if (g.metric === 'task_completions') {
          const links = g.linkedTaskIds;
          if (links && links.length > 0 && !links.includes(e.taskId)) continue;
          await applyDelta(g, 1, 'task_completed', String(e.taskId), `Task — ${e.title}`);
        } else if (g.metric === 'task_streak') {
          await applySnapshot(
            g,
            streakNow,
            'task_completed',
            String(e.taskId),
            `Streak now at ${streakNow}`,
          );
        }
      }
    }),
  );

  offs.push(
    eventBus.on('workout:logged', async (e) => {
      const goals = await activeGoals();
      for (const g of goals) {
        if (g.metric === 'workout_count') {
          await applyDelta(
            g,
            1,
            'workout_logged',
            String(e.sessionId),
            `Workout logged — ${e.summary}`,
          );
        } else if (g.metric === 'workout_volume') {
          const total = await computeLiftVolumeSince(g.createdAt);
          await applySnapshot(
            g,
            total,
            'workout_logged',
            String(e.sessionId),
            `Volume — ${total.toLocaleString()}`,
          );
        }
      }
    }),
  );

  offs.push(
    eventBus.on('pr:set', async (e) => {
      const goals = await activeGoals();
      for (const g of goals) {
        if (g.metric === 'pr_weight') {
          if (g.linkedExerciseId !== e.exerciseId) continue;
          if (e.weight > g.currentValue) {
            await applySnapshot(
              g,
              e.weight,
              'pr_set',
              String(e.exerciseId),
              `PR — ${e.exerciseName} ${e.weight}×${e.reps}`,
            );
          }
        } else if (g.metric === 'workout_volume') {
          const total = await computeLiftVolumeSince(g.createdAt);
          await applySnapshot(
            g,
            total,
            'pr_set',
            String(e.exerciseId),
            `PR — ${e.exerciseName} ${e.weight}×${e.reps}`,
          );
        }
      }
    }),
  );

  activeTeardown = () => {
    for (const off of offs) off();
    activeTeardown = null;
  };
  return activeTeardown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public — used by the manual contribution UI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies a manual delta to a goal — used for cash_saved_to_goal and
 * custom goals. Records a GoalContribution and runs milestone/completion
 * checks. Returns the updated goal or null when missing/completed.
 */
export async function contributeToGoal(args: {
  goalId: number;
  delta: number;
  label?: string;
}): Promise<Goal | null> {
  const goal = await db.goals.get(args.goalId);
  if (!goal || goal.status !== 'active') return null;
  return applyDelta(
    goal,
    args.delta,
    'manual',
    String(goal.id),
    args.label ?? 'Manual contribution',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal — DB writers
// ─────────────────────────────────────────────────────────────────────────────

async function activeGoals(): Promise<Goal[]> {
  const all = await db.goals.toArray();
  return all.filter((g) => g.status === 'active');
}

async function applyDelta(
  goal: Goal,
  delta: number,
  source: GoalContributionSource,
  sourceRef: string,
  label: string,
): Promise<Goal | null> {
  if (delta === 0) return goal;
  const newValue = clampValue(goal, goal.currentValue + delta);
  return persistContribution(goal, delta, newValue, source, sourceRef, label);
}

async function applySnapshot(
  goal: Goal,
  newValueRaw: number,
  source: GoalContributionSource,
  sourceRef: string,
  label: string,
): Promise<Goal | null> {
  const newValue = clampValue(goal, newValueRaw);
  const delta = newValue - goal.currentValue;
  if (delta === 0) return goal;
  return persistContribution(goal, delta, newValue, source, sourceRef, label);
}

function clampValue(goal: Goal, candidate: number): number {
  // Snapshots can decrease (e.g. cash_on_hand); deltas can also be negative.
  // Don't clamp to non-negative; keep values honest. But cap at target so
  // completion is a clean equality check.
  if (candidate > goal.targetValue) return goal.targetValue;
  return candidate;
}

interface PersistResult {
  updated: Goal;
  hitMilestones: GoalMilestone[];
  completed: boolean;
}

async function persistContribution(
  goal: Goal,
  delta: number,
  newValue: number,
  source: GoalContributionSource,
  sourceRef: string,
  label: string,
): Promise<Goal | null> {
  const result = await db.transaction(
    'rw',
    [db.goals, db.goalMilestones, db.goalContributions],
    async (): Promise<PersistResult | null> => {
      const fresh = await db.goals.get(goal.id!);
      if (!fresh || fresh.status !== 'active') return null;

      const recomputedNewValue = clampValue(fresh, fresh.currentValue + delta);
      const recomputedDelta = recomputedNewValue - fresh.currentValue;
      if (recomputedDelta === 0 && newValue !== fresh.targetValue) return null;

      const contribution: Omit<GoalContribution, 'id'> = {
        goalId: fresh.id!,
        delta: recomputedDelta,
        newValue: recomputedNewValue,
        source,
        sourceRef,
        label,
        at: Date.now(),
      };
      await db.goalContributions.add(contribution as GoalContribution);

      const isComplete = recomputedNewValue >= fresh.targetValue;
      const patch: Partial<Goal> = {
        currentValue: recomputedNewValue,
        updatedAt: Date.now(),
      };
      const completed = isComplete && fresh.status === 'active';
      if (completed) {
        patch.status = 'completed';
        patch.completedAt = Date.now();
      }
      await db.goals.update(fresh.id!, patch);

      const milestones = await db.goalMilestones.where('goalId').equals(fresh.id!).toArray();
      const hitMilestones: GoalMilestone[] = [];
      for (const m of milestones) {
        if (!m.reached && recomputedNewValue >= m.targetValue) {
          await db.goalMilestones.update(m.id!, { reached: true, reachedAt: Date.now() });
          hitMilestones.push({ ...m, reached: true, reachedAt: Date.now() });
        }
      }

      return { updated: { ...fresh, ...patch } as Goal, hitMilestones, completed };
    },
  );

  if (!result) return null;
  const { updated, hitMilestones, completed } = result;

  await eventBus.emit('goal:contribution', {
    goalId: updated.id!,
    delta,
    newValue,
    source,
    sourceRef,
    label,
  });

  for (const m of hitMilestones) {
    await eventBus.emit('goal:milestone', {
      goalId: updated.id!,
      milestoneId: m.id!,
      goalTitle: updated.title,
      milestoneTitle: m.title,
    });
  }

  if (completed) {
    const xpReward =
      updated.xpReward > 0
        ? updated.xpReward
        : BASE_XP.goalCompleteByDifficulty[updated.difficulty];
    const daysTaken = Math.max(
      1,
      daysBetween(new Date(updated.createdAt).toISOString().slice(0, 10), todayYmd()),
    );
    await eventBus.emit('goal:completed', {
      goalId: updated.id!,
      title: updated.title,
      difficulty: updated.difficulty,
      daysTaken,
      xpReward,
    });
  }

  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cash-on-hand snapshot
// ─────────────────────────────────────────────────────────────────────────────

async function refreshCashOnHandGoals(
  source: 'bill_paid' | 'cash_adjustment',
  label: string,
): Promise<void> {
  const goals = await activeGoals();
  const targets = goals.filter((g) => g.metric === 'cash_on_hand');
  if (targets.length === 0) return;
  // Money goals store values in cents to match the rest of the money domain.
  const cents = await computeCashOnHandCents();
  for (const g of targets) {
    await applySnapshot(g, cents, source, 'cash_on_hand', label);
  }
}

async function computeCashOnHandCents(): Promise<number> {
  const [incomes, payments, adjustments] = await Promise.all([
    db.incomes.toArray(),
    db.billPayments.toArray(),
    db.cashAdjustments.toArray(),
  ]);
  const now = Date.now();
  const oneTimeReceived = incomes
    .filter((i) => i.active && i.cadence === 'one-time' && i.startDate <= now)
    .reduce((s, i) => s + i.amount, 0);
  const totalAdjustments = adjustments.reduce((s, a) => s + a.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  return oneTimeReceived + totalAdjustments - totalPaid;
}

async function computeLiftVolumeSince(sinceMs: number): Promise<number> {
  const sessions = await db.workoutSessions.toArray();
  const liftIds = sessions
    .filter((s) => s.kind === 'lift' && s.startedAt >= sinceMs)
    .map((s) => s.id!)
    .filter(Boolean) as number[];
  if (liftIds.length === 0) return 0;
  const sets = await db.liftSets.where('sessionId').anyOf(liftIds).toArray();
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

// Re-export the metric type for screens that need the union.
export type { GoalMetric };
