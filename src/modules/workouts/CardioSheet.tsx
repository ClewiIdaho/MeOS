import { useEffect, useState } from 'react';
import { Sheet } from '@/ui/components/Sheet';
import { Button } from '@/ui/components/Button';
import { Input, Segmented } from '@/ui/components/Input';
import { createCardioSession } from './queries';
import { useUserSettings } from '@/hooks/useUserSettings';
import type { DistanceUnit } from '@/db';

interface CardioSheetProps {
  open: boolean;
  onClose: () => void;
}

const COMMON_TYPES = ['Run', 'Bike', 'Row', 'Walk', 'Swim'];

export function CardioSheet({ open, onClose }: CardioSheetProps) {
  const settings = useUserSettings();
  const defaultUnit = settings?.distanceUnit ?? 'mi';

  const [cardioType, setCardioType] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState<DistanceUnit>(defaultUnit);
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCardioType('');
    setDuration('');
    setDistance('');
    setUnit(defaultUnit);
    setError(undefined);
  }, [open, defaultUnit]);

  const handleSubmit = async () => {
    setError(undefined);
    const type = cardioType.trim();
    if (!type) return setError('What kind of cardio?');
    const min = parseFloat(duration);
    if (!Number.isFinite(min) || min <= 0) return setError('Duration must be positive.');
    const dist = distance.trim() ? parseFloat(distance) : undefined;
    if (distance.trim() && (!Number.isFinite(dist!) || dist! < 0)) {
      return setError('Distance must be 0 or more.');
    }

    setSubmitting(true);
    try {
      await createCardioSession({
        cardioType: type,
        durationMinutes: min,
        ...(dist !== undefined ? { distance: dist, unit } : {}),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Log cardio" description="Type, duration, and distance if you tracked it.">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Input
            label="Type"
            placeholder="e.g. Run, Bike, HIIT"
            value={cardioType}
            onChange={(e) => setCardioType(e.target.value)}
            maxLength={32}
            autoFocus
          />
          <div className="-mx-1 flex flex-wrap gap-2 px-1 pt-1">
            {COMMON_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCardioType(t)}
                className={[
                  'rounded-pill border px-3 py-1 text-[11px] uppercase tracking-wider transition-colors',
                  cardioType.toLowerCase() === t.toLowerCase()
                    ? 'border-accent bg-accent/15 text-text-primary'
                    : 'border-border-subtle text-text-secondary',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Duration (minutes)"
          inputMode="decimal"
          placeholder="30"
          value={duration}
          onChange={(e) => setDuration(e.target.value.replace(/[^0-9.]/g, '').slice(0, 5))}
        />

        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <Input
            label="Distance (optional)"
            inputMode="decimal"
            placeholder="3.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
          />
          <Segmented<DistanceUnit>
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'mi', label: 'mi' },
              { value: 'km', label: 'km' },
            ]}
          />
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
            Log cardio
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
