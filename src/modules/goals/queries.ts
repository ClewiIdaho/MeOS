import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  type Goal,
  type GoalMilestone,
  type GoalContribution,
  type GoalTier,
} from '@/db';
import { todayYmd, daysBetween, toYmd } from '@/utils/dates';

export interface GoalWithMilestones {
  goal: Goal;
  milestones: GoalMilestone[];
}

export interface GoalsByTier {
  primary: GoalWithMilestones[];
  secondary: GoalWithMilestones[];
  backburner: GoalWithMilestones[];
  completed: GoalWithMilestones[];
}

export function useGoalsByTier(): GoalsByTier | undefined {
  return useLiveQuery(async () => {
    const [goals, milestones] = await Promise.all([
      db.goals.toArray(),
      db.goalMilestones.toArray(),
    ]);
    const milestonesByGoal = new Map<number, GoalMilestone[]>();
    for (const m of milestones) {
      if (!milestonesByGoal.has(m.goalId)) milestonesByGoal.set(m.goalId, []);
      milestonesByGoal.get(m.goalId)!.push(m);
    }
    for (const list of milestonesByGoal.values()) {
      list.sort((a, b) => a.order - b.order);
    }

    const buckets: GoalsByTier = {
      primary: [],
      secondary: [],
      backburner: [],
      completed: [],
    };
    for (const g of goals) {
      const entry = { goal: g, milestones: milestonesByGoal.get(g.id!) ?? [] };
      if (g.status === 'completed') buckets.completed.push(entry);
      else if (g.tier === 'primary') buckets.primary.push(entry);
      else if (g.tier === 'secondary') buckets.secondary.push(entry);
      else buckets.backburner.push(entry);
    }
    const sortByCreated = (a: GoalWithMilestones, b: GoalWithMilestones) =>
      b.goal.createdAt - a.goal.createdAt;
    buckets.primary.sort(sortByCreated);
    buckets.secondary.sort(sortByCreated);
    buckets.backburner.sort(sortByCreated);
    buckets.completed.sort((a, b) => (b.goal.completedAt ?? 0) - (a.goal.completedAt ?? 0));
    return buckets;
  }, []);
}

