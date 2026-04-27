import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, Plus, Sparkles, Trophy } from 'lucide-react';
import { Modal } from '@/ui/components/Modal';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import {
  addLiftSet,
  createLiftSession,
  deleteLiftSet,
  deleteSession,
  endSession,
  useExercises,
} from './queries';
import { ExerciseSheet } from './ExerciseSheet';
import { db, type LiftSet } from '@/db';
import { useUserSettings } from '@/hooks/useUserSettings';

interface LiftSheetProps {
  open: boolean;
  onClose: () => void;
  /** When provided, edits this session. Otherwise creates a new lift session on open. */
  sessionId?: number;
}

export function LiftSheet({ open, onClose, sessionId: initialId }: LiftSheetProps) {
  const settings = useUserSettings();
  const exercises = useExercises();
  const unit = settings?.weightUnit ?? 'lb';

  const [sessionId, setSessionId] = useState<number | undefined>(initialId);
  const [exerciseId, setExerciseId] = useState<number | undefined>(undefined);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [exerciseSheetOpen, setExerciseSheetOpen] = useState(false);

  const sets = useLiveQuery<LiftSet[]>(async () => {
    if (sessionId === undefined) return [];
    const all = await db.liftSets.where('sessionId').equals(sessionId).toArray();
    return all.sort((a, b) => a.setIndex - b.setIndex);
  }, [sessionId]);

  useEffect(() => {
    if (!open) {
      setError(undefined);
      setReps('');
      setWeight('');
      setRpe('');
      return;
    }
    if (initialId !== undefined) {
      setSessionId(initialId);
      return;
    }
    // Fresh open: create a new session (this emits workout:logged → XP).
    let cancelled = false;
    (async () => {
      const id = await createLiftSession();
      if (!cancelled) setSessionId(id);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, initialId]);

  // Default exercise to the first available once the library loads.
  useEffect(() => {
    if (exerciseId === undefined && exercises && exercises.length > 0) {
      setExerciseId(exercises[0]!.id);
    }
  }, [exercises, exerciseId]);

  const handleAddSet = async () => {
    setError(undefined);
    if (sessionId === undefined) return;
    if (exerciseId === undefined) {
      setError('Pick or add an exercise first.');
      return;
    }
    const r = parseInt(reps, 10);
    const w = parseFloat(weight);
    if (!Number.isFinite(r) || r <= 0) return setError('Reps must be a positive number.');
    if (!Number.isFinite(w) || w < 0) return setError('Weight must be 0 or more.');
    const rpeNum = rpe.trim() ? parseFloat(rpe) : undefined;
    if (rpe.trim() && (!Number.isFinite(rpeNum!) || rpeNum! < 1 || rpeNum! > 10)) {
      return setError('RPE must be between 1 and 10.');
    }

    setSubmitting(true);
    try {
      await addLiftSet({
        sessionId,
        exerciseId,
        reps: r,
        weight: w,
        ...(rpeNum !== undefined ? { rpe: rpeNum } : {}),
      });
      setReps('');
      setRpe('');
      // Keep weight pre-filled — most lifters do straight sets.
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (sessionId !== undefined) {
      await endSession(sessionId);
    }
    onClose();
  };

  const handleDeleteSession = async () => {
    if (sessionId === undefined) return;
    if (!confirm('Delete this whole lift session and all its sets?')) return;
    setSubmitting(true);
    try {
      await deleteSession(sessionId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const exercisesById = new Map((exercises ?? []).map((e) => [e.id!, e]));

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="Lift"
        description="Add sets one at a time. PRs flag automatically."
      >
        <div className="flex flex-col gap-4">
          {/* Sets list */}
          <div className="flex flex-col gap-1.5">
            <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
              Sets
            </span>
            {!sets || sets.length === 0 ? (
              <p className="rounded-card border border-border-subtle bg-surface/50 px-4 py-3 text-xs text-text-muted">
                No sets yet. Pick an exercise below and start logging.
              </p>
            ) : (
              <AnimatePresence initial={false}>
                <ul className="flex flex-col gap-1.5">
                  {sets.map((s) => {
                    const ex = exercisesById.get(s.exerciseId);
                    return (
                      <motion.li
                        key={s.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className={[
                          'glass flex items-center gap-3 rounded-card border px-3 py-2.5',
                          s.isPr ? 'border-reserved/40' : 'border-border-subtle',
                        ].join(' ')}
                      >
                        <span className="display-num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-elevated text-[11px] text-text-secondary">
                          {s.setIndex + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-text-primary">
                            {ex?.name ?? 'Exercise'}
                          </p>
                          <p className="display-num text-[11px] tabular-nums text-text-muted">
                            {s.reps} × {s.weight} {unit}
                            {s.rpe !== undefined ? ` · RPE ${s.rpe}` : ''}
                          </p>
                        </div>
                        {s.isPr ? (
                          <span className="display-num flex items-center gap-1 rounded-full bg-reserved/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-reserved">
                            <Trophy size={10} strokeWidth={2.4} />
                            PR
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => deleteLiftSet(s.id!)}
                          aria-label="Delete set"
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-text-muted hover:text-danger"
                        >
                          <Trash2 size={13} strokeWidth={1.8} />
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </AnimatePresence>
            )}
          </div>

          {/* Exercise picker */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
                Exercise
              </span>
              <button
                type="button"
                onClick={() => setExerciseSheetOpen(true)}
                className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-accent"
              >
                <Plus size={12} strokeWidth={2.4} /> Manage
              </button>
            </div>
            {!exercises || exercises.length === 0 ? (
              <button
                type="button"
                onClick={() => setExerciseSheetOpen(true)}
                className="rounded-card border border-dashed border-border-subtle bg-surface/40 px-4 py-3 text-left text-xs text-text-muted"
              >
                No exercises in your library yet. Tap to add one.
              </button>
            ) : (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {exercises.map((ex) => {
                  const active = exerciseId === ex.id;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setExerciseId(ex.id)}
                      className={[
                        'shrink-0 rounded-pill border px-3 py-1.5 text-xs transition-colors',
                        active
                          ? 'border-accent bg-accent/15 text-text-primary shadow-glow'
                          : 'border-border-subtle text-text-secondary',
                      ].join(' ')}
                    >
                      {ex.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add-set form */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Reps"
                inputMode="numeric"
                placeholder="5"
                value={reps}
                onChange={(e) => setReps(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              />
              <Input
                label={`Weight (${unit})`}
                inputMode="decimal"
                placeholder="135"
                value={weight}
                onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
              />
              <Input
                label="RPE"
                inputMode="decimal"
                placeholder="—"
                value={rpe}
                onChange={(e) => setRpe(e.target.value.replace(/[^0-9.]/g, '').slice(0, 3))}
              />
            </div>

            {error ? (
              <p className="rounded-card border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            ) : null}

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleAddSet}
              loading={submitting}
              leadingIcon={<Sparkles size={14} strokeWidth={2} />}
            >
              Add set
            </Button>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <Button
              variant="danger"
              size="md"
              onClick={handleDeleteSession}
              leadingIcon={<Trash2 size={14} strokeWidth={2} />}
            >
              Delete
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="md" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      <ExerciseSheet open={exerciseSheetOpen} onClose={() => setExerciseSheetOpen(false)} />
    </>
  );
}
