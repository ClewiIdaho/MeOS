import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Bill, type BillPayment, type Income, type CashAdjustment } from '@/db';
import { eventBus } from '@/utils/events';

export interface BillWithStatus {
  bill: Bill;
  payment?: BillPayment;
  /** YYYY-MM the status applies to (current month). */
  forMonth: string;
  /** Resolved JS date for the bill's due-day in the current month. */
  dueDate: Date;
  status: 'paid' | 'overdue' | 'due-soon' | 'upcoming';
}

function ymOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function clampDueDay(dueDay: number, year: number, month: number): Date {
  // month is 0-indexed
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(Math.max(1, dueDay), lastDay);
  return new Date(year, month, day);
}

/** Active bills + their status in the current month. */
export function useBillsThisMonth(): BillWithStatus[] | undefined {
  return useLiveQuery(async () => {
    const [bills, payments] = await Promise.all([
      db.bills.toArray(),
      db.billPayments.toArray(),
    ]);
    const now = new Date();
    const forMonth = ymOf(now);
    const today = now.getTime();
    const soonThreshold = today + 1000 * 60 * 60 * 24 * 4; // 4 days

    const active = bills.filter((b) => b.active);
    return active
      .map<BillWithStatus>((bill) => {
        const dueDate = clampDueDay(bill.dueDay, now.getFullYear(), now.getMonth());
        const payment = payments.find(
          (p) => p.billId === bill.id && p.forMonth === forMonth,
        );
        let status: BillWithStatus['status'];
        if (payment) status = 'paid';
        else if (dueDate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime())
          status = 'overdue';
        else if (dueDate.getTime() <= soonThreshold) status = 'due-soon';
        else status = 'upcoming';
        return {
          bill,
          ...(payment ? { payment } : {}),
          forMonth,
          dueDate,
          status,
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, []);
}

export function useIncomes(): Income[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.incomes.toArray();
    return all
      .filter((i) => i.active)
      .sort((a, b) => b.startDate - a.startDate);
  }, []);
}

export function useCashAdjustments(limit = 20): CashAdjustment[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.cashAdjustments.orderBy('at').reverse().limit(limit).toArray();
    return all;
  }, [limit]);
}

export interface MoneySummary {
  /** Cents on hand — sum of (one-time incomes received + adjustments) − paid bills. */
  cashOnHand: number;
  /** Cents of bills due in the current calendar month, regardless of paid status. */
  billsThisMonth: number;
  /** Cents already paid this month. */
  paidThisMonth: number;
  /** Cents remaining unpaid this month. */
  remainingThisMonth: number;
  /** Estimated monthly income (recurring cadence + per-month equivalent). */
  monthlyIncomeEstimate: number;
  /** Count of bills overdue right now. */
  overdueCount: number;
}

