import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Sheet } from '@/ui/components/Sheet';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { createExercise, deleteExercise, renameExercise, useExercises } from './queries';
import type { Exercise } from '@/db';

interface ExerciseSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Manages the lift exercise library — add, rename, delete.
 * Cardio and mobility use free-form types per session, so they don't appear here.
 */
export function ExerciseSheet({ open, onClose }: ExerciseSheetProps) {
  const exercises = useExercises();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setNewName('');
      setEditing(null);
    }
  }, [open]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    try {
      await createExercise(name);
      setNewName('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveRename = async () => {
    if (!editing || !editing.name.trim()) return;
    setSubmitting(true);
    try {
      await renameExercise(editing.id, editing.name);
      setEditing(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ex: Exercise) => {
    if (!ex.id) return;
    if (!confirm(`Delete "${ex.name}"? This removes its sets and PRs too.`)) return;
    setSubmitting(true);
    try {
      await deleteExercise(ex.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Lift exercises" description="Build the library you actually train.">
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Add exercise"
              placeholder="e.g. Back squat"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={48}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleAdd}
            disabled={!newName.trim() || submitting}
            leadingIcon={<Plus size={14} strokeWidth={2.4} />}
          >
            Add
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
            Library
          </span>
          {!exercises || exercises.length === 0 ? (
            <p className="rounded-card border border-border-subtle bg-surface/50 px-4 py-3 text-xs text-text-muted">
              No exercises yet. Add the lifts you train above.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {exercises.map((ex) => {
                const isEditing = editing?.id === ex.id;
                return (
                  <li
                    key={ex.id}
                    className="glass flex items-center gap-2 rounded-card border border-border-subtle px-3 py-2"
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editing!.name}
                        onChange={(e) => setEditing({ id: editing!.id, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveRename();
                          }
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        className="flex-1 bg-transparent text-sm text-text-primary outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditing({ id: ex.id!, name: ex.name })}
                        className="flex-1 truncate text-left text-sm text-text-primary"
                      >
                        {ex.name}
                      </button>
                    )}
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="text-[11px] uppercase tracking-wider text-text-muted"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveRename}
                          className="text-[11px] uppercase tracking-wider text-accent"
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDelete(ex)}
                        aria-label={`Delete ${ex.name}`}
                        className="grid h-7 w-7 place-items-center rounded-full text-text-muted hover:text-danger"
                      >
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-2 flex justify-end">
          <Button variant="ghost" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
