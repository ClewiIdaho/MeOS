import { db, nukeAllData, runSeeds } from '@/db';

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
