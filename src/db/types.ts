/**
 * MY.OS — entity types.
 * Single source of truth for everything that lives in IndexedDB.
 *
 * Conventions:
 * - All `id` fields are auto-incremented (Dexie `++id`) and optional on insert.
 * - All timestamps are epoch milliseconds (`number`), unless suffixed `Date` which is a `YYYY-MM-DD` string.
 * - All money values are stored as integers in cents to avoid float drift.
 * - Singletons (UserSettings, StreakState) use a fixed `id: 1` literal.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Settings (singleton)
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeVariant = 'default' | 'aurora';
export type VoiceIntensity = 'mellow' | 'standard' | 'spicy';
export type WeightUnit = 'lb' | 'kg';
export type DistanceUnit = 'mi' | 'km';

export interface UserSettings {
  id: 1;
  name: string;
  dailyXpGoal: number;
  themeVariant: ThemeVariant;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  notificationCategories: {
    bills: boolean;
    dailyTasks: boolean;
    workouts: boolean;
    streaks: boolean;
    goalPace: boolean;
    weeklyRecap: boolean;
  };
  voiceIntensity: VoiceIntensity;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  /** HH:mm 24h. Optional. */
  dailyTaskReminderTime?: string;
  /** Days of week 0–6 (Sun–Sat) on which to remind about workouts. */
  workoutReminderDays?: number[];
  workoutReminderTime?: string;
  onboardingCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Money
// ─────────────────────────────────────────────────────────────────────────────

export type IncomeCadence = 'one-time' | 'weekly' | 'biweekly' | 'monthly';

export interface Income {
  id?: number;
  label: string;
  /** Cents. */
  amount: number;
  cadence: IncomeCadence;
  /** epoch ms — first instance / one-time receipt date. */
  startDate: number;
  active: boolean;
  notes?: string;
  createdAt: number;
}

export interface Bill {
  id?: number;
  label: string;
  /** Cents. */
  amount: number;
  /** Day of month 1–31 the bill is due. */
  dueDay: number;
  category?: string;
  notes?: string;
  active: boolean;
  createdAt: number;
}

export interface BillPayment {
  id?: number;
  billId: number;
  /** epoch ms */
  paidAt: number;
  /** Cents actually paid (lets users record partial payments). */
  amount: number;
  /** YYYY-MM — which billing month this payment satisfies. */
  forMonth: string;
}

