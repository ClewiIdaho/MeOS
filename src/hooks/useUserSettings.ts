import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserSettings } from '@/db';

/**
 * Live-subscribes to the singleton settings row.
 * Returns `undefined` until the first read resolves.
 */
export function useUserSettings(): UserSettings | undefined {
  return useLiveQuery(() => db.settings.get(1), []);
}

/**
 * Patches the settings row. Pass only the fields that change.
 * Caller doesn't need to set `updatedAt` — we handle it.
 */
export async function updateUserSettings(
  patch: Partial<Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  await db.settings.update(1, { ...patch, updatedAt: Date.now() });
}
