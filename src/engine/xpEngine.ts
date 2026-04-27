import { db } from '@/db';
import type { XpEvent, XpSource } from '@/db';
import { eventBus } from '@/utils/events';
import { computeLevelProgress, rankForLevel } from '@/utils/xp';
import { todayYmd } from '@/utils/dates';

interface AwardArgs {
  delta: number;
  source: XpSource;
  description: string;
  sourceRef?: string;
  /** If supplied, used as the YMD; otherwise today (local). */
  forDate?: string;
}

/**
 * Awards XP atomically, computes whether a level transition occurred, and
 * emits `xp:awarded` (always) plus `level:up` (when the level changes).
 *
 * Returns the resulting level progress for callers that need to render it.
 */
export async function awardXp(args: AwardArgs) {
  if (args.delta === 0) return null;

  const ymd = args.forDate ?? todayYmd();
  const at = Date.now();

  let totalBefore = 0;
  let totalAfter = 0;
  let event: XpEvent | undefined;

  await db.transaction('rw', db.xpEvents, async () => {
    const all = await db.xpEvents.toArray();
    totalBefore = all.reduce((s, e) => s + e.delta, 0);

    const newEvent: XpEvent = {
      delta: args.delta,
      source: args.source,
      description: args.description,
      ...(args.sourceRef !== undefined ? { sourceRef: args.sourceRef } : {}),
      at,
      forDate: ymd,
    };
    const id = await db.xpEvents.add(newEvent);
    event = { ...newEvent, id };
    totalAfter = totalBefore + args.delta;
  });

  const before = computeLevelProgress(totalBefore);
  const after = computeLevelProgress(totalAfter);
  const leveledUp = after.level > before.level;

  await eventBus.emit('xp:awarded', {
    delta: args.delta,
    source: args.source,
    ...(args.sourceRef !== undefined ? { sourceRef: args.sourceRef } : {}),
    description: args.description,
    totalAfter,
    levelBefore: before.level,
    levelAfter: after.level,
    leveledUp,
  });

  if (leveledUp) {
    const rankBefore = rankForLevel(before.level);
    const rankAfter = rankForLevel(after.level);
    await eventBus.emit('level:up', {
      newLevel: after.level,
      previousLevel: before.level,
      rankName: rankAfter,
      rankChanged: rankAfter !== rankBefore,
    });
  }

  return { event, before, after, leveledUp };
}

/** Pure aggregator — current lifetime XP across all events. Useful for hooks. */
export async function getLifetimeXp(): Promise<number> {
  const events = await db.xpEvents.toArray();
  return events.reduce((sum, e) => sum + e.delta, 0);
}

/** Sum XP earned on a specific local-day. Used for daily XP goal tracking. */
export async function getXpForDate(ymd: string): Promise<number> {
  const events = await db.xpEvents.where('forDate').equals(ymd).toArray();
  return events.reduce((sum, e) => sum + e.delta, 0);
}
