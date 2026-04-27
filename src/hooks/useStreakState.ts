import { useLiveQuery } from 'dexie-react-hooks';
import { db, type StreakState } from '@/db';

export function useStreakState(): StreakState | undefined {
  return useLiveQuery(() => db.streakState.get(1), []);
}
