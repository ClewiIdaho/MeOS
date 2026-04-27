import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/ui/components/Modal';
import { Button } from '@/ui/components/Button';
import { Textarea, Segmented } from '@/ui/components/Input';
import {
  createCustomQuip,
  deleteCustomQuip,
  updateCustomQuip,
} from './voiceQuipQueries';
import type { CustomQuip } from '@/db';
import type { QuipCategory } from '@/voice/types';

const CATEGORY_OPTIONS: Array<{ value: QuipCategory; label: string }> = [
  { value: 'recap', label: 'Recap' },
  { value: 'push', label: 'Push' },
  { value: 'real_talk', label: 'Real Talk' },
];

interface VoiceStudioSheetProps {
  open: boolean;
  onClose: () => void;
  quip?: CustomQuip;
}

export function VoiceStudioSheet({ open, onClose, quip }: VoiceStudioSheetProps) {
  const [category, setCategory] = useState<QuipCategory>('push');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategory(((quip?.category as QuipCategory) ?? 'push'));
    setText(quip?.text ?? '');
  }, [open, quip]);

  const isEdit = Boolean(quip);
  const canSubmit = text.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (quip?.id) {
        await updateCustomQuip(quip.id, { category, text });
      } else {
        await createCustomQuip({ category, text });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!quip?.id) return;
    if (!confirm('Delete this custom quip?')) return;
    setSubmitting(true);
    try {
      await deleteCustomQuip(quip.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit quip' : 'Write a quip'}
      description="Use {tokens} like {streak}, {xpThisWeek}, {tasks} — they substitute at render time."
    >
      <div className="flex flex-col gap-4">
        <Segmented<QuipCategory>
          label="Category"
          value={category}
          options={CATEGORY_OPTIONS}
          onChange={setCategory}
        />

        <Textarea
          label="Text"
          placeholder="e.g. {streak} days. Don't blink."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={240}
          autoFocus
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
            {isEdit ? 'Save' : 'Add quip'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
