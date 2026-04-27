import { useEffect, useMemo, useState } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Modal } from '@/ui/components/Modal';
import { Button } from '@/ui/components/Button';
import { Input, Textarea, Segmented } from '@/ui/components/Input';
import {
  createGoal,
  deleteGoal,
  pauseGoal,
  resumeGoal,
  updateGoal,
} from './queries';
import { db, type Goal, type GoalType, type GoalMetric, type GoalTier, type GoalDifficulty } from '@/db';
import { useUserSettings } from '@/hooks/useUserSettings';
import { parseDollarsToCents, centsToDollars } from '@/utils/money';

interface GoalSheetProps {
  open: boolean;
  onClose: () => void;
  goal?: Goal;
}

interface MetricOption {
  value: GoalMetric;
  label: string;
  unit: string;
  hint: string;
  /** When true, money: the target is dollars input → cents stored. */
  isMoney?: boolean;
  /** Linking surface to expose. */
  linkKind?: 'bills' | 'tasks' | 'exercise';
}

const metricsByType: Record<GoalType, MetricOption[]> = {
  money: [
    {
      value: 'cash_on_hand',
      label: 'Cash on hand',
      unit: '$',
      hint: 'Snapshot of current cash. Auto-updates with bills paid + cash adjustments.',
      isMoney: true,
    },
    {
      value: 'cash_saved_to_goal',
      label: 'Saved to goal',
      unit: '$',
      hint: 'Manual contributions only — for envelopes / sinking funds.',
      isMoney: true,
    },
    {
      value: 'bills_paid',
      label: 'Bills paid',
      unit: 'bills',
      hint: 'Counts bill payments. Link bills to filter, or leave open.',
      linkKind: 'bills',
    },
  ],
  habit: [
    {
      value: 'task_completions',
      label: 'Task completions',
      unit: 'tasks',
      hint: 'Counts task completions. Link tasks to filter, or leave open.',
      linkKind: 'tasks',
    },
    {
      value: 'task_streak',
      label: 'Streak length',
      unit: 'days',
      hint: 'Tracks current global streak of active days.',
    },
  ],
  performance: [
    {
      value: 'workout_count',
      label: 'Workout count',
      unit: 'workouts',
      hint: 'Counts every workout logged (lift, cardio, mobility, rest).',
    },
    {
      value: 'workout_volume',
      label: 'Lift volume',
      unit: 'volume',
      hint: 'Sum of weight × reps across all lift sets in window.',
    },
    {
      value: 'pr_weight',
      label: 'PR weight',
      unit: 'lb',
      hint: 'Tracks heaviest weight on a linked exercise.',
      linkKind: 'exercise',
    },
  ],
  custom: [
    {
      value: 'custom',
      label: 'Custom',
      unit: '',
      hint: 'You define the unit. Only updates via manual contributions.',
    },
  ],
};

function findMetric(type: GoalType, metric: GoalMetric): MetricOption {
  const list = metricsByType[type];
  const m = list.find((mm) => mm.value === metric);
  return m ?? list[0]!;
}

