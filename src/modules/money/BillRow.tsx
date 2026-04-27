import { motion } from 'framer-motion';
import { Check, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import type { BillWithStatus } from './queries';
import { payBill, unpayBill } from './queries';
import { formatCents } from '@/utils/money';

interface BillRowProps {
  item: BillWithStatus;
  onEdit: () => void;
}

const statusBadge: Record<BillWithStatus['status'], { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-success/15 text-success' },
  overdue: { label: 'Overdue', className: 'bg-danger/15 text-danger' },
  'due-soon': { label: 'Due soon', className: 'bg-warning/15 text-warning' },
  upcoming: { label: 'Upcoming', className: 'bg-surface-elevated text-text-muted' },
};

export function BillRow({ item, onEdit }: BillRowProps) {
  const { bill, dueDate, status, forMonth } = item;
  const paid = status === 'paid';

  const toggle = async () => {
    if (paid) await unpayBill(bill.id!, forMonth);
    else await payBill(bill.id!, forMonth);
  };

  const badge = statusBadge[status];

  return (
    <motion.div
      layout
      className={[
        'glass relative flex items-center gap-3 rounded-card border px-4 py-3 transition-colors',
        paid
          ? 'border-success/30'
          : status === 'overdue'
            ? 'border-danger/30'
            : 'border-border-subtle',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={paid ? 'Mark unpaid' : 'Mark paid'}
        className={[
          'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-all',
          paid
            ? 'border-success bg-success/20 text-success'
            : 'border-border-subtle text-transparent hover:border-accent',
        ].join(' ')}
      >
        <motion.span
          initial={false}
          animate={{ scale: paid ? 1 : 0, opacity: paid ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        >
          <Check size={16} strokeWidth={3} />
        </motion.span>
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 flex-col items-start text-left"
      >
        <span
          className={[
            'truncate text-[15px] font-medium leading-tight',
            paid ? 'text-text-muted line-through' : 'text-text-primary',
          ].join(' ')}
        >
          {bill.label}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
          <span>Due {format(dueDate, 'MMM d')}</span>
          {bill.category ? (
            <>
              <span className="text-border-subtle">•</span>
              <span>{bill.category}</span>
            </>
          ) : null}
        </span>
      </button>

      <div className="flex flex-col items-end gap-1">
        <span
          className={[
            'display-num text-base font-semibold tabular-nums',
            paid ? 'text-text-muted line-through' : 'text-text-primary',
          ].join(' ')}
        >
          {formatCents(bill.amount)}
        </span>
        <span
          className={[
            'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider',
            badge.className,
          ].join(' ')}
        >
          {badge.label}
        </span>
      </div>

      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit bill"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:text-text-secondary"
      >
        <Pencil size={14} strokeWidth={1.8} />
      </button>
    </motion.div>
  );
}
