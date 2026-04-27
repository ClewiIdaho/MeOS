import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  type Exercise,
  type WorkoutSession,
  type LiftSet,
  type CardioEntry,
  type MobilityEntry,
  type PersonalRecord,
  type DistanceUnit,
  type WorkoutKind,
} from '@/db';
import { eventBus } from '@/utils/events';
import { todayYmd, addDaysYmd, toYmd } from '@/utils/dates';

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionSummary {
  session: WorkoutSession;
  /** One-line human summary for rows. */
  label: string;
  /** Total sets (lift) or minutes (cardio/mobility) — for the chart. */
  metric: number;
  liftSets?: LiftSet[];
  cardio?: CardioEntry;
  mobility?: MobilityEntry;
}

export function useExercises(): Exercise[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.exercises.toArray();
    return all.sort((a, b) => a.name.localeCompare(b.name));
  }, []);
}

/** Today's sessions, most recent first, with hydrated lift/cardio/mobility detail. */
export function useTodaysSessions(): SessionSummary[] | undefined {
  return useLiveQuery(async () => {
    const today = todayYmd();
    const sessions = await db.workoutSessions.where('forDate').equals(today).toArray();
    sessions.sort((a, b) => b.startedAt - a.startedAt);
    return Promise.all(sessions.map(hydrateSession));
  }, []);
}

export function useRecentSessions(n = 12): SessionSummary[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.workoutSessions.orderBy('startedAt').reverse().limit(n).toArray();
    return Promise.all(all.map(hydrateSession));
  }, [n]);
}

/** Latest personal records, most recent first. Joins exercise name. */
export interface PrWithExercise {
  pr: PersonalRecord;
  exercise: Exercise | undefined;
}

export function usePersonalRecords(limit = 8): PrWithExercise[] | undefined {
  return useLiveQuery(async () => {
    const prs = await db.personalRecords.orderBy('achievedAt').reverse().limit(limit).toArray();
    if (prs.length === 0) return [];
    const exercises = await db.exercises.bulkGet(prs.map((p) => p.exerciseId));
    return prs.map((pr, i) => ({ pr, exercise: exercises[i] ?? undefined }));
  }, [limit]);
}

