import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/ui/components/Modal';
import { Button } from '@/ui/components/Button';
import { Input, Textarea } from '@/ui/components/Input';
import { createNotebookEntry, deleteNotebookEntry, updateNotebookEntry } from './queries';
import type { NotebookEntry } from '@/db';

interface NotebookSheetProps {
  open: boolean;
  onClose: () => void;
  /** When provided, sheet edits this entry. Otherwise it creates a new one. */
  entry?: NotebookEntry;
  /** Optional preset body (e.g. when saving a Voice quip). */
  presetBody?: string;
  /** Optional preset title. */
  presetTitle?: string;
  /** When set, mark the new entry as fromVoice with this category. */
  voiceCategory?: string;
}

export function NotebookSheet({
  open,
  onClose,
  entry,
  presetBody,
  presetTitle,
  voiceCategory,
}: NotebookSheetProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(entry?.title ?? presetTitle ?? '');
    setBody(entry?.body ?? presetBody ?? '');
    setTagsRaw(entry?.tags.join(', ') ?? '');
  }, [open, entry, presetTitle, presetBody]);

  const isEdit = Boolean(entry);
  const canSubmit = body.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (entry?.id) {
        await updateNotebookEntry(entry.id, { title, body, tagsRaw });
      } else {
        await createNotebookEntry({
          title,
          body,
          tagsRaw,
          fromVoice: Boolean(voiceCategory),
          ...(voiceCategory ? { voiceCategory } : {}),
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entry?.id) return;
    if (!confirm(`Delete "${entry.title}"?`)) return;
    setSubmitting(true);
    try {
      await deleteNotebookEntry(entry.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit note' : voiceCategory ? 'Save to notebook' : 'New note'}
      description={
        isEdit
          ? 'Tweak the text or tags.'
          : voiceCategory
            ? 'Lock the take in. Add tags so you can find it later.'
            : 'A lesson, a tactic, a thought. Tag it so future-you can find it.'
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          placeholder="Optional. Defaults to 'Untitled'."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />

        <Textarea
          label="Body"
          placeholder="Write the note."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          autoFocus={!isEdit}
        />

        <Input
          label="Tags (comma-separated)"
          placeholder="e.g. money, focus, lesson"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
        />

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
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
          >
            {isEdit ? 'Save' : 'Add note'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
