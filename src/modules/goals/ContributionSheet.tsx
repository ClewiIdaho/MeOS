import { useEffect, useState } from 'react';
import { Modal } from '@/ui/components/Modal';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { contributeToGoal } from '@/engine/goalsEngine';
import { parseDollarsToCents } from '@/utils/money';
import type { Goal } from '@/db';
import { isMoneyGoal } from './format';

interface ContributionSheetProps {
  open: boolean;
  onClose: () => void;
  goal: Goal | undefined;
}

export function ContributionSheet({ open, onClose, goal }: ContributionSheetProps) {
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setLabel('');
    setError(undefined);
  }, [open, goal?.id]);

  if (!goal) return null;
  const isMoney = isMoneyGoal(goal.unit);

  const handleSubmit = async () => {
    setError(undefined);
    let delta: number;
    if (isMoney) {
      const cents = parseDollarsToCents(amount);
      if (cents === null || cents === 0) return setError('Enter a positive amount.');
      delta = cents;
    } else {
      const n = parseFloat(amount);
      if (!Number.isFinite(n) || n === 0) return setError('Enter a positive amount.');
      delta = n;
    }

    setSubmitting(true);
    try {
      await contributeToGoal({
        goalId: goal.id!,
        delta,
        ...(label.trim() ? { label: label.trim() } : {}),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Contribute"
      description={`Toward "${goal.title}". Logged with the time and label.`}
    >
      <div className="flex flex-col gap-4">
        <Input
          label={`Amount (${goal.unit || 'units'})`}
          inputMode={isMoney ? 'decimal' : 'numeric'}
          placeholder={isMoney ? '50.00' : '1'}
          {...(isMoney ? { leading: <span className="text-text-muted">$</span> } : {})}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />

        <Input
          label="Note (optional)"
          placeholder="What was this for?"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={64}
        />

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
            Log it
          </Button>
        </div>
      </div>
    </Modal>
  );
}
