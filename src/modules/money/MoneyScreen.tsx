import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, ArrowDownRight, ArrowUpRight, Coins } from 'lucide-react';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { EmptyState } from '@/ui/components/EmptyState';
import { AnimatedNumber } from '@/ui/components/AnimatedNumber';
import { LevelPulseCard } from '@/ui/components/LevelPulseCard';
import { BillRow } from './BillRow';
import { BillSheet } from './BillSheet';
import { IncomeSheet } from './IncomeSheet';
import { CashAdjustSheet } from './CashAdjustSheet';
import { useBillsThisMonth, useIncomes, useCashAdjustments, useMoneySummary } from './queries';
import { formatCents } from '@/utils/money';
import type { Bill, Income } from '@/db';

export function MoneyScreen() {
  const summary = useMoneySummary();
  const bills = useBillsThisMonth();
  const incomes = useIncomes();
  const adjustments = useCashAdjustments(8);

  const [billSheet, setBillSheet] = useState<{ open: boolean; bill?: Bill }>({ open: false });
  const [incomeSheet, setIncomeSheet] = useState<{ open: boolean; income?: Income }>({ open: false });
  const [adjustSheet, setAdjustSheet] = useState(false);

  const openCreateBill = () => setBillSheet({ open: true });
  const openEditBill = (bill: Bill) => setBillSheet({ open: true, bill });
  const closeBill = () => setBillSheet({ open: false });

  return (
    <>
      <ScreenHeader
        eyebrow="Money"
        title="Cash flow."
        subtitle="Income in. Bills out. The number on top is what's left."
        right={
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateBill}
            leadingIcon={<Plus size={14} strokeWidth={2.4} />}
          >
            Bill
          </Button>
        }
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        className="flex flex-col gap-4"
      >
        <motion.div variants={fadeUp}>
          <CashOnHandCard
            cashCents={summary?.cashOnHand ?? 0}
            remainingCents={summary?.remainingThisMonth ?? 0}
            paidCents={summary?.paidThisMonth ?? 0}
            billsCents={summary?.billsThisMonth ?? 0}
            overdueCount={summary?.overdueCount ?? 0}
            onCashAdjust={() => setAdjustSheet(true)}
            onAddIncome={() => setIncomeSheet({ open: true })}
          />
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
              Bills · this month
            </p>
            {bills && bills.length > 0 ? (
              <span className="display-num text-[11px] uppercase tracking-wider text-text-muted">
                {bills.filter((b) => b.status === 'paid').length} / {bills.length} paid
              </span>
            ) : null}
          </div>

          {!bills || bills.length === 0 ? (
            <EmptyState
              Icon={Wallet}
              title="No bills tracked."
              description="Add the first one — rent, phone, whatever you actually pay every month."
              action={
                <Button
                  variant="primary"
                  size="md"
                  onClick={openCreateBill}
                  leadingIcon={<Plus size={14} strokeWidth={2.4} />}
                >
                  Add a bill
                </Button>
              }
            />
          ) : (
            bills.map((item) => (
              <BillRow key={item.bill.id} item={item} onEdit={() => openEditBill(item.bill)} />
            ))
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
              Income · monthly est.
            </p>
            <button
              type="button"
              onClick={() => setIncomeSheet({ open: true })}
              className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-accent"
            >
              <Plus size={12} strokeWidth={2.4} /> Add
            </button>
          </div>
          {incomes && incomes.length > 0 ? (
            incomes.map((income) => (
              <button
                key={income.id}
                type="button"
                onClick={() => setIncomeSheet({ open: true, income })}
                className="glass flex items-center justify-between rounded-card border border-border-subtle px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-success/15 text-success">
                    <ArrowDownRight size={16} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-[15px] font-medium text-text-primary">{income.label}</p>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">
                      {income.cadence}
                    </p>
                  </div>
                </div>
                <span className="display-num text-base font-semibold tabular-nums text-text-primary">
                  {formatCents(income.amount)}
                </span>
              </button>
            ))
          ) : (
            <p className="rounded-card border border-border-subtle bg-surface/50 px-4 py-3 text-xs text-text-muted">
              Add at least one income to see a monthly estimate and pace toward money goals.
            </p>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
              Recent cash moves
            </p>
            <button
              type="button"
              onClick={() => setAdjustSheet(true)}
              className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-accent"
            >
              <Plus size={12} strokeWidth={2.4} /> Log
            </button>
          </div>
          {adjustments && adjustments.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {adjustments.map((adj) => {
                const positive = adj.amount > 0;
                return (
                  <div
                    key={adj.id}
                    className="glass flex items-center justify-between rounded-card border border-border-subtle px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          'grid h-8 w-8 place-items-center rounded-full',
                          positive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
                        ].join(' ')}
                      >
                        {positive ? (
                          <ArrowDownRight size={14} strokeWidth={2} />
                        ) : (
                          <ArrowUpRight size={14} strokeWidth={2} />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{adj.label}</p>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted">
                          {new Date(adj.at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={[
                        'display-num text-sm font-semibold tabular-nums',
                        positive ? 'text-success' : 'text-text-secondary',
                      ].join(' ')}
                    >
                      {positive ? '+' : ''}{formatCents(adj.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-card border border-border-subtle bg-surface/50 px-4 py-3 text-xs text-text-muted">
              No adjustments yet. Use this for one-off spends or windfalls.
            </p>
          )}
        </motion.div>

        <motion.div variants={fadeUp}>
          <LevelPulseCard />
        </motion.div>
      </motion.div>

      <BillSheet open={billSheet.open} onClose={closeBill} bill={billSheet.bill} />
      <IncomeSheet
        open={incomeSheet.open}
        onClose={() => setIncomeSheet({ open: false })}
        income={incomeSheet.income}
      />
      <CashAdjustSheet open={adjustSheet} onClose={() => setAdjustSheet(false)} />
    </>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

interface CashOnHandCardProps {
  cashCents: number;
  remainingCents: number;
  paidCents: number;
  billsCents: number;
  overdueCount: number;
  onCashAdjust: () => void;
  onAddIncome: () => void;
}

function CashOnHandCard({
  cashCents,
  remainingCents,
  paidCents,
  billsCents,
  overdueCount,
  onCashAdjust,
  onAddIncome,
}: CashOnHandCardProps) {
  const ratio = billsCents > 0 ? paidCents / billsCents : 0;
  const negative = cashCents < 0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={14} strokeWidth={2} className="text-accent" />
          <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
            Cash on hand
          </p>
        </div>
        {overdueCount > 0 ? (
          <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-danger">
            {overdueCount} overdue
          </span>
        ) : null}
      </div>

      <p
        className={[
          'display-num mt-3 text-[44px] font-bold leading-none tracking-display tabular-nums',
          negative ? 'text-danger' : 'text-text-primary',
        ].join(' ')}
      >
        <AnimatedNumber value={cashCents / 100} prefix="$" decimals={2} />
      </p>
      <p className="mt-1 text-xs text-text-muted">
        After paid bills + tracked cash moves.
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <div>
          <p className="text-text-muted">Paid this month</p>
          <p className="display-num text-base font-semibold text-text-primary">
            <AnimatedNumber value={paidCents / 100} prefix="$" decimals={0} />
          </p>
        </div>
        <div>
          <p className="text-text-muted">Remaining</p>
          <p className="display-num text-base font-semibold text-text-primary">
            <AnimatedNumber value={remainingCents / 100} prefix="$" decimals={0} />
          </p>
        </div>
        <div>
          <p className="text-text-muted">Total bills</p>
          <p className="display-num text-base font-semibold text-text-primary">
            <AnimatedNumber value={billsCents / 100} prefix="$" decimals={0} />
          </p>
        </div>
      </div>

      <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(1, ratio) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          className="bg-accent-grad shadow-glow absolute inset-y-0 left-0 rounded-full"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="secondary" size="sm" fullWidth onClick={onAddIncome}>
          Add income
        </Button>
        <Button variant="secondary" size="sm" fullWidth onClick={onCashAdjust}>
          Cash adjust
        </Button>
      </div>
    </Card>
  );
}
