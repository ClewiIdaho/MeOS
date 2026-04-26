import { db } from './schema';
import type { UserSettings, TaskCategory, StreakState } from './types';

/**
 * Default categories MY.OS ships with.
 * `isDefault: true` means the user can rename/recolor but not delete them.
 */
const defaultTaskCategories: Omit<TaskCategory, 'id'>[] = [
  { name: 'Work', color: '#8B5CF6', order: 0, isDefault: true },
  { name: 'Personal', color: '#10D9A0', order: 1, isDefault: true },
  { name: 'Health', color: '#FFB547', order: 2, isDefault: true },
  { name: 'Other', color: '#6B6890', order: 3, isDefault: true },
];

/**
 * The starting settings object. Until onboarding completes, `name` is empty.
 * After onboarding the name is set and `onboardingCompleted` flips true.
 */
function buildDefaultSettings(): UserSettings {
  const now = Date.now();
  return {
    id: 1,
    name: '',
    dailyXpGoal: 100,
    themeVariant: 'default',
    soundEnabled: true,
    notificationsEnabled: false,
    notificationCategories: {
      bills: true,
      dailyTasks: true,
      workouts: true,
      streaks: true,
      goalPace: true,
      weeklyRecap: true,
    },
    voiceIntensity: 'standard',
    weightUnit: 'lb',
    distanceUnit: 'mi',
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

function buildDefaultStreakState(): StreakState {
  return {
    id: 1,
    current: 0,
    longest: 0,
  };
}

/**
 * Idempotent first-launch seeder.
 * Safe to run on every app boot — it only writes when a singleton or category is missing.
 *
 * Returns a small report so the UI can confirm DB readiness during early phases.
 */
export interface SeedReport {
  freshInstall: boolean;
  settingsSeeded: boolean;
  streakSeeded: boolean;
  categoriesSeeded: number;
}

export async function runSeeds(): Promise<SeedReport> {
  const report: SeedReport = {
    freshInstall: false,
    settingsSeeded: false,
    streakSeeded: false,
    categoriesSeeded: 0,
  };

  await db.transaction(
    'rw',
    [db.settings, db.streakState, db.taskCategories],
    async () => {
      const existingSettings = await db.settings.get(1);
      if (!existingSettings) {
        await db.settings.put(buildDefaultSettings());
        report.settingsSeeded = true;
        report.freshInstall = true;
      }

      const existingStreak = await db.streakState.get(1);
      if (!existingStreak) {
        await db.streakState.put(buildDefaultStreakState());
        report.streakSeeded = true;
      }

      const existingCategories = await db.taskCategories.count();
      if (existingCategories === 0) {
        await db.taskCategories.bulkAdd(defaultTaskCategories);
        report.categoriesSeeded = defaultTaskCategories.length;
      }
    },
  );

  return report;
}

/**
 * Nukes every table. Used by the Settings → Reset App flow.
 * Caller is responsible for re-running `runSeeds()` after.
 */
export async function nukeAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
}
