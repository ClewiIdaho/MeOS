import { useEffect, useState, useCallback } from 'react';
import { eventBus } from '@/utils/events';

export interface LevelUpEvent {
  newLevel: number;
  previousLevel: number;
  rankName: string;
  rankChanged: boolean;
  /** Monotonic id for keying / queue dedupe. */
  key: number;
}

/**
 * Subscribes to `level:up` and queues overlay payloads. The Shell renders
 * the head of the queue; calling dismiss() advances.
 *
 * A queue (rather than a single value) handles the rare case of two
 * level-ups in rapid succession from the same XP award — for example a goal
 * completion that crosses two thresholds.
 */
export function useLevelUpListener(): {
  current: LevelUpEvent | undefined;
  dismiss: () => void;
} {
  const [queue, setQueue] = useState<LevelUpEvent[]>([]);

  useEffect(() => {
    let nextKey = 1;
    const off = eventBus.on('level:up', (e) => {
      setQueue((q) => [
        ...q,
        {
          newLevel: e.newLevel,
          previousLevel: e.previousLevel,
          rankName: e.rankName,
          rankChanged: e.rankChanged,
          key: nextKey++,
        },
      ]);
    });
    return off;
  }, []);

  const dismiss = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  return { current: queue[0], dismiss };
}
