import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Sheet } from '@/ui/components/Sheet';
import { Button } from '@/ui/components/Button';
import { Input, Textarea, Segmented } from '@/ui/components/Input';
import { createTask, deleteTask, updateTask, useTaskCategories } from './queries';
import type { Task, TaskCadence } from '@/db';

interface TaskSheetProps {
  open: boolean;
  onClose: () => void;
  /** When provided, sheet edits this task; otherwise creates a new one. */
  task?: Task;
}

export function TaskSheet({ open, onClose, task }: TaskSheetProps) {
  const categories = useTaskCategories();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cadence, setCadence] = useState<TaskCadence>('daily');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setCadence(task?.cadence ?? 'daily');
    setCategoryId(task?.categoryId);
  }, [open, task]);

  const isEdit = Boolean(task);
  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (task?.id) {
        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          cadence,
          categoryId,
        });
      } else {
        await createTask({
          title,
          description,
          cadence,
          ...(categoryId !== undefined ? { categoryId } : {}),
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id) return;
    if (!confirm(`Delete "${task.title}"? This removes its completions too.`)) return;
    setSubmitting(true);
    try {
      await deleteTask(task.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      description={isEdit ? 'Tweak the details, change cadence, or delete it.' : 'Daily, weekly, or one-off.'}
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          placeholder="e.g. Make the bed"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          maxLength={80}
        />

        <Textarea
          label="Description (optional)"
          placeholder="Anything you want to remember about this task."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={200}
        />

        <Segmented<TaskCadence>
          label="Cadence"
          value={cadence}
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'one-off', label: 'One-off' },
          ]}
          onChange={setCadence}
          hint={
            cadence === 'daily'
              ? 'Awards 10 XP per completion. Resets each day.'
              : cadence === 'weekly'
                ? 'Awards 25 XP. Counts as done all week.'
                : 'Awards 15 XP. Disappears once done.'
          }
        />

        {categories ? (
          <div className="flex flex-col gap-1.5">
            <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
              Category
            </span>
            <div className="flex flex-wrap gap-2">
              <CategoryChip
                active={categoryId === undefined}
                onClick={() => setCategoryId(undefined)}
                label="None"
                color="#6B6890"
              />
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  active={categoryId === cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  label={cat.name}
                  color={cat.color}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-3">
          {isEdit ? (
            <Button
              variant="danger"
              size="md"
              onClick={handleDelete}
              leadingIcon={<Trash2 size={14} strokeWidth={2} />}
            >
              Delete
            </Button>
          ) : null}
          <div className="flex-1" />
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
            {isEdit ? 'Save' : 'Add task'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

interface CategoryChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}

function CategoryChip({ active, onClick, label, color }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs transition-colors',
        active
          ? 'border-accent bg-accent/15 text-text-primary shadow-glow'
          : 'border-border-subtle text-text-secondary hover:text-text-primary',
      ].join(' ')}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </button>
  );
}
