import { db, nukeAllData, runSeeds } from '@/db';

/**
 * Per-module table groupings. Anything not listed here (settings, xpEvents,
 * streakState, scheduledNotifications) only round-trips through the full
 * backup — those are app-wide state that doesn't belong to one screen.
 */
export const MODULE_GROUPS = {
  money: {
    label: 'Money',
    tables: ['incomes', 'bills', 'billPayments', 'cashAdjustments'],
    blurb: 'Bills, income sources, payment history, and cash adjustments.',
  },
  tasks: {
    label: 'Tasks',
    tables: ['taskCategories', 'tasks', 'taskCompletions'],
    blurb: 'Categories, recurring/one-off tasks, and completion history.',
  },
  workouts: {
    label: 'Workouts',
    tables: [
      'exercises',
      'workoutSessions',
      'liftSets',
      'cardioEntries',
      'mobilityEntries',
      'personalRecords',
    ],
    blurb: 'Exercises, sessions, lift sets, cardio, mobility, and PRs.',
  },
  goals: {
    label: 'Goals',
    tables: ['goals', 'goalMilestones', 'goalContributions'],
    blurb: 'Goals, milestones, and contribution history.',
  },
  coach: {
    label: 'Coach',
    tables: ['notebookEntries', 'voiceQuipHistory', 'customQuips'],
    blurb: 'Notebook entries, custom quips, and voice history.',
  },
} as const;

export type ModuleId = keyof typeof MODULE_GROUPS;

/**
 * Backup / restore — full IndexedDB to a single JSON blob.
 *
 * Format: {
 *   version: 1,
 *   exportedAt: number,
 *   tables: { settings: [...], bills: [...], ... }
 * }
 *
 * Restore is destructive: it nukes the database, then bulkAdds every row
 * from the import inside one transaction. A schema-version mismatch
 * rejects the import — better to fail loudly than to land malformed
 * rows that crash live queries later.
 */

export const BACKUP_VERSION = 1;

export interface BackupBundle {
  version: number;
  exportedAt: number;
  tables: Record<string, unknown[]>;
}

export async function exportBackup(): Promise<BackupBundle> {
  const tables: Record<string, unknown[]> = {};
  await Promise.all(
    db.tables.map(async (t) => {
      tables[t.name] = await t.toArray();
    }),
  );
  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    tables,
  };
}

/** Triggers a browser download of the bundle as JSON. */
export function downloadBackup(bundle: BackupBundle): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date(bundle.exportedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `myos-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export class BackupVersionError extends Error {
  constructor(found: number) {
    super(`Backup version ${found} doesn't match current ${BACKUP_VERSION}.`);
    this.name = 'BackupVersionError';
  }
}

export async function importBackup(json: string): Promise<void> {
  const parsed = JSON.parse(json) as BackupBundle;
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup file.');
  if (parsed.version !== BACKUP_VERSION) throw new BackupVersionError(parsed.version);
  if (!parsed.tables || typeof parsed.tables !== 'object') {
    throw new Error('Backup is missing the tables section.');
  }

  await nukeAllData();
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) {
      const rows = parsed.tables[t.name];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      await t.bulkAdd(rows);
    }
  });
}

/**
 * Wipes everything and re-seeds from defaults. Onboarding will fire again
 * because settings.onboardingCompleted defaults to false.
 */
export async function resetApp(): Promise<void> {
  await nukeAllData();
  await runSeeds();
}

export interface ModuleBackupBundle {
  version: number;
  exportedAt: number;
  module: ModuleId;
  tables: Record<string, unknown[]>;
}

export async function exportModule(moduleId: ModuleId): Promise<ModuleBackupBundle> {
  const group = MODULE_GROUPS[moduleId];
  const tables: Record<string, unknown[]> = {};
  await Promise.all(
    group.tables.map(async (name) => {
      const table = db.table(name);
      tables[name] = await table.toArray();
    }),
  );
  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    module: moduleId,
    tables,
  };
}

export function downloadModuleBackup(bundle: ModuleBackupBundle): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date(bundle.exportedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `myos-${bundle.module}-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export class ModuleMismatchError extends Error {
  constructor(found: string, expected: ModuleId) {
    super(`This file is for the "${found}" module, not "${expected}".`);
    this.name = 'ModuleMismatchError';
  }
}

/**
 * Replaces every row in the module's tables with the rows from the file.
 * Other modules (and app-wide state like settings + XP) are untouched.
 *
 * If `expected` is provided, the file's `module` field must match — this
 * guards against accidentally restoring a Workouts file into the Money slot.
 */
export async function importModule(json: string, expected?: ModuleId): Promise<ModuleId> {
  const parsed = JSON.parse(json) as ModuleBackupBundle;
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup file.');
  if (parsed.version !== BACKUP_VERSION) throw new BackupVersionError(parsed.version);
  if (!parsed.module || !(parsed.module in MODULE_GROUPS)) {
    throw new Error('Backup is missing a recognized module field.');
  }
  if (expected && parsed.module !== expected) {
    throw new ModuleMismatchError(parsed.module, expected);
  }
  if (!parsed.tables || typeof parsed.tables !== 'object') {
    throw new Error('Backup is missing the tables section.');
  }

  const group = MODULE_GROUPS[parsed.module];
  const tables = group.tables.map((name) => db.table(name));
  await db.transaction('rw', tables, async () => {
    for (const name of group.tables) {
      const table = db.table(name);
      await table.clear();
      const rows = parsed.tables[name];
      if (Array.isArray(rows) && rows.length > 0) {
        await table.bulkAdd(rows);
      }
    }
  });
  return parsed.module;
}
