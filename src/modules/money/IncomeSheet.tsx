import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Sheet } from '@/ui/components/Sheet';
import { Button } from '@/ui/components/Button';
import { Input, Segmented } from '@/ui/components/Input';
import { createIncome, deleteIncome } from './queries';
import { parseDollarsToCents } from '@/utils/money';
import type { Income, IncomeCadence } from '@/db';

interface IncomeSheetProps {
  open: boolean;
  onClose: () => void;
  /** When provided, sheet shows the existing income and allows deletion. */
  income?: Income;
}

export function IncomeSheet({ open, onClose, income }: IncomeSheetProps) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [cadence, setCadence] = useState<IncomeCadence>('biweekly');
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLabel('');
    setAmount('');
    setCadence('biweekly');
    setError(undefined);
  }, [open]);

  const isView = Boolean(income);

  const handleSubmit = async () => {
    setError(undefined);
    const cents = parseDollarsToCents(amount);
    if (!label.trim()) return setError('Give it a name.');
    if (cents === null || cents <= 0) return setError('Enter a valid amount.');

    setSubmitting(true);
    try {
      await createIncome({
        label,
        amountCents: cents,
        cadence,
        startDate: Date.now(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!income?.id) return;
    if (!confirm(`Remove "${income.label}"?`)) return;
    setSubmitting(true);
    try {
      await deleteIncome(income.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (isView && income) {
    return (
      <Sheet open={open} onClose={onClose} title={income.label} description="Income source">
        <div className="flex flex-col gap-3 text-sm text-text-secondary">
          <Row label="Cadence" value={income.cadence} />
          <Row label="Amount" value={`$${(income.amount / 100).toFixed(2)}`} />
          <Row label="Started" value={new Date(income.startDate).toLocaleDateString()} />
          <div className="flex justify-end pt-3">
            <Button
              variant="danger"
              size="md"
              onClick={handleDelete}
              loading={submitting}
              leadingIcon={<Trash2 size={14} strokeWidth={2} />}
            >
              Remove
            </Button>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="New income" description="One-time or recurring.">
      <div className="flex flex-col gap-4">
        <Input
          label="Source"
          placeholder="e.g. Day job"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
          maxLength={48}
        />

        <Input
          label="Amount per payment"
          inputMode="decimal"
          placeholder="0.00"
          leading={<span className="text-text-muted">$</span>}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Segmented<IncomeCadence>
          label="Cadence"
          value={cadence}
          options={[
            { value: 'one-time', label: 'One-time' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'biweekly', label: 'Biweekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
          onChange={setCadence}
        />

        {error ? (
          <p className="rounded-card border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-2 flex items-center justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} loading={submitting}>
            Add income
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-2">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
