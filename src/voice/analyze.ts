import { db, type XpSource } from '@/db';
import { addDaysYmd, todayYmd } from '@/utils/dates';
import { computeLevelProgress, type RankName } from '@/utils/xp';
import type { QuipParams } from './types';

/**
 * weekAnalyzer — reads the last 7 local-days of activity and produces the
 * shape Voice quips and the recap card render against.
 *
 * It reads tables freely because it's a utility, not a module. Modules don't
 * cross boundaries; engines and analyzers (which are not user-facing) do.
 */

export interface WeekRecap {
  /** YMD of the earliest day in the window (today − 6). */
  windowStart: string;
  /** YMD of today (inclusive). */
  windowEnd: string;
  /** XP earned in the window (last 7 local-days, inclusive). */
  xpThisWeek: number;
  /** XP earned today only. */
  xpToday: number;
  /** Days in the window where xp >= settings.dailyXpGoal, as a percentage 0–100 (rounded). */
  dailyGoalRatio: number;
  /** Current streak length. */
  streak: number;
  /** Current level. */
  level: number;
  /** Current rank name. */
  rank: RankName;
  /** Number of PRs set in the window. */
  prCount: number;
  /** Number of unpaid bills past their due day in the current calendar month. */
  missedBills: number;
  /** Workout sessions logged in the window (any kind). */
  workouts: number;
  /** Tasks completed (TaskCompletion rows) in the window. */
  tasks: number;
  /** Friendly label of the highest-XP source category in the window, or 'nothing yet'. */
  topCategory: string;
  /** Cash on hand in cents (lifetime). */
  cashOnHandCents: number;
}

/**
 * Returns a default 'name' parameter (from settings) plus all the numeric
 * fields a quip might want to interpolate.
 */
export function recapToParams(name: string | undefined, recap: WeekRecap): QuipParams {
  return {
    ...(name ? { name } : {}),
    streak: recap.streak,
    xpThisWeek: recap.xpThisWeek,
    xpToday: recap.xpToday,
    level: recap.level,
    rank: recap.rank,
    topCategory: recap.topCategory,
    prCount: recap.prCount,
    missedBills: recap.missedBills,
    workouts: recap.workouts,
    tasks: recap.tasks,
    dailyGoalRatio: recap.dailyGoalRatio,
  };
}

const SOURCE_LABELS: Record<XpSource, string> = {
  task_completed: 'tasks',
  bill_paid: 'bills',
  workout_logged: 'workouts',
  pr_set: 'lifts',
  goal_milestone: 'goal milestones',
  goal_completed: 'goal closeouts',
  streak_milestone: 'streak wins',
  manual: 'manual moves',
};

export async function weekAnalyzer(): Promise<WeekRecap> {
  const today = todayYmd();
  const windowStart = addDaysYmd(today, -6);

  const [
    xpEvents,
    settings,
    streak,
    sessions,
    completions,
    prs,
    bills,
    payments,
    incomes,
    cashAdjustments,
  ] = await Promise.all([
    db.xpEvents.toArray(),
    db.settings.get(1),
    db.streakState.get(1),
    db.workoutSessions.toArray(),
    db.taskCompletions.toArray(),
    db.personalRecords.toArray(),
    db.bills.toArray(),
    db.billPayments.toArray(),
    db.incomes.toArray(),
    db.cashAdjustments.toArray(),
  ]);

  const dailyGoal = settings?.dailyXpGoal ?? 100;

  const inWindow = xpEvents.filter((e) => e.forDate >= windowStart && e.forDate <= today);
  const xpThisWeek = inWindow.reduce((s, e) => s + e.delta, 0);
  const xpToday = inWindow.filter((e) => e.forDate === today).reduce((s, e) => s + e.delta, 0);

  const xpByDay = new Map<string, number>();
  for (const e of inWindow) {
    xpByDay.set(e.forDate, (xpByDay.get(e.forDate) ?? 0) + e.delta);
  }
  let goalDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDaysYmd(windowStart, i);
    if ((xpByDay.get(d) ?? 0) >= dailyGoal) goalDays += 1;
  }
  const dailyGoalRatio = Math.round((goalDays / 7) * 100);

  const xpBySource = new Map<XpSource, number>();
  for (const e of inWindow) {
    xpBySource.set(e.source, (xpBySource.get(e.source) ?? 0) + e.delta);
  }
  let topCategory = 'nothing yet';
  let topXp = 0;
  for (const [source, xp] of xpBySource) {
    if (xp > topXp) {
      topXp = xp;
      topCategory = SOURCE_LABELS[source] ?? source;
    }
  }

  const windowStartMs = Date.parse(`${windowStart}T00:00`);
  const prCount = prs.filter((p) => p.achievedAt >= windowStartMs).length;
  const workouts = sessions.filter(
    (s) => s.forDate >= windowStart && s.forDate <= today,
  ).length;
  const tasks = completions.filter(
    (c) => c.forDate >= windowStart && c.forDate <= today,
  ).length;

  // Missed bills: active bills whose clamped due date is past in the current
  // calendar month and which have no payment row for that month.
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const missedBills = bills.filter((b) => {
    if (!b.active) return false;
    const dueDay = Math.min(Math.max(1, b.dueDay), lastDay);
    const dueMs = new Date(now.getFullYear(), now.getMonth(), dueDay).getTime();
    if (dueMs >= todayMidnight) return false;
    return !payments.some((p) => p.billId === b.id && p.forMonth === ym);
  }).length;

  const oneTimeReceived = incomes
    .filter((i) => i.active && i.cadence === 'one-time' && i.startDate <= now.getTime())
    .reduce((s, i) => s + i.amount, 0);
  const totalAdjustments = cashAdjustments.reduce((s, a) => s + a.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const cashOnHandCents = oneTimeReceived + totalAdjustments - totalPaid;

  const totalXp = xpEvents.reduce((s, e) => s + e.delta, 0);
  const progress = computeLevelProgress(totalXp);

  return {
    windowStart,
    windowEnd: today,
    xpThisWeek,
    xpToday,
    dailyGoalRatio,
    streak: streak?.current ?? 0,
    level: progress.level,
    rank: progress.rank,
    prCount,
    missedBills,
    workouts,
    tasks,
    topCategory,
    cashOnHandCents,
  };
}