export interface DailyVolume {
  date: string;
  /** "Mon", "Tue", … */
  dayLabel: string;
  /** Total lift sets that day. */
  liftSets: number;
  /** Total cardio minutes that day. */
  cardioMinutes: number;
  /** Total mobility minutes that day. */
  mobilityMinutes: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Returns the last 7 days of volume data for the chart. */
export function useWeeklyVolume(): DailyVolume[] | undefined {
  return useLiveQuery(async () => {
    const days: DailyVolume[] = [];
    const today = todayYmd();
    for (let i = 6; i >= 0; i--) {
      const date = addDaysYmd(today, -i);
      const label = DAY_LABELS[new Date(date + 'T00:00').getDay()] ?? '';
      days.push({ date, dayLabel: label, liftSets: 0, cardioMinutes: 0, mobilityMinutes: 0 });
    }
    const earliest = days[0]!.date;
    const sessions = await db.workoutSessions.toArray();
    const inWindow = sessions.filter((s) => s.forDate >= earliest);
    if (inWindow.length === 0) return days;

    const sessionIds = inWindow.map((s) => s.id!).filter(Boolean) as number[];
    const [liftSets, cardio, mobility] = await Promise.all([
      db.liftSets.where('sessionId').anyOf(sessionIds).toArray(),
      db.cardioEntries.where('sessionId').anyOf(sessionIds).toArray(),
      db.mobilityEntries.where('sessionId').anyOf(sessionIds).toArray(),
    ]);

    const byDate = new Map(days.map((d) => [d.date, d]));
    for (const s of inWindow) {
      const bucket = byDate.get(s.forDate);
      if (!bucket) continue;
      if (s.kind === 'lift') {
        bucket.liftSets += liftSets.filter((ls) => ls.sessionId === s.id).length;
      } else if (s.kind === 'cardio') {
        bucket.cardioMinutes += cardio
          .filter((c) => c.sessionId === s.id)
          .reduce((sum, c) => sum + c.durationMinutes, 0);
      } else if (s.kind === 'mobility') {
        bucket.mobilityMinutes += mobility
          .filter((m) => m.sessionId === s.id)
          .reduce((sum, m) => sum + m.durationMinutes, 0);
      }
    }
    return days;
  }, []);
}

async function hydrateSession(session: WorkoutSession): Promise<SessionSummary> {
  if (session.kind === 'rest') {
    return { session, label: 'Rest day — recovery counts.', metric: 0 };
  }
  if (session.kind === 'lift') {
    const sets = await db.liftSets.where('sessionId').equals(session.id!).toArray();
    sets.sort((a, b) => a.setIndex - b.setIndex);
    const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
    const exercises = await db.exercises.bulkGet(exerciseIds);
    const names = exercises.map((e) => e?.name).filter(Boolean) as string[];
    const label =
      sets.length === 0
        ? 'Lift — no sets yet.'
        : `Lift — ${sets.length} set${sets.length === 1 ? '' : 's'}${
            names.length > 0 ? ` · ${names.slice(0, 2).join(', ')}${names.length > 2 ? '…' : ''}` : ''
          }`;
    return { session, label, metric: sets.length, liftSets: sets };
  }
  if (session.kind === 'cardio') {
    const cardio = await db.cardioEntries.where('sessionId').equals(session.id!).first();
    const label = cardio
      ? `Cardio — ${cardio.cardioType}, ${cardio.durationMinutes} min${
          cardio.distance ? ` · ${cardio.distance} ${cardio.unit ?? ''}`.trimEnd() : ''
        }`
      : 'Cardio session.';
    return {
      session,
      label,
      metric: cardio?.durationMinutes ?? 0,
      ...(cardio !== undefined ? { cardio } : {}),
    };
  }
  // mobility
  const mob = await db.mobilityEntries.where('sessionId').equals(session.id!).first();
  const label = mob
    ? `Mobility — ${mob.durationMinutes} min${mob.focus ? ` · ${mob.focus}` : ''}`
    : 'Mobility session.';
  return {
    session,
    label,
    metric: mob?.durationMinutes ?? 0,
    ...(mob !== undefined ? { mobility: mob } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations — exercises
// ─────────────────────────────────────────────────────────────────────────────

export async function createExercise(name: string): Promise<number> {
  return (await db.exercises.add({
    name: name.trim(),
    kind: 'lift',
    createdAt: Date.now(),
  } as Exercise)) as number;
}

export async function renameExercise(id: number, name: string): Promise<void> {
  await db.exercises.update(id, { name: name.trim() });
}

export async function deleteExercise(id: number): Promise<void> {
  await db.transaction('rw', [db.exercises, db.liftSets, db.personalRecords], async () => {
    await db.liftSets.where('exerciseId').equals(id).delete();
    await db.personalRecords.where('exerciseId').equals(id).delete();
    await db.exercises.delete(id);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations — sessions
// ─────────────────────────────────────────────────────────────────────────────

async function emitWorkoutLogged(
  sessionId: number,
  kind: WorkoutKind,
  summary: string,
  forDate: string,
): Promise<void> {
  await eventBus.emit('workout:logged', { sessionId, kind, summary, forDate });
}

/** Creates a (possibly empty) lift session for today. Emits workout:logged. */
export async function createLiftSession(): Promise<number> {
  const now = Date.now();
  const forDate = todayYmd();
  const session: Omit<WorkoutSession, 'id'> = {
    kind: 'lift',
    startedAt: now,
    forDate,
  };
  const id = (await db.workoutSessions.add(session as WorkoutSession)) as number;
  await emitWorkoutLogged(id, 'lift', 'Lift session started', forDate);
  return id;
}

/**
 * Adds a lift set to a session. If (weight, reps) is not dominated by any
 * prior recorded set for the same exercise, marks it as a PR, writes a
 * personalRecords row, and emits `pr:set`.
 */
export async function addLiftSet(args: {
  sessionId: number;
  exerciseId: number;
  reps: number;
  weight: number;
  rpe?: number;
}): Promise<{ set: LiftSet; isPr: boolean }> {
  const { sessionId, exerciseId, reps, weight } = args;

  let added: LiftSet | undefined;
  let isPr = false;
  let exerciseName = '';

  await db.transaction(
    'rw',
    [db.liftSets, db.personalRecords, db.exercises],
    async () => {
      const ex = await db.exercises.get(exerciseId);
      exerciseName = ex?.name ?? 'exercise';

      const priorSets = await db.liftSets.where('exerciseId').equals(exerciseId).toArray();
      // PR rule: this (w, r) is not dominated by any prior set.
      // Equivalently: no prior set has w' >= w AND r' >= r.
      isPr =
        priorSets.length === 0 ||
        !priorSets.some((s) => s.weight >= weight && s.reps >= reps);

      const sessionSets = priorSets.filter((s) => s.sessionId === sessionId);
      const setIndex = sessionSets.length;

      const newSet: Omit<LiftSet, 'id'> = {
        sessionId,
        exerciseId,
        setIndex,
        reps,
        weight,
        isPr,
        ...(args.rpe !== undefined ? { rpe: args.rpe } : {}),
      };
      const setId = (await db.liftSets.add(newSet as LiftSet)) as number;
      added = { ...newSet, id: setId } as LiftSet;

      if (isPr) {
        const prRow: Omit<PersonalRecord, 'id'> = {
          exerciseId,
          weight,
          reps,
          achievedAt: Date.now(),
          setId,
        };
        await db.personalRecords.add(prRow as PersonalRecord);
      }
    },
  );

  if (isPr) {
    await eventBus.emit('pr:set', { exerciseId, exerciseName, weight, reps });
  }
  return { set: added!, isPr };
}

export async function deleteLiftSet(setId: number): Promise<void> {
  await db.transaction('rw', [db.liftSets, db.personalRecords], async () => {
    await db.personalRecords.where('setId').equals(setId).delete();
    await db.liftSets.delete(setId);
  });
}

export async function endSession(sessionId: number): Promise<void> {
  await db.workoutSessions.update(sessionId, { endedAt: Date.now() });
}

export async function deleteSession(sessionId: number): Promise<void> {
  await db.transaction(
    'rw',
    [db.workoutSessions, db.liftSets, db.cardioEntries, db.mobilityEntries, db.personalRecords],
    async () => {
      const sets = await db.liftSets.where('sessionId').equals(sessionId).toArray();
      const setIds = sets.map((s) => s.id!).filter(Boolean) as number[];
      if (setIds.length > 0) {
        await db.personalRecords.where('setId').anyOf(setIds).delete();
      }
      await db.liftSets.where('sessionId').equals(sessionId).delete();
      await db.cardioEntries.where('sessionId').equals(sessionId).delete();
      await db.mobilityEntries.where('sessionId').equals(sessionId).delete();
      await db.workoutSessions.delete(sessionId);
    },
  );
}

interface CreateCardioInput {
  cardioType: string;
  durationMinutes: number;
  distance?: number;
  unit?: DistanceUnit;
  notes?: string;
}

export async function createCardioSession(input: CreateCardioInput): Promise<number> {
  const now = Date.now();
  const forDate = todayYmd();
  let sessionId = 0;

  await db.transaction('rw', [db.workoutSessions, db.cardioEntries], async () => {
    const session: Omit<WorkoutSession, 'id'> = {
      kind: 'cardio',
      startedAt: now,
      endedAt: now,
      forDate,
      ...(input.notes ? { notes: input.notes } : {}),
    };
    sessionId = (await db.workoutSessions.add(session as WorkoutSession)) as number;
    const entry: Omit<CardioEntry, 'id'> = {
      sessionId,
      cardioType: input.cardioType.trim(),
      durationMinutes: input.durationMinutes,
      ...(input.distance !== undefined ? { distance: input.distance } : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
    };
    await db.cardioEntries.add(entry as CardioEntry);
  });

  const summary = `Cardio — ${input.cardioType.trim()}, ${input.durationMinutes} min`;
  await emitWorkoutLogged(sessionId, 'cardio', summary, forDate);
  return sessionId;
}

interface CreateMobilityInput {
  durationMinutes: number;
  focus?: string;
  notes?: string;
}

export async function createMobilitySession(input: CreateMobilityInput): Promise<number> {
  const now = Date.now();
  const forDate = todayYmd();
  let sessionId = 0;

  await db.transaction('rw', [db.workoutSessions, db.mobilityEntries], async () => {
    const session: Omit<WorkoutSession, 'id'> = {
      kind: 'mobility',
      startedAt: now,
      endedAt: now,
      forDate,
      ...(input.notes ? { notes: input.notes } : {}),
    };
    sessionId = (await db.workoutSessions.add(session as WorkoutSession)) as number;
    const entry: Omit<MobilityEntry, 'id'> = {
      sessionId,
      durationMinutes: input.durationMinutes,
      ...(input.focus ? { focus: input.focus } : {}),
    };
    await db.mobilityEntries.add(entry as MobilityEntry);
  });

  const summary = `Mobility — ${input.durationMinutes} min${input.focus ? ` (${input.focus})` : ''}`;
  await emitWorkoutLogged(sessionId, 'mobility', summary, forDate);
  return sessionId;
}

/** Idempotent: one rest day per local-day. Returns the existing one if already logged. */
export async function logRestDay(): Promise<{ sessionId: number; created: boolean }> {
  const forDate = todayYmd();
  const existing = await db.workoutSessions
    .where('forDate')
    .equals(forDate)
    .filter((s) => s.kind === 'rest')
    .first();
  if (existing?.id !== undefined) return { sessionId: existing.id, created: false };

  const now = Date.now();
  const session: Omit<WorkoutSession, 'id'> = {
    kind: 'rest',
    startedAt: now,
    endedAt: now,
    forDate,
  };
  const sessionId = (await db.workoutSessions.add(session as WorkoutSession)) as number;
  await emitWorkoutLogged(sessionId, 'rest', 'Rest day logged', forDate);
  return { sessionId, created: true };
}

/** Test-only / utility — seed-friendly helpers for the dev panel. */
export function dateOfSession(s: WorkoutSession): string {
  return toYmd(s.startedAt);
}