export function useMoneySummary(): MoneySummary | undefined {
  return useLiveQuery(async () => {
    const [bills, payments, incomes, adjustments] = await Promise.all([
      db.bills.toArray(),
      db.billPayments.toArray(),
      db.incomes.toArray(),
      db.cashAdjustments.toArray(),
    ]);
    const now = new Date();
    const forMonth = ymOf(now);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const activeBills = bills.filter((b) => b.active);
    const billsThisMonth = activeBills.reduce((s, b) => s + b.amount, 0);

    const paymentsThisMonth = payments.filter((p) => p.forMonth === forMonth);
    const paidThisMonth = paymentsThisMonth.reduce((s, p) => s + p.amount, 0);
    const remainingThisMonth = Math.max(0, billsThisMonth - paidThisMonth);

    const overdueCount = activeBills.filter((b) => {
      const due = clampDueDay(b.dueDay, now.getFullYear(), now.getMonth()).getTime();
      const paid = paymentsThisMonth.find((p) => p.billId === b.id);
      return !paid && due < todayStart;
    }).length;

    const oneTimeReceived = incomes
      .filter((i) => i.active && i.cadence === 'one-time' && i.startDate <= now.getTime())
      .reduce((s, i) => s + i.amount, 0);

    const totalAdjustments = adjustments.reduce((s, a) => s + a.amount, 0);
    const totalPaymentsAllTime = payments.reduce((s, p) => s + p.amount, 0);
    const cashOnHand = oneTimeReceived + totalAdjustments - totalPaymentsAllTime;

    const monthlyIncomeEstimate = incomes
      .filter((i) => i.active)
      .reduce((s, i) => {
        switch (i.cadence) {
          case 'weekly':
            return s + i.amount * 4.345;
          case 'biweekly':
            return s + i.amount * 2.1725;
          case 'monthly':
            return s + i.amount;
          default:
            return s;
        }
      }, 0);

    return {
      cashOnHand: Math.round(cashOnHand),
      billsThisMonth,
      paidThisMonth,
      remainingThisMonth,
      monthlyIncomeEstimate: Math.round(monthlyIncomeEstimate),
      overdueCount,
    };
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

interface CreateBillInput {
  label: string;
  amountCents: number;
  dueDay: number;
  category?: string;
  notes?: string;
}

export async function createBill(input: CreateBillInput): Promise<number> {
  const newBill: Omit<Bill, 'id'> = {
    label: input.label.trim(),
    amount: input.amountCents,
    dueDay: input.dueDay,
    active: true,
    createdAt: Date.now(),
    ...(input.category ? { category: input.category } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  };
  return (await db.bills.add(newBill as Bill)) as number;
}

export async function updateBill(id: number, patch: Partial<Bill>): Promise<void> {
  await db.bills.update(id, patch);
}

export async function deleteBill(id: number): Promise<void> {
  await db.transaction('rw', [db.bills, db.billPayments], async () => {
    await db.billPayments.where('billId').equals(id).delete();
    await db.bills.delete(id);
  });
}

/** Marks a bill paid for a given month. Idempotent; returns the payment record. */
export async function payBill(billId: number, forMonth: string): Promise<BillPayment | null> {
  const bill = await db.bills.get(billId);
  if (!bill) return null;

  let payment: BillPayment | undefined;
  let created = false;

  await db.transaction('rw', [db.billPayments], async () => {
    const existing = await db.billPayments
      .where('[billId+forMonth]')
      .equals([billId, forMonth])
      .first();
    if (existing) {
      payment = existing;
      return;
    }
    const newPayment: Omit<BillPayment, 'id'> = {
      billId,
      paidAt: Date.now(),
      amount: bill.amount,
      forMonth,
    };
    const id = await db.billPayments.add(newPayment as BillPayment);
    payment = { ...newPayment, id } as BillPayment;
    created = true;
  });

  if (created && payment) {
    await eventBus.emit('bill:paid', {
      billId,
      label: bill.label,
      amountCents: payment.amount,
      forMonth,
    });
  }
  return payment ?? null;
}

export async function unpayBill(billId: number, forMonth: string): Promise<boolean> {
  let removed = false;
  await db.transaction('rw', [db.billPayments], async () => {
    const existing = await db.billPayments
      .where('[billId+forMonth]')
      .equals([billId, forMonth])
      .first();
    if (existing?.id !== undefined) {
      await db.billPayments.delete(existing.id);
      removed = true;
    }
  });
  return removed;
}

interface CreateIncomeInput {
  label: string;
  amountCents: number;
  cadence: Income['cadence'];
  startDate: number;
  notes?: string;
}

export async function createIncome(input: CreateIncomeInput): Promise<number> {
  const newIncome: Omit<Income, 'id'> = {
    label: input.label.trim(),
    amount: input.amountCents,
    cadence: input.cadence,
    startDate: input.startDate,
    active: true,
    createdAt: Date.now(),
    ...(input.notes ? { notes: input.notes } : {}),
  };
  return (await db.incomes.add(newIncome as Income)) as number;
}

export async function deleteIncome(id: number): Promise<void> {
  await db.incomes.delete(id);
}

interface CreateAdjustmentInput {
  amountCents: number; // signed
  label: string;
}

export async function createCashAdjustment(input: CreateAdjustmentInput): Promise<number> {
  const newAdj: Omit<CashAdjustment, 'id'> = {
    amount: input.amountCents,
    label: input.label.trim(),
    at: Date.now(),
  };
  const id = (await db.cashAdjustments.add(newAdj as CashAdjustment)) as number;
  await eventBus.emit('cash:adjusted', {
    deltaCents: input.amountCents,
    label: input.label.trim(),
  });
  return id;
}
