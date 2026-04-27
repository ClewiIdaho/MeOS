import { useEffect, useState } from 'react';
import { Sheet } from '@/ui/components/Sheet';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { createMobilitySession } from './queries';

interface MobilitySheetProps {
  open: boolean;
  onClose: () => void;
}

const COMMON_FOCUS = ['Hips', 'Shoulders', 'Lower back', 'Full-body', 'Hamstrings'];

export function MobilitySheet({ open, onClose }: MobilitySheetProps) {
  const [duration, setDuration] = useState('');
  const [focus, setFocus] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDuration('');
    setFocus('');
    setError(undefined);
  }, [open]);

  const handleSubmit = async () => {
    setError(undefined);
    const min = parseFloat(duration);
    if (!Number.isFinite(min) || min <= 0) return setError('Duration must be positive.');

    setSubmitting(true);
    try {
      await createMobilitySession({
        durationMinutes: min,
        ...(focus.trim() ? { focus: focus.trim() } : {}),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Log mobility" description="Stretching, foam rolling, yoga — it counts.">
      <div className="flex flex-col gap-4">
        <Input
          label="Duration (minutes)"
          inputMode="decimal"
          placeholder="15"
          value={duration}
          onChange={(e) => setDuration(e.target.value.replace(/[^0-9.]/g, '').slice(0, 5))}
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Focus (optional)"
            placeholder="e.g. Hips"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            maxLength={32}
          />
          <div className="-mx-1 flex flex-wrap gap-2 px-1 pt-1">
            {COMMON_FOCUS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFocus(f)}
                className={[
                  'rounded-pill border px-3 py-1 text-[11px] uppercase tracking-wider transition-colors',
                  focus.toLowerCase() === f.toLowerCase()
                    ? 'border-accent bg-accent/15 text-text-primary'
                    : 'border-border-subtle text-text-secondary',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="rounded-card border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1" />
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} loading={submitting}>
            Log mobility
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
