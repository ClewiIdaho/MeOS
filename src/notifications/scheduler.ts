import { db, type ScheduledNotification, type NotificationKind, type UserSettings } from '@/db';
import { todayYmd, addDaysYmd } from '@/utils/dates';
import { weekAnalyzer, recapToParams } from '@/voice/analyze';
import { pickQuip } from '@/voice/select';

/**
 * Local-only notification scheduler.
 *
 * On each tick (default ~60s) the scheduler:
 *   1. Computes the desired set of upcoming notifications for the next 7 days
 *      based on current settings and module data.
 *   2. Reconciles to db.scheduledNotifications — inserts any missing ones,
 *      leaves existing ones alone (dedupe is by kind + refId + scheduledFor).
 *   3. Fires any whose scheduledFor <= now and !fired, marks them fired.
 *   4. Evaluates ad-hoc rules (streak warning) that don't pre-schedule.
 *
 * Why a 1-minute interval rather than precise timeouts:
 * - The user can change settings at any time, including disabling
 *   notifications. A periodic reconcile picks that up cheaply.
 * - On a phone the tab can sleep; when it wakes, the next tick still fires
 *   anything that came due. Precise timers would silently miss those.
 *
 * The Notification API is gated by both browser permission and
 * settings.notificationsEnabled. Either being false short-circuits the
 * whole tick — no rows are written, no notifications are fired.
 */

const TICK_INTERVAL_MS = 60 * 1000;

interface DesiredNotification {
  kind: NotificationKind;
  scheduledFor: number;
  title: string;
  body: string;
  refId?: number;
}

/** Returns true when local notifications are usable end-to-end. */
export function notificationsAvailable(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsAvailable()) return 'denied';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function startNotificationScheduler(): () => void {
  if (!notificationsAvailable()) return () => undefined;

  void tick();
  const id = window.setInterval(() => {
    void tick();
  }, TICK_INTERVAL_MS);

  return () => {
    window.clearInterval(id);
  };
}

async function tick(): Promise<void> {
  const settings = await db.settings.get(1);
  if (!settings || !settings.notificationsEnabled) return;
  if (Notification.permission !== 'granted') return;

  const desired = await buildDesired(settings);
  await reconcile(desired);
  await fireDue();
  await maybeFireStreakWarning(settings);
}

async function buildDesired(settings: UserSettings): Promise<DesiredNotification[]> {
  const out: DesiredNotification[] = [];
  const cats = settings.notificationCategories;

  if (cats.bills) out.push(...(await buildBillDue()));
  if (cats.dailyTasks) out.push(...buildDailyTaskReminders(settings));
  if (cats.workouts) out.push(...buildWorkoutReminders(settings));
  if (cats.weeklyRecap) out.push(...(await buildWeeklyRecap()));

  return out;
}

async function buildBillDue(): Promise<DesiredNotification[]> {
  const bills = await db.bills.toArray();
  const payments = await db.billPayments.toArray();
  const now = new Date();

  const months: Array<{ y: number; m: number }> = [
    { y: now.getFullYear(), m: now.getMonth() },
    {
      y: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
      m: now.getMonth() === 11 ? 0 : now.getMonth() + 1,
    },
  ];

  const out: DesiredNotification[] = [];
  for (const bill of bills) {
    if (!bill.active || bill.id === undefined) continue;
    for (const { y, m } of months) {
      const lastDay = new Date(y, m + 1, 0).getDate();
      const day = Math.min(Math.max(1, bill.dueDay), lastDay);
      const due = new Date(y, m, day, 9, 0, 0, 0);
      const scheduledFor = due.getTime() - 2 * 24 * 60 * 60 * 1000;
      if (scheduledFor < Date.now() - 60 * 60 * 1000) continue;
      const ym = `${y}-${String(m + 1).padStart(2, '0')}`;
      if (payments.some((p) => p.billId === bill.id && p.forMonth === ym)) continue;
      out.push({
        kind: 'bill_due',
        scheduledFor,
        title: 'Bill due in 2 days',
        body: `${bill.label} — ${(bill.amount / 100).toFixed(2)}`,
        refId: bill.id,
      });
    }
  }
  return out;
}

function buildDailyTaskReminders(settings: UserSettings): DesiredNotification[] {
  const time = settings.dailyTaskReminderTime;
  if (!time) return [];
  const out: DesiredNotification[] = [];
  for (let i = 0; i < 7; i++) {
    const ymd = addDaysYmd(todayYmd(), i);
    const at = atTime(ymd, time);
    if (at === null || at < Date.now() - 60 * 1000) continue;
    out.push({
      kind: 'daily_task',
      scheduledFor: at,
      title: 'Daily check-in',
      body: 'Quick pass on the list. Even one thing keeps the streak.',
    });
  }
  return out;
}

