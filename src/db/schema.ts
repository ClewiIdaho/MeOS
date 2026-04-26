import Dexie, { type Table } from 'dexie';
import type {
  UserSettings,
  Income,
  Bill,
  BillPayment,
  CashAdjustment,
  TaskCategory,
  Task,
  TaskCompletion,
  Exercise,
  WorkoutSession,
  LiftSet,
  CardioEntry,
  MobilityEntry,
  PersonalRecord,
  Goal,
  GoalMilestone,
  GoalContribution,
  XpEvent,
  StreakState,
  NotebookEntry,
  VoiceQuipHistory,
  CustomQuip,
  ScheduledNotification,
} from './types';

/**
 * MyOsDatabase — the single Dexie instance for MY.OS.
 *
 * Schema versioning rules:
 * - Bump `.version(N)` and add a new `.stores({...})` for any change.
 * - Never mutate an existing version block; always append.
 * - Use `.upgrade(tx => …)` for migrations that need data transformation.
 */
export class MyOsDatabase extends Dexie {
  // Settings
  settings!: Table<UserSettings, 1>;

  // Money
  incomes!: Table<Income, number>;
  bills!: Table<Bill, number>;
  billPayments!: Table<BillPayment, number>;
  cashAdjustments!: Table<CashAdjustment, number>;

  // Responsibilities
  taskCategories!: Table<TaskCategory, number>;
  tasks!: Table<Task, number>;
  taskCompletions!: Table<TaskCompletion, number>;

  // Workouts
  exercises!: Table<Exercise, number>;
  workoutSessions!: Table<WorkoutSession, number>;
  liftSets!: Table<LiftSet, number>;
  cardioEntries!: Table<CardioEntry, number>;
  mobilityEntries!: Table<MobilityEntry, number>;
  personalRecords!: Table<PersonalRecord, number>;

  // Goals
  goals!: Table<Goal, number>;
  goalMilestones!: Table<GoalMilestone, number>;
  goalContributions!: Table<GoalContribution, number>;

  // Level
  xpEvents!: Table<XpEvent, number>;
  streakState!: Table<StreakState, 1>;

  // Coach
  notebookEntries!: Table<NotebookEntry, number>;
  voiceQuipHistory!: Table<VoiceQuipHistory, number>;
  customQuips!: Table<CustomQuip, number>;

  // Notifications
  scheduledNotifications!: Table<ScheduledNotification, number>;

  constructor() {
    super('myos');

    // Index strategy: every table indexes its primary key, plus any field
    // we routinely filter or sort by. Compound indexes use square brackets.
    this.version(1).stores({
      settings: 'id',

      incomes: '++id, active, cadence, startDate, createdAt',
      bills: '++id, active, dueDay, createdAt',
      billPayments: '++id, billId, paidAt, forMonth, [billId+forMonth]',
      cashAdjustments: '++id, at',

      taskCategories: '++id, order, isDefault',
      tasks: '++id, active, cadence, categoryId, order, createdAt',
      taskCompletions:
        '++id, taskId, forDate, completedAt, [taskId+forDate]',

      exercises: '++id, name, kind, createdAt',
      workoutSessions: '++id, kind, startedAt, forDate',
      liftSets: '++id, sessionId, exerciseId, isPr, [exerciseId+weight]',
      cardioEntries: '++id, sessionId',
      mobilityEntries: '++id, sessionId',
      personalRecords: '++id, exerciseId, achievedAt',

      goals: '++id, status, tier, type, deadline, createdAt',
      goalMilestones: '++id, goalId, order, reached',
      goalContributions: '++id, goalId, at, [goalId+at]',

      xpEvents: '++id, at, forDate, source',
      streakState: 'id',

      notebookEntries: '++id, createdAt, updatedAt, fromVoice, *tags',
      voiceQuipHistory: '++id, category, shownAt, [category+shownAt]',
      customQuips: '++id, category, enabled',

      scheduledNotifications: '++id, kind, scheduledFor, fired, refId',
    });
  }
}

/** Singleton accessor. Created once on import; safe to use directly. */
export const db = new MyOsDatabase();