export function GoalSheet({ open, onClose, goal }: GoalSheetProps) {
  const settings = useUserSettings();
  const bills = useLiveQuery(() => db.bills.toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GoalType>('money');
  const [metric, setMetric] = useState<GoalMetric>('cash_saved_to_goal');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('$');
  const [tier, setTier] = useState<GoalTier>('primary');
  const [difficulty, setDifficulty] = useState<GoalDifficulty>('medium');
  const [deadline, setDeadline] = useState('');
  const [linkedBillIds, setLinkedBillIds] = useState<number[]>([]);
  const [linkedTaskIds, setLinkedTaskIds] = useState<number[]>([]);
  const [linkedExerciseId, setLinkedExerciseId] = useState<number | undefined>(undefined);
  const [milestones, setMilestones] = useState<Array<{ title: string; target: string }>>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(goal);
  const metricOption = useMemo(() => findMetric(type, metric), [type, metric]);

  useEffect(() => {
    if (!open) return;
    setError(undefined);
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? '');
      setType(goal.type);
      setMetric(goal.metric);
      const opt = findMetric(goal.type, goal.metric);
      setTarget(
        opt.isMoney
          ? centsToDollars(goal.targetValue).toFixed(2)
          : String(goal.targetValue),
      );
      setUnit(goal.unit);
      setTier(goal.tier);
      setDifficulty(goal.difficulty);
      setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : '');
      setLinkedBillIds(goal.linkedBillIds ?? []);
      setLinkedTaskIds(goal.linkedTaskIds ?? []);
      setLinkedExerciseId(goal.linkedExerciseId);
      setMilestones([]);
    } else {
      setTitle('');
      setDescription('');
      setType('money');
      setMetric('cash_saved_to_goal');
      setTarget('');
      setUnit('$');
      setTier('primary');
      setDifficulty('medium');
      setDeadline('');
      setLinkedBillIds([]);
      setLinkedTaskIds([]);
      setLinkedExerciseId(undefined);
      setMilestones([]);
    }
  }, [open, goal]);

  // When type changes (and not editing), reset metric + unit to defaults.
  useEffect(() => {
    if (goal) return;
    const first = metricsByType[type][0]!;
    setMetric(first.value);
    setUnit(
      first.unit === 'lb'
        ? settings?.weightUnit ?? 'lb'
        : first.unit,
    );
  }, [type, goal, settings?.weightUnit]);

  // When metric changes (and not editing), update unit to match.
  useEffect(() => {
    if (goal) return;
    const opt = findMetric(type, metric);
    setUnit(opt.unit === 'lb' ? settings?.weightUnit ?? 'lb' : opt.unit);
  }, [metric, type, goal, settings?.weightUnit]);

  const handleSubmit = async () => {
    setError(undefined);
    if (!title.trim()) return setError('Give the goal a name.');
    let targetValue: number;
    if (metricOption.isMoney) {
      const cents = parseDollarsToCents(target);
      if (cents === null || cents <= 0) return setError('Enter a valid target amount.');
      targetValue = cents;
    } else {
      const n = parseFloat(target);
      if (!Number.isFinite(n) || n <= 0) return setError('Enter a positive target.');
      targetValue = n;
    }
    const deadlineMs = deadline ? new Date(deadline + 'T23:59:59').getTime() : undefined;

    setSubmitting(true);
    try {
      if (goal?.id) {
        await updateGoal(goal.id, {
          title,
          description,
          tier,
          difficulty,
          targetValue,
          unit,
          ...(deadlineMs !== undefined ? { deadline: deadlineMs } : {}),
          linkedBillIds,
          linkedTaskIds,
          ...(linkedExerciseId !== undefined ? { linkedExerciseId } : {}),
        });
      } else {
        await createGoal({
          title,
          description,
          type,
          tier,
          difficulty,
          metric,
          targetValue,
          unit,
          ...(deadlineMs !== undefined ? { deadline: deadlineMs } : {}),
          linkedBillIds,
          linkedTaskIds,
          ...(linkedExerciseId !== undefined ? { linkedExerciseId } : {}),
          milestones: milestones
            .filter((m) => m.title.trim() && parseFloat(m.target) > 0)
            .map((m) => ({
              title: m.title,
              targetValue: metricOption.isMoney
                ? (parseDollarsToCents(m.target) ?? 0)
                : parseFloat(m.target),
            })),
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!goal?.id) return;
    if (!confirm(`Delete "${goal.title}"? This removes its contributions and milestones.`)) return;
    setSubmitting(true);
    try {
      await deleteGoal(goal.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePauseToggle = async () => {
    if (!goal?.id) return;
    if (goal.status === 'paused') await resumeGoal(goal.id);
    else await pauseGoal(goal.id);
    onClose();
  };

  const toggleArrayId = (current: number[], id: number): number[] =>
    current.includes(id) ? current.filter((x) => x !== id) : [...current, id];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit goal' : 'New goal'}
      description={
        isEdit
          ? 'Adjust target, deadline, tier, links.'
          : 'Pick a type and what you want to track. Difficulty sets the XP reward.'
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          placeholder="e.g. Save $2,000"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          maxLength={64}
        />

        <Textarea
          label="Why does this matter? (optional)"
          placeholder="The reason matters more than the target."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={240}
        />

        {!isEdit ? (
          <Segmented<GoalType>
            label="Type"
            value={type}
            options={[
              { value: 'money', label: 'Money' },
              { value: 'habit', label: 'Habit' },
              { value: 'performance', label: 'Perf.' },
              { value: 'custom', label: 'Custom' },
            ]}
            onChange={setType}
          />
        ) : null}

        {!isEdit ? (
          <div className="flex flex-col gap-1.5">
            <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
              Metric
            </span>
            <div className="flex flex-wrap gap-2">
              {metricsByType[type].map((opt) => {
                const active = metric === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMetric(opt.value)}
                    className={[
                      'rounded-pill border px-3 py-1.5 text-xs transition-colors',
                      active
                        ? 'border-accent bg-accent/15 text-text-primary shadow-glow'
                        : 'border-border-subtle text-text-secondary',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-text-muted">{metricOption.hint}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <Input
            label={`Target ${metricOption.isMoney ? '(amount)' : ''}`}
            inputMode={metricOption.isMoney ? 'decimal' : 'numeric'}
            placeholder={metricOption.isMoney ? '2000.00' : '12'}
            leading={metricOption.isMoney ? <span className="text-text-muted">$</span> : undefined}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          {!isEdit && type === 'custom' ? (
            <Input
              label="Unit"
              placeholder="e.g. pages"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              maxLength={16}
            />
          ) : (
            <div className="glass flex h-11 items-center rounded-pill border border-border-subtle px-3 text-xs text-text-muted">
              {unit || '—'}
            </div>
          )}
        </div>

        <Input
          label="Deadline (optional)"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <Segmented<GoalTier>
          label="Tier"
          value={tier}
          options={[
            { value: 'primary', label: 'Primary' },
            { value: 'secondary', label: 'Secondary' },
            { value: 'backburner', label: 'Backburner' },
          ]}
          onChange={setTier}
        />

        <Segmented<GoalDifficulty>
          label="Difficulty"
          value={difficulty}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'legendary', label: 'Legendary' },
          ]}
          onChange={setDifficulty}
          hint={`Awards ${
            difficulty === 'small' ? '100' : difficulty === 'medium' ? '500' : '2,000'
          } XP on completion.`}
        />

        {metricOption.linkKind === 'bills' ? (
          <LinkPicker
            label="Linked bills (optional)"
            empty="No bills tracked yet."
            items={(bills ?? []).filter((b) => b.active).map((b) => ({ id: b.id!, label: b.label }))}
            selected={linkedBillIds}
            onToggle={(id) => setLinkedBillIds(toggleArrayId(linkedBillIds, id))}
          />
        ) : null}
        {metricOption.linkKind === 'tasks' ? (
          <LinkPicker
            label="Linked tasks (optional)"
            empty="No tasks yet."
            items={(tasks ?? []).filter((t) => t.active).map((t) => ({ id: t.id!, label: t.title }))}
            selected={linkedTaskIds}
            onToggle={(id) => setLinkedTaskIds(toggleArrayId(linkedTaskIds, id))}
          />
        ) : null}
        {metricOption.linkKind === 'exercise' ? (
          <ExercisePicker
            items={(exercises ?? []).map((ex) => ({ id: ex.id!, label: ex.name }))}
            selected={linkedExerciseId}
            onSelect={setLinkedExerciseId}
          />
        ) : null}

        {!isEdit ? (
          <MilestonesEditor
            unit={unit}
            isMoney={Boolean(metricOption.isMoney)}
            milestones={milestones}
            onChange={setMilestones}
          />
        ) : null}

        {error ? (
          <p className="rounded-card border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          {isEdit ? (
            <>
              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
                leadingIcon={<Trash2 size={14} strokeWidth={2} />}
              >
                Delete
              </Button>
              <Button variant="ghost" size="md" onClick={handlePauseToggle}>
                {goal?.status === 'paused' ? 'Resume' : 'Pause'}
              </Button>
            </>
          ) : null}
          <div className="flex-1" />
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save' : 'Create goal'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface LinkPickerProps {
  label: string;
  empty: string;
  items: Array<{ id: number; label: string }>;
  selected: number[];
  onToggle: (id: number) => void;
}

function LinkPicker({ label, empty, items, selected, onToggle }: LinkPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
        {label}
      </span>
      {items.length === 0 ? (
        <p className="rounded-card border border-border-subtle bg-surface/50 px-3 py-2 text-xs text-text-muted">
          {empty}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => {
            const active = selected.includes(it.id);
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onToggle(it.id)}
                className={[
                  'rounded-pill border px-3 py-1 text-xs transition-colors',
                  active
                    ? 'border-accent bg-accent/15 text-text-primary'
                    : 'border-border-subtle text-text-secondary',
                ].join(' ')}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ExercisePickerProps {
  items: Array<{ id: number; label: string }>;
  selected: number | undefined;
  onSelect: (id: number) => void;
}

function ExercisePicker({ items, selected, onSelect }: ExercisePickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
        Linked exercise
      </span>
      {items.length === 0 ? (
        <p className="rounded-card border border-border-subtle bg-surface/50 px-3 py-2 text-xs text-text-muted">
          Add a lift in Workouts first.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => {
            const active = selected === it.id;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onSelect(it.id)}
                className={[
                  'rounded-pill border px-3 py-1 text-xs transition-colors',
                  active
                    ? 'border-accent bg-accent/15 text-text-primary'
                    : 'border-border-subtle text-text-secondary',
                ].join(' ')}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MilestonesEditorProps {
  unit: string;
  isMoney: boolean;
  milestones: Array<{ title: string; target: string }>;
  onChange: (next: Array<{ title: string; target: string }>) => void;
}

function MilestonesEditor({ unit, isMoney, milestones, onChange }: MilestonesEditorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
          Milestones (optional)
        </span>
        <button
          type="button"
          onClick={() => onChange([...milestones, { title: '', target: '' }])}
          className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-accent"
        >
          <Plus size={12} strokeWidth={2.4} /> Add
        </button>
      </div>
      {milestones.length === 0 ? (
        <p className="rounded-card border border-dashed border-border-subtle bg-surface/40 px-3 py-2 text-xs text-text-muted">
          Optional waypoints. Each hit awards 50 XP.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {milestones.map((m, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
              <Input
                placeholder="Milestone title"
                value={m.title}
                onChange={(e) => {
                  const copy = [...milestones];
                  copy[idx] = { ...m, title: e.target.value };
                  onChange(copy);
                }}
              />
              <Input
                inputMode={isMoney ? 'decimal' : 'numeric'}
                placeholder={`at (${unit || 'value'})`}
                value={m.target}
                onChange={(e) => {
                  const copy = [...milestones];
                  copy[idx] = { ...m, target: e.target.value };
                  onChange(copy);
                }}
                {...(isMoney ? { leading: <span className="text-text-muted">$</span> } : {})}
              />
              <button
                type="button"
                onClick={() => onChange(milestones.filter((_, i) => i !== idx))}
                aria-label="Remove milestone"
                className="grid h-11 w-11 place-items-center rounded-full text-text-muted hover:text-danger"
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
