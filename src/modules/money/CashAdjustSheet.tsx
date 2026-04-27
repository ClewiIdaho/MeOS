import { useEffect, useState } from 'react';
import { Modal } from '@/ui/components/Modal';
import { Button } from '@/ui/components/Button';
import { Input, Segmented } from '@/ui/components/Input';
import { createCashAdjustment } from './queries';
import { parseDollarsToCents } from '@/utils/money';

interface CashAdjustSheetProps {
  open: boolean;
  onClose: () => void;
}

type Direction = 'in' | 'out';

export function CashAdjustSheet({ open, onClose }: CashAdjustSheetProps) {
  const [direction, setDirection] = useState<Direction>('out');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDirection('out');
    setAmount('');
    setLabel('');
    setError(undefined);
  }, [open]);

  const handleSubmit = async () => {
    setError(undefined);
    const magnitude = parseDollarsToCents(amount);
    if (!label.trim()) return setError('Give it a label.');
    if (magnitude === null || magnitude <= 0) return setError('Enter a valid amount.');

    setSubmitting(true);
    try {
      await createCashAdjustment({
        amountCents: direction === 'in' ? magnitude : -magnitude,
        label,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cash adjustment" description="Track ad-hoc money in or out.">
      <div className="flex flex-col gap-4">
        <Segmented<Direction>
          label="Direction"
          value={direction}
          options={[
            { value: 'in', label: 'Cash in' },
            { value: 'out', label: 'Cash out' },
          ]}
          onChange={setDirection}
        />
        <Input
          label="Label"
          placeholder={direction === 'in' ? 'e.g. Birthday gift' : 'e.g. Groceries'}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
          maxLength={48}
        />
        <Input
          label="Amount"
          inputMode="decimal"
          placeholder="0.00"
          leading={<span className="text-text-muted">$</span>}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {error ? (
          <p className="rounded-card border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} loading={submitting}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
