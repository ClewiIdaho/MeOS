import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Sheet } from '@/ui/components/Sheet';
import { Button } from '@/ui/components/Button';
import { Input, Textarea } from '@/ui/components/Input';
import { createBill, deleteBill, updateBill } from './queries';
import { parseDollarsToCents, centsToDollars } from '@/utils/money';
import type { Bill } from '@/db';

interface BillSheetProps {
  open: boolean;
  onClose: () => void;
  bill?: Bill;
}

export function BillSheet({ open, onClose, bill }: BillSheetProps) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLabel(bill?.label ?? '');
    setAmount(bill ? centsToDollars(bill.amount).toFixed(2) : '');
    setDueDay(String(bill?.dueDay ?? 1));
    setCategory(bill?.category ?? '');
    setNotes(bill?.notes ?? '');
    setError(undefined);
  }, [open, bill]);

  const isEdit = Boolean(bill);

  const handleSubmit = async () => {
    setError(undefined);
    const cents = parseDollarsToCents(amount);
    if (!label.trim()) return setError('Give it a name.');
    if (cents === null || cents <= 0) return setError('Enter a valid amount.');
    const day = Number(dueDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) return setError('Day must be 1–31.');

    setSubmitting(true);
    try {
      if (bill?.id) {
        await updateBill(bill.id, {
          label: label.trim(),
          amount: cents,
          dueDay: day,
          category: category.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await createBill({
          label,
          amountCents: cents,
          dueDay: day,
          category: category.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!bill?.id) return;
    if (!confirm(`Delete "${bill.label}"? This removes payment history too.`)) return;
    setSubmitting(true);
    try {
      await deleteBill(bill.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit bill' : 'New bill'}
      description="Recurring monthly. Set the day it's due and the amount."
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          placeholder="e.g. Rent"
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

        <Input
          label="Due day of month"
          inputMode="numeric"
          placeholder="1–31"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
          hint="If a month is shorter, MY.OS clamps to the last day."
        />

        <Input
          label="Category (optional)"
          placeholder="e.g. Housing, Subscriptions"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={24}
        />

        <Textarea
          label="Notes (optional)"
          placeholder="Account number, autopay info, anything."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={200}
        />

        {error ? (
          <p className="rounded-card border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
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
          <Button variant="primary" size="md" onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save' : 'Add bill'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
