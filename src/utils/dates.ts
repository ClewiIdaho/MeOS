import {
  format,
  parseISO,
  differenceInCalendarDays,
  addDays as fnsAddDays,
  startOfDay,
} from 'date-fns';

/**
 * Date helpers — all operate in the device's local timezone.
 * MY.OS persists dates as `YYYY-MM-DD` strings (no time) for anything that's
 * "what day did this count for". Timestamps stay as epoch ms.
 */

export type Ymd = string; // 'YYYY-MM-DD'

/** Today, formatted in the user's local timezone. */
export function todayYmd(now: Date = new Date()): Ymd {
  return format(now, 'yyyy-MM-dd');
}

/** Same as todayYmd() but for an arbitrary Date / epoch ms. */
export function toYmd(input: Date | number): Ymd {
  const d = typeof input === 'number' ? new Date(input) : input;
  return format(d, 'yyyy-MM-dd');
}

/** Start-of-day Date for a YMD string. */
export function fromYmd(ymd: Ymd): Date {
  return startOfDay(parseISO(ymd));
}

/** Whole calendar days between two YMDs. b - a; positive if b is after a. */
export function daysBetween(a: Ymd, b: Ymd): number {
  return differenceInCalendarDays(parseISO(b), parseISO(a));
}

export function addDaysYmd(ymd: Ymd, days: number): Ymd {
  return format(fnsAddDays(parseISO(ymd), days), 'yyyy-MM-dd');
}

/** True if `b` is exactly the day after `a`. */
export function isNextDay(a: Ymd, b: Ymd): boolean {
  return daysBetween(a, b) === 1;
}

/** YMD of the week's Sunday for a given date (00:00 local). */
export function weekStartYmd(input: Date | Ymd = new Date()): Ymd {
  const d = typeof input === 'string' ? parseISO(input) : input;
  const day = d.getDay(); // 0 = Sunday
  return toYmd(fnsAddDays(startOfDay(d), -day));
}
