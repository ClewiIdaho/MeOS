import { db } from '@/db';
import { eventBus } from '@/utils/events';
import { BASE_XP, withStreakBonus } from '@/utils/xp';
import { awardXp } from './xpEngine';
import { recordActiveDay } from './streakEngine';

/**
 * Wires module action events to the XP and streak engines.
 *
 * Lifecycle:
 *   const teardown = startActionOrchestrator();
 *   // ... later
 *   teardown();
 *
 * Idempotency: this function tracks whether the orchestrator is already
 * running. Calling it twice returns the same teardown closure and does not
 * double-subscribe (important under React StrictMode).
 */

let activeTeardown: (() => void) | null = null;

async function currentStreakDays(): Promise<number> {
  const state = await db.streakState.get(1);
  return state?.current ?? 0;
}

export function startActionOrchestrator(): () => void {
  if (activeTeardown) return activeTeardown;

  const offs: Array<() => void> = [];

  offs.push(
    eventBus.on('task:completed', async (e) => {
      const streak = await currentStreakDays();
      const baseXp =
        e.cadence === 'daily'
          ? BASE_XP.task.daily
          : e.cadence === 'weekly'
            ? BASE_XP.task.weekly
            : BASE_XP.task['one-off'];
      const delta = withStreakBonus(baseXp, streak);
      await awardXp({
        delta,
        source: 'task_completed',
        description: `Task — ${e.title}`,
        sourceRef: String(e.taskId),
        forDate: e.forDate,
      });
      await recordActiveDay();
    }),
  );

  offs.push(
    eventBus.on('bill:paid', async (e) => {
      const streak = await currentStreakDays();
      const delta = withStreakBonus(BASE_XP.bill, streak);
      const dollars = (e.amountCents / 100).toFixed(2);
      await awardXp({
        delta,
        source: 'bill_paid',
        description: `Bill paid — ${e.label} ($${dollars})`,
        sourceRef: String(e.billId),
      });
      await recordActiveDay();
    }),
  );

  offs.push(
    eventBus.on('workout:logged', async (e) => {
      const streak = await currentStreakDays();
      const baseXp =
        e.kind === 'lift'
          ? BASE_XP.workout.lift
          : e.kind === 'cardio'
            ? BASE_XP.workout.cardio
            : e.kind === 'mobility'
              ? BASE_XP.workout.mobility
              : BASE_XP.workout.rest;
      const delta = withStreakBonus(baseXp, streak);
      await awardXp({
        delta,
        source: 'workout_logged',
        description: `Workout — ${e.summary}`,
        sourceRef: String(e.sessionId),
        forDate: e.forDate,
      });
      await recordActiveDay();
    }),
  );

  offs.push(
    eventBus.on('pr:set', async (e) => {
      const streak = await currentStreakDays();
      const delta = withStreakBonus(BASE_XP.prSet, streak);
      await awardXp({
        delta,
        source: 'pr_set',
        description: `PR — ${e.exerciseName} ${e.weight}×${e.reps}`,
        sourceRef: String(e.exerciseId),
      });
      // No recordActiveDay here — the workout:logged event already did.
    }),
  );

  offs.push(
    eventBus.on('goal:milestone', async (e) => {
      await awardXp({
        delta: BASE_XP.goalMilestone,
        source: 'goal_milestone',
        description: `Milestone hit — ${e.milestoneTitle} (${e.goalTitle})`,
        sourceRef: String(e.milestoneId),
      });
    }),
  );

  offs.push(
    eventBus.on('goal:completed', async (e) => {
      await awardXp({
        delta: e.xpReward,
        source: 'goal_completed',
        description: `Goal complete — ${e.title}`,
        sourceRef: String(e.goalId),
      });
    }),
  );

  activeTeardown = () => {
    for (const off of offs) off();
    activeTeardown = null;
  };
  return activeTeardown;
}
