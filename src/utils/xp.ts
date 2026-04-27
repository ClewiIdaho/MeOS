/**
 * MY.OS — XP curve, levels, ranks, and streak multipliers.
 *
 * The curve is deliberately tiered (rather than a smooth exponential) so each
 * tier transition feels like a real event. Per-level cost rises sharply at
 * tier boundaries, gentle within a tier.
 */

export const MAX_LEVEL = 100;

export type RankName =
  | 'Apprentice'
  | 'Operator'
  | 'Architect'
  | 'Vanguard'
  | 'Sovereign'
  | 'Mythic'
  | 'Ascendant';

interface RankBand {
  minLevel: number;
  maxLevel: number;
  name: RankName;
}

export const RANK_BANDS: readonly RankBand[] = [
  { minLevel: 1, maxLevel: 10, name: 'Apprentice' },
  { minLevel: 11, maxLevel: 25, name: 'Operator' },
  { minLevel: 26, maxLevel: 45, name: 'Architect' },
  { minLevel: 46, maxLevel: 70, name: 'Vanguard' },
  { minLevel: 71, maxLevel: 90, name: 'Sovereign' },
  { minLevel: 91, maxLevel: 99, name: 'Mythic' },
  { minLevel: 100, maxLevel: 100, name: 'Ascendant' },
] as const;

/** XP cost to advance FROM (level - 1) TO (level). */
function costToReach(level: number): number {
  if (level <= 1) return 0;
  if (level <= 10) return 100;
  if (level <= 25) return 250;
  if (level <= 45) return 500;
  if (level <= 70) return 1000;
  if (level <= 90) return 2000;
  if (level <= 99) return 4500;
  if (level === 100) return 10000;
  return Number.POSITIVE_INFINITY;
}

/**
 * Cumulative XP required to BE at level N. Index 0 is unused.
 * Precomputed once at module load.
 */
const CUMULATIVE_XP: number[] = (() => {
  const arr = [0, 0]; // index 0 unused, index 1 = level 1 = 0 XP
  let total = 0;
  for (let level = 2; level <= MAX_LEVEL; level++) {
    total += costToReach(level);
    arr[level] = total;
  }
  return arr;
})();

export const TOTAL_XP_TO_MAX = CUMULATIVE_XP[MAX_LEVEL]!;

/** Total XP threshold required to reach `level`. Level 1 = 0. */
export function xpToReachLevel(level: number): number {
  if (level < 1) return 0;
  if (level >= MAX_LEVEL) return TOTAL_XP_TO_MAX;
  return CUMULATIVE_XP[level]!;
}

/** Level for a given lifetime XP total. */
export function levelForXp(xp: number): number {
  if (xp <= 0) return 1;
  if (xp >= TOTAL_XP_TO_MAX) return MAX_LEVEL;
  // Binary search for the highest level whose threshold <= xp.
  let lo = 1;
  let hi = MAX_LEVEL;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (CUMULATIVE_XP[mid]! <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function rankForLevel(level: number): RankName {
  for (const band of RANK_BANDS) {
    if (level >= band.minLevel && level <= band.maxLevel) return band.name;
  }
  return 'Apprentice';
}

export interface LevelProgress {
  level: number;
  rank: RankName;
  /** Total XP earned ever. */
  totalXp: number;
  /** XP at the start of the current level. */
  xpAtLevel: number;
  /** XP threshold for the next level (Infinity at max). */
  xpForNext: number;
  /** XP earned within the current level. */
  xpInCurrent: number;
  /** XP cost of the current level — i.e. xpForNext - xpAtLevel. */
  xpSpan: number;
  /** 0..1 progress toward next level. 1 at max level. */
  progress: number;
  isMaxLevel: boolean;
}

export function computeLevelProgress(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp));
  const level = levelForXp(xp);
  const xpAtLevel = xpToReachLevel(level);
  const isMax = level >= MAX_LEVEL;
  const xpForNext = isMax ? Number.POSITIVE_INFINITY : xpToReachLevel(level + 1);
  const xpSpan = isMax ? 0 : xpForNext - xpAtLevel;
  const xpInCurrent = xp - xpAtLevel;
  const progress = isMax ? 1 : Math.min(1, xpInCurrent / xpSpan);
  return {
    level,
    rank: rankForLevel(level),
    totalXp: xp,
    xpAtLevel,
    xpForNext,
    xpInCurrent,
    xpSpan,
    progress,
    isMaxLevel: isMax,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Streak multipliers
// ─────────────────────────────────────────────────────────────────────────────

export interface StreakMultiplierBand {
  minDays: number;
  multiplier: number;
}

export const STREAK_MULTIPLIERS: readonly StreakMultiplierBand[] = [
  { minDays: 60, multiplier: 2.0 },
  { minDays: 30, multiplier: 1.5 },
  { minDays: 14, multiplier: 1.2 },
  { minDays: 7, multiplier: 1.1 },
  { minDays: 0, multiplier: 1.0 },
] as const;

/** Multiplier for the current streak length (in consecutive active days). */
export function streakMultiplier(streakDays: number): number {
  for (const band of STREAK_MULTIPLIERS) {
    if (streakDays >= band.minDays) return band.multiplier;
  }
  return 1.0;
}

/** Streak day counts that trigger an in-app celebration. */
export const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 30, 60, 100, 200, 365];

export function isStreakMilestone(days: number): boolean {
  return STREAK_MILESTONES.includes(days);
}

// ─────────────────────────────────────────────────────────────────────────────
// Base XP values per action — multiplied by streak multiplier at award time.
// ─────────────────────────────────────────────────────────────────────────────

export const BASE_XP = {
  task: { daily: 10, weekly: 25, 'one-off': 15 },
  bill: 25,
  workout: { lift: 50, cardio: 35, mobility: 20, rest: 5 },
  prSet: 75,
  goalMilestone: 50,
  // Goal completion XP comes from the goal's stored xpReward (per difficulty).
  goalCompleteByDifficulty: { small: 100, medium: 500, legendary: 2000 },
  streakMilestoneByDays: {
    3: 25,
    7: 50,
    14: 100,
    30: 250,
    60: 500,
    100: 1000,
    200: 2000,
    365: 5000,
  } as Record<number, number>,
} as const;

/** Applies the streak multiplier to a base XP value, rounding to whole points. */
export function withStreakBonus(baseXp: number, streakDays: number): number {
  return Math.round(baseXp * streakMultiplier(streakDays));
}