export function useGoalContributions(goalId: number | undefined, limit = 10):
  | GoalContribution[]
  | undefined {
  return useLiveQuery(async () => {
    if (goalId === undefined) return [];
    const all = await db.goalContributions.where('goalId').equals(goalId).reverse().sortBy('at');
    return all.slice(0, limit);
  }, [goalId, limit]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pace math
// ─────────────────────────────────────────────────────────────────────────────

export type PaceBand = 'no-deadline' | 'completed' | 'ahead' | 'on-track' | 'behind' | 'overdue';

export interface PaceInfo {
  band: PaceBand;
  /** 0..1 progress toward target. */
  progress: number;
  /** Days remaining until deadline (clamped at 0). undefined when no deadline. */
  daysRemaining?: number;
  /** Required daily rate to hit target by deadline. undefined when no deadline. */
  requiredDailyRate?: number;
  /** Observed daily rate over the last 7 days. */
  recentDailyRate: number;
  /** ratio = recent / required. undefined when no deadline or required <= 0. */
  paceRatio?: number;
  /** Recent-window contribution sum, used to render a hint. */
  recent7d: number;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Derives pace info from goal + recent contributions. */
export function computePace(goal: Goal, contributions: GoalContribution[]): PaceInfo {
  const progress = goal.targetValue > 0 ? Math.min(1, goal.currentValue / goal.targetValue) : 0;
  const recent = contributions.filter((c) => c.at >= Date.now() - SEVEN_DAYS_MS);
  const recent7d = recent.reduce((s, c) => s + Math.max(0, c.delta), 0);
  const recentDailyRate = recent7d / 7;

  if (goal.status === 'completed') {
    return { band: 'completed', progress: 1, recentDailyRate, recent7d };
  }
  if (goal.deadline === undefined) {
    return { band: 'no-deadline', progress, recentDailyRate, recent7d };
  }

  const today = todayYmd();
  const deadlineYmd = toYmd(goal.deadline);
  const daysRemaining = Math.max(0, daysBetween(today, deadlineYmd));
  const remainingTarget = Math.max(0, goal.targetValue - goal.currentValue);

  if (daysRemaining === 0 && remainingTarget > 0) {
    return {
      band: 'overdue',
      progress,
      daysRemaining: 0,
      requiredDailyRate: remainingTarget,
      recentDailyRate,
      recent7d,
    };
  }
  if (remainingTarget === 0) {
    return {
      band: 'completed',
      progress: 1,
      daysRemaining,
      recentDailyRate,
      recent7d,
    };
  }

  const requiredDailyRate = remainingTarget / Math.max(1, daysRemaining);
  const paceRatio = requiredDailyRate > 0 ? recentDailyRate / requiredDailyRate : 0;

  let band: PaceBand;
  if (paceRatio >= 1.3) band = 'ahead';
  else if (paceRatio >= 1.0) band = 'on-track';
  else band = 'behind';

  return {
    band,
    progress,
    daysRemaining,
    requiredDailyRate,
    recentDailyRate,
    paceRatio,
    recent7d,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations — goals & milestones
// ─────────────────────────────────────────────────────────────────────────────

interface CreateGoalInput {
  title: string;
  description?: string;
  type: Goal['type'];
  tier: GoalTier;
  difficulty: Goal['difficulty'];
  metric: Goal['metric'];
  targetValue: number;
  unit: string;
  deadline?: number;
  linkedBillIds?: number[];
  linkedTaskIds?: number[];
  linkedExerciseId?: number;
  milestones?: Array<{ title: string; targetValue: number }>;
}

export async function createGoal(input: CreateGoalInput): Promise<number> {
  const now = Date.now();
  const xpRewardByDifficulty = { small: 100, medium: 500, legendary: 2000 } as const;

  let id = 0;
  await db.transaction('rw', [db.goals, db.goalMilestones], async () => {
    const goal: Omit<Goal, 'id'> = {
      title: input.title.trim(),
      type: input.type,
      tier: input.tier,
      difficulty: input.difficulty,
      metric: input.metric,
      targetValue: input.targetValue,
      currentValue: 0,
      unit: input.unit.trim(),
      status: 'active',
      xpReward: xpRewardByDifficulty[input.difficulty],
      createdAt: now,
      updatedAt: now,
      ...(input.description ? { description: input.description.trim() } : {}),
      ...(input.deadline !== undefined ? { deadline: input.deadline } : {}),
      ...(input.linkedBillIds && input.linkedBillIds.length > 0
        ? { linkedBillIds: input.linkedBillIds }
        : {}),
      ...(input.linkedTaskIds && input.linkedTaskIds.length > 0
        ? { linkedTaskIds: input.linkedTaskIds }
        : {}),
      ...(input.linkedExerciseId !== undefined
        ? { linkedExerciseId: input.linkedExerciseId }
        : {}),
    };
    id = (await db.goals.add(goal as Goal)) as number;

    const sortedMilestones = (input.milestones ?? [])
      .filter((m) => m.title.trim().length > 0 && m.targetValue > 0)
      .sort((a, b) => a.targetValue - b.targetValue);
    if (sortedMilestones.length > 0) {
      await db.goalMilestones.bulkAdd(
        sortedMilestones.map((m, idx) => ({
          goalId: id,
          title: m.title.trim(),
          targetValue: m.targetValue,
          reached: false,
          order: idx,
        })) as GoalMilestone[],
      );
    }
  });
  return id;
}

interface UpdateGoalInput {
  title?: string;
  description?: string;
  tier?: GoalTier;
  difficulty?: Goal['difficulty'];
  targetValue?: number;
  unit?: string;
  deadline?: number;
  linkedBillIds?: number[];
  linkedTaskIds?: number[];
  linkedExerciseId?: number;
}

export async function updateGoal(id: number, patch: UpdateGoalInput): Promise<void> {
  const cleaned: Partial<Goal> = { updatedAt: Date.now() };
  if (patch.title !== undefined) cleaned.title = patch.title.trim();
  if (patch.description !== undefined) cleaned.description = patch.description.trim();
  if (patch.tier !== undefined) cleaned.tier = patch.tier;
  if (patch.difficulty !== undefined) cleaned.difficulty = patch.difficulty;
  if (patch.targetValue !== undefined) cleaned.targetValue = patch.targetValue;
  if (patch.unit !== undefined) cleaned.unit = patch.unit.trim();
  if (patch.deadline !== undefined) cleaned.deadline = patch.deadline;
  if (patch.linkedBillIds !== undefined) cleaned.linkedBillIds = patch.linkedBillIds;
  if (patch.linkedTaskIds !== undefined) cleaned.linkedTaskIds = patch.linkedTaskIds;
  if (patch.linkedExerciseId !== undefined) cleaned.linkedExerciseId = patch.linkedExerciseId;
  await db.goals.update(id, cleaned);
}

export async function deleteGoal(id: number): Promise<void> {
  await db.transaction(
    'rw',
    [db.goals, db.goalMilestones, db.goalContributions],
    async () => {
      await db.goalContributions.where('goalId').equals(id).delete();
      await db.goalMilestones.where('goalId').equals(id).delete();
      await db.goals.delete(id);
    },
  );
}

export async function pauseGoal(id: number): Promise<void> {
  await db.goals.update(id, { status: 'paused', updatedAt: Date.now() });
}

export async function resumeGoal(id: number): Promise<void> {
  await db.goals.update(id, { status: 'active', updatedAt: Date.now() });
}