export interface CashAdjustment {
  id?: number;
  /** Signed cents — positive for incoming, negative for spending. */
  amount: number;
  label: string;
  at: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Responsibilities (Tasks)
// ─────────────────────────────────────────────────────────────────────────────

export type TaskCadence = 'daily' | 'weekly' | 'one-off';

export interface TaskCategory {
  id?: number;
  name: string;
  /** Hex color used for chips, dots, ring accents. */
  color: string;
  order: number;
  /** Default categories cannot be deleted (only edited). */
  isDefault: boolean;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  cadence: TaskCadence;
  categoryId?: number;
  /** Optional per-task reminder. Falls back to global daily reminder. */
  reminderTime?: string;
  order: number;
  active: boolean;
  createdAt: number;
  /** For one-off tasks only — set on completion to retire from active list. */
  completedAt?: number;
}

export interface TaskCompletion {
  id?: number;
  taskId: number;
  completedAt: number;
  /** YYYY-MM-DD — the local-day this completion satisfies. */
  forDate: string;
  xpAwarded: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Workouts
// ─────────────────────────────────────────────────────────────────────────────

export type WorkoutKind = 'lift' | 'cardio' | 'mobility' | 'rest';

export interface Exercise {
  id?: number;
  name: string;
  /** Currently 'lift' only — cardio/mobility have free-form types per session. */
  kind: 'lift';
  createdAt: number;
}

export interface WorkoutSession {
  id?: number;
  kind: WorkoutKind;
  startedAt: number;
  endedAt?: number;
  /** YYYY-MM-DD — the local-day this session counts for. */
  forDate: string;
  notes?: string;
}

export interface LiftSet {
  id?: number;
  sessionId: number;
  exerciseId: number;
  setIndex: number;
  reps: number;
  /** Stored in user's chosen weightUnit; conversion handled at display time. */
  weight: number;
  rpe?: number;
  isPr: boolean;
}

export interface CardioEntry {
  id?: number;
  sessionId: number;
  /** Free-form: 'run', 'bike', 'row', 'walk', 'swim', etc. */
  cardioType: string;
  durationMinutes: number;
  distance?: number;
  unit?: DistanceUnit;
}

export interface MobilityEntry {
  id?: number;
  sessionId: number;
  durationMinutes: number;
  /** Free-form: 'hips', 'shoulders', 'lower back', 'full-body'. */
  focus?: string;
}

export interface PersonalRecord {
  id?: number;
  exerciseId: number;
  weight: number;
  reps: number;
  achievedAt: number;
  setId: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Goals (the connective tissue)
// ─────────────────────────────────────────────────────────────────────────────

export type GoalType = 'money' | 'habit' | 'performance' | 'custom';
export type GoalTier = 'primary' | 'secondary' | 'backburner';
export type GoalDifficulty = 'small' | 'medium' | 'legendary';
export type GoalStatus = 'active' | 'paused' | 'completed';
export type GoalMetric =
  | 'cash_on_hand'
  | 'cash_saved_to_goal'
  | 'bills_paid'
  | 'task_completions'
  | 'task_streak'
  | 'workout_count'
  | 'workout_volume'
  | 'pr_weight'
  | 'custom';

export interface Goal {
  id?: number;
  title: string;
  description?: string;
  type: GoalType;
  tier: GoalTier;
  difficulty: GoalDifficulty;
  /** Numeric target — meaning depends on `metric`. */
  targetValue: number;
  currentValue: number;
  /** Display unit — '$', 'tasks', 'workouts', 'lb', 'days', etc. */
  unit: string;
  /** epoch ms */
  deadline?: number;
  metric: GoalMetric;
  /** Optional links to drive auto-tracking. */
  linkedBillIds?: number[];
  linkedTaskIds?: number[];
  linkedExerciseId?: number;
  status: GoalStatus;
  completedAt?: number;
  /** Awarded once on completion based on difficulty. */
  xpReward: number;
  createdAt: number;
  updatedAt: number;
}

export interface GoalMilestone {
  id?: number;
  goalId: number;
  title: string;
  targetValue: number;
  reached: boolean;
  reachedAt?: number;
  order: number;
}

export type GoalContributionSource =
  | 'manual'
  | 'bill_paid'
  | 'task_completed'
  | 'workout_logged'
  | 'pr_set'
  | 'income'
  | 'cash_adjustment';

export interface GoalContribution {
  id?: number;
  goalId: number;
  /** Signed delta applied to currentValue. */
  delta: number;
  newValue: number;
  source: GoalContributionSource;
  /** Stringified id of the originating record. */
  sourceRef?: string;
  /** Human-readable label like "Paid Verizon — +$120 toward Save $2k". */
  label: string;
  at: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Level / XP
// ─────────────────────────────────────────────────────────────────────────────

export type XpSource =
  | 'task_completed'
  | 'bill_paid'
  | 'workout_logged'
  | 'pr_set'
  | 'goal_milestone'
  | 'goal_completed'
  | 'streak_milestone'
  | 'manual';

export interface XpEvent {
  id?: number;
  delta: number;
  source: XpSource;
  sourceRef?: string;
  description: string;
  at: number;
  /** YYYY-MM-DD — the local-day for daily-goal aggregation. */
  forDate: string;
}

export interface StreakState {
  id: 1;
  /** Days in a row of having any qualifying activity. */
  current: number;
  longest: number;
  /** YYYY-MM-DD of the most recent active day. */
  lastActiveDate?: string;
  lastWarningSentAt?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Coach
// ─────────────────────────────────────────────────────────────────────────────

export interface NotebookEntry {
  id?: number;
  title: string;
  body: string;
  tags: string[];
  /** True if this entry was saved from a Voice quip. */
  fromVoice: boolean;
  voiceCategory?: string;
  createdAt: number;
  updatedAt: number;
}

/** Tracks which quips have been shown so we can avoid recent repeats. */
export interface VoiceQuipHistory {
  id?: number;
  category: string;
  quipText: string;
  shownAt: number;
}

/** User-authored quips mixed into the pool via Voice Studio. */
export interface CustomQuip {
  id?: number;
  category: string;
  text: string;
  enabled: boolean;
  createdAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationKind =
  | 'bill_due'
  | 'daily_task'
  | 'workout'
  | 'streak_warning'
  | 'goal_pace'
  | 'weekly_recap';

export interface ScheduledNotification {
  id?: number;
  kind: NotificationKind;
  /** Optional id of the related entity (bill id, task id, etc.). */
  refId?: number;
  /** epoch ms — when to fire. */
  scheduledFor: number;
  fired: boolean;
  title: string;
  body: string;
  createdAt: number;
}
