import { db } from '@/db';
import { eventBus } from '@/utils/events';
import { daysBetween, todayYmd } from '@/utils/dates';
import { isStreakMilestone, BASE_XP } from '@/utils/xp';
import { awardXp } from './xpEngine';

/**
 * Streak rules:
 * - "Active" means the user logged any qualifying action (task complete,
 *   bill paid, workout logged, manual XP) on a given local day.
 * - First qualifying action of a day: streak ticks. Subsequent same-day
 *   actions are no-ops.
 * - If the gap between today and lastActiveDate is exactly 1 day → +1.
 * - If the gap is 0 → already counted, no change.
 * - If the gap is >1 → streak resets to 1 (today still counts).
 *
 * On milestone hits (3, 7, 14, 30, 60, 100, 200, 365) we award bonus XP and
 * emit `streak:updated` with `isMilestone: true` for the UI to celebrate.
 */
export async function recordActiveDay(): Promise<{
  current: number;
  previous: number;
  longest: number;
  extended: boolean;
  isMilestone: boolean;
} | null> {
  const today = todayYmd();
  let previous = 0;
  let current = 0;
  let longest = 0;
  let extended = false;
  let isMilestone = false;
  let earlyExit = false;

  await db.transaction('rw', db.streakState, async () => {
    const state = (await db.streakState.get(1)) ?? {
      id: 1 as const,
      current: 0,
      longest: 0,
    };
    previous = state.current;
    longest = state.longest;

    if (state.lastActiveDate === today) {
      // Already counted today.
      current = state.current;
      earlyExit = true;
      return;
    }

    if (state.lastActiveDate) {
      const gap = daysBetween(state.lastActiveDate, today);
      if (gap === 1) {
        current = state.current + 1;
        extended = true;
      } else {
        current = 1;
        extended = state.current === 0;
      }
    } else {
      current = 1;
      extended = true;
    }

    longest = Math.max(longest, current);
    isMilestone = extended && isStreakMilestone(current);

    await db.streakState.put({
      id: 1,
      current,
      longest,
      lastActiveDate: today,
      ...(state.lastWarningSentAt !== undefined
        ? { lastWarningSentAt: state.lastWarningSentAt }
        : {}),
    });
  });

  if (earlyExit) return null;

  await eventBus.emit('streak:updated', {
    current,
    previous,
    longest,
    isMilestone,
    extended,
  });

  if (isMilestone) {
    const bonusXp = BASE_XP.streakMilestoneByDays[current] ?? 0;
    if (bonusXp > 0) {
      await awardXp({
        delta: bonusXp,
        source: 'streak_milestone',
        description: `Streak milestone reached — ${current} days`,
        sourceRef: String(current),
      });
    }
  }

  return { current, previous, longest, extended, isMilestone };
}
