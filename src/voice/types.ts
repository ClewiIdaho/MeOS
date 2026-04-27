import type { VoiceIntensity } from '@/db';

export type QuipCategory =
  | 'recap'
  | 'push'
  | 'real_talk'
  | 'streak_milestone'
  | 'level_up'
  | 'goal_complete'
  | 'pr_set'
  | 'overdue_bill'
  | 'lazy_day'
  | 'all_done'
  | 'big_xp_day'
  | 'small_xp_day';

export interface Quip {
  text: string;
  intensity: VoiceIntensity;
}

/**
 * Parameters available for templated quips.
 * Any {token} not present at substitution time is removed silently.
 */
export interface QuipParams {
  name?: string;
  streak?: number;
  xpThisWeek?: number;
  xpToday?: number;
  level?: number;
  rank?: string;
  topCategory?: string;
  prCount?: number;
  missedBills?: number;
  workouts?: number;
  tasks?: number;
  dailyGoalRatio?: number;
  goalTitle?: string;
  newLevel?: number;
}
