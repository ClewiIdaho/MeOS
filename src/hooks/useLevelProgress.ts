import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { computeLevelProgress, type LevelProgress } from '@/utils/xp';

/**
 * Live level progress derived from the xpEvents log.
 * Updates automatically whenever XP is awarded.
 */
export function useLevelProgress(): LevelProgress | undefined {
  return useLiveQuery(async () => {
    const events = await db.xpEvents.toArray();
    const total = events.reduce((sum, e) => sum + e.delta, 0);
    return computeLevelProgress(total);
  }, []);
}