function buildWorkoutReminders(settings: UserSettings): DesiredNotification[] {
  const days = settings.workoutReminderDays;
  const time = settings.workoutReminderTime;
  if (!days || days.length === 0 || !time) return [];
  const out: DesiredNotification[] = [];
  for (let i = 0; i < 7; i++) {
    const ymd = addDaysYmd(todayYmd(), i);
    const dow = new Date(`${ymd}T00:00`).getDay();
    if (!days.includes(dow)) continue;
    const at = atTime(ymd, time);
    if (at === null || at < Date.now() - 60 * 1000) continue;
    out.push({
      kind: 'workout',
      scheduledFor: at,
      title: 'Workout window',
      body: 'Lift, run, mobility — pick one. Even rest counts if logged.',
    });
  }
  return out;
}

/** Sundays at 19:00 local for the current week and the next two. */
async function buildWeeklyRecap(): Promise<DesiredNotification[]> {
  const out: DesiredNotification[] = [];
  for (let week = 0; week < 3; week++) {
    const baseYmd = addDaysYmd(todayYmd(), week * 7);
    const base = new Date(`${baseYmd}T00:00`);
    const offset = (7 - base.getDay()) % 7;
    const sundayYmd = addDaysYmd(baseYmd, offset);
    const at = atTime(sundayYmd, '19:00');
    if (at === null || at < Date.now() - 60 * 1000) continue;
    out.push({
      kind: 'weekly_recap',
      scheduledFor: at,
      title: 'Weekly recap is ready',
      body: 'Open MY.OS for the read.',
    });
  }
  return out;
}

async function reconcile(desired: DesiredNotification[]): Promise<void> {
  if (desired.length === 0) return;
  const existing = await db.scheduledNotifications.toArray();
  const seen = new Set(existing.map((n) => keyOf(n.kind, n.refId, n.scheduledFor)));
  const inserts: Omit<ScheduledNotification, 'id'>[] = [];
  for (const d of desired) {
    if (seen.has(keyOf(d.kind, d.refId, d.scheduledFor))) continue;
    inserts.push({
      kind: d.kind,
      scheduledFor: d.scheduledFor,
      title: d.title,
      body: d.body,
      fired: false,
      createdAt: Date.now(),
      ...(d.refId !== undefined ? { refId: d.refId } : {}),
    });
  }
  if (inserts.length === 0) return;
  await db.scheduledNotifications.bulkAdd(inserts as ScheduledNotification[]);
}

async function fireDue(): Promise<void> {
  const now = Date.now();
  const all = await db.scheduledNotifications.toArray();
  const due = all.filter((n) => !n.fired && n.scheduledFor <= now);
  for (const n of due) {
    let title = n.title;
    let body = n.body;
    if (n.kind === 'weekly_recap') {
      const enriched = await renderRecapBody();
      if (enriched) {
        title = enriched.title;
        body = enriched.body;
      }
    }
    fireSystemNotification(title, body);
    await db.scheduledNotifications.update(n.id!, { fired: true });
  }
}

async function renderRecapBody(): Promise<{ title: string; body: string } | null> {
  try {
    const settings = await db.settings.get(1);
    const recap = await weekAnalyzer();
    const intensity = settings?.voiceIntensity ?? 'standard';
    const params = recapToParams(settings?.name?.trim() || undefined, recap);
    const result = await pickQuip('recap', intensity, params);
    return { title: 'Weekly recap', body: result.text || 'Open MY.OS for the read.' };
  } catch {
    return null;
  }
}

async function maybeFireStreakWarning(settings: UserSettings): Promise<void> {
  if (!settings.notificationCategories.streaks) return;
  const state = await db.streakState.get(1);
  if (!state || state.current <= 0 || !state.lastActiveDate) return;
  const yesterday = addDaysYmd(todayYmd(), -1);
  if (state.lastActiveDate !== yesterday) return;

  const now = new Date();
  if (now.getHours() < 19) return;

  const lastSent = state.lastWarningSentAt ?? 0;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (lastSent >= startOfToday) return;

  fireSystemNotification(
    'Streak on the line',
    `${state.current} ${state.current === 1 ? 'day' : 'days'} in. Log one thing before midnight.`,
  );
  await db.streakState.update(1, { lastWarningSentAt: Date.now() });
}

function fireSystemNotification(title: string, body: string): void {
  if (!notificationsAvailable() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/icons/icon-192.png' });
  } catch {
    // Some browsers throw when constructing Notification outside of a
    // user gesture. We've already gated on permission; swallow and
    // continue — the row is still marked fired so we don't loop on it.
  }
}

function keyOf(kind: NotificationKind, refId: number | undefined, scheduledFor: number): string {
  return `${kind}::${refId ?? '-'}::${scheduledFor}`;
}

function atTime(ymd: string, hhmm: string): number | null {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const d = new Date(`${ymd}T00:00`);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}
