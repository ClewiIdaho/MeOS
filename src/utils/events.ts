/**
 * MY.OS event bus — the spine.
 *
 * Modules emit semantic events ("a bill was paid", "a task was completed").
 * Engines (XP, streak, goals, voice, notifications) subscribe and react.
 *
 * No module talks to another module directly. They publish facts; engines
 * decide what to do with them. This is what turns five trackers into one OS.
 */

import type { GoalContributionSource, GoalDifficulty, WorkoutKind, XpSource } from '@/db';

export interface EventMap {
  // ── Module actions ────────────────────────────────────────────────────
  'task:completed': {
    taskId: number;
    title: string;
    cadence: 'daily' | 'weekly' | 'one-off';
    forDate: string;
  };
  'bill:paid': {
    billId: number;
    label: string;
    amountCents: number;
    forMonth: string;
  };
  'workout:logged': {
    sessionId: number;
    kind: WorkoutKind;
    summary: string;
    forDate: string;
  };
  'pr:set': {
    exerciseId: number;
    exerciseName: string;
    weight: number;
    reps: number;
  };
  'cash:adjusted': {
    deltaCents: number;
    label: string;
  };

  // ── Engine outputs ────────────────────────────────────────────────────
  'xp:awarded': {
    delta: number;
    source: XpSource;
    sourceRef?: string;
    description: string;
    /** XP total after this award. */
    totalAfter: number;
    levelBefore: number;
    levelAfter: number;
    leveledUp: boolean;
  };
  'level:up': {
    newLevel: number;
    previousLevel: number;
    rankName: string;
    rankChanged: boolean;
  };
  'streak:updated': {
    current: number;
    previous: number;
    longest: number;
    isMilestone: boolean;
    extended: boolean;
  };

  // ── Goal events ───────────────────────────────────────────────────────
  'goal:contribution': {
    goalId: number;
    delta: number;
    newValue: number;
    source: GoalContributionSource;
    sourceRef?: string;
    label: string;
  };
  'goal:milestone': {
    goalId: number;
    milestoneId: number;
    goalTitle: string;
    milestoneTitle: string;
  };
  'goal:completed': {
    goalId: number;
    title: string;
    difficulty: GoalDifficulty;
    daysTaken: number;
    xpReward: number;
  };
}

type EventName = keyof EventMap;
type Listener<K extends EventName> = (payload: EventMap[K]) => void | Promise<void>;
type AnyListener = (payload: unknown) => void | Promise<void>;

class EventBus {
  // Internally we store listeners in an untyped map; the public API enforces
  // the K↔payload contract at the call site.
  private listeners = new Map<EventName, Set<AnyListener>>();

  on<K extends EventName>(event: K, listener: Listener<K>): () => void {
    let bucket = this.listeners.get(event);
    if (!bucket) {
      bucket = new Set<AnyListener>();
      this.listeners.set(event, bucket);
    }
    const wrapped = listener as unknown as AnyListener;
    bucket.add(wrapped);
    return () => {
      bucket?.delete(wrapped);
    };
  }

  /**
   * Emits an event to all current listeners.
   * Listeners run sequentially in subscription order; thrown errors are caught
   * and logged so one bad listener can't break the whole pipeline.
   * Async listeners are awaited so callers can rely on completion ordering.
   */
  async emit<K extends EventName>(event: K, payload: EventMap[K]): Promise<void> {
    const bucket = this.listeners.get(event);
    if (!bucket) return;
    for (const listener of [...bucket]) {
      try {
        await listener(payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[events] listener for "${event}" threw`, err);
      }
    }
  }

  /** Test/diagnostic — returns the count of active listeners for an event. */
  listenerCount<K extends EventName>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export const eventBus = new EventBus();
