import { useState } from 'react';
import { motion } from 'framer-motion';
import { Beaker, Trophy, Wallet, Dumbbell, ListChecks, RotateCcw } from 'lucide-react';
import { eventBus } from '@/utils/events';
import { Card } from './Card';
import { db } from '@/db';
import { todayYmd } from '@/utils/dates';

/**
 * Dev-only panel that fires synthetic events so the user can verify the
 * event bus → XP → streak → level pipeline on-device without any module
 * being built yet. Hidden behind a tap on the "DEV" pill so it doesn't
 * clutter the screen by default.
 */
export function DevTestPanel() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const fire = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const fireTask = () =>
    eventBus.emit('task:completed', {
      taskId: 0,
      title: 'Test daily task',
      cadence: 'daily',
      forDate: todayYmd(),
    });

  const fireBill = () =>
    eventBus.emit('bill:paid', {
      billId: 0,
      label: 'Test bill',
      amountCents: 12000,
      forMonth: todayYmd().slice(0, 7),
    });

  const fireWorkout = () =>
    eventBus.emit('workout:logged', {
      sessionId: 0,
      kind: 'lift',
      summary: '5×5 squat (test)',
      forDate: todayYmd(),
    });

  const fireGoal = () =>
    eventBus.emit('goal:completed', {
      goalId: 0,
      title: 'Test legendary goal',
      difficulty: 'legendary',
      daysTaken: 30,
      xpReward: 2000,
    });

  const resetXpAndStreak = async () => {
    await db.transaction('rw', [db.xpEvents, db.streakState], async () => {
      await db.xpEvents.clear();
      await db.streakState.put({ id: 1, current: 0, longest: 0 });
    });
  };

  return (
    <Card className="p-4" elevated={false}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2"
      >
        <Beaker size={14} strokeWidth={1.8} className="text-text-muted" />
        <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
          Test the bus
        </p>
        <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-warning">
          early
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="text-text-muted"
        >
          ›
        </motion.span>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-2 gap-2 pt-4">
          <TestButton Icon={ListChecks} label="Task +XP" onClick={() => fire(fireTask)} disabled={busy} />
          <TestButton Icon={Wallet} label="Bill +XP" onClick={() => fire(fireBill)} disabled={busy} />
          <TestButton Icon={Dumbbell} label="Workout +XP" onClick={() => fire(fireWorkout)} disabled={busy} />
          <TestButton Icon={Trophy} label="Goal +2000 XP" onClick={() => fire(fireGoal)} disabled={busy} reserved />
        </div>
        <button
          type="button"
          onClick={() => fire(resetXpAndStreak)}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-pill border border-border-subtle px-3 py-2 text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          <RotateCcw size={12} strokeWidth={2} />
          Reset XP + streak
        </button>
        <p className="mt-3 text-[11px] leading-snug text-text-muted">
          Fires a synthetic event through the bus. The orchestrator awards XP,
          updates the streak, and the avatar at the top updates live.
        </p>
      </motion.div>
    </Card>
  );
}

interface TestButtonProps {
  Icon: typeof ListChecks;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  reserved?: boolean;
}

function TestButton({ Icon, label, onClick, disabled, reserved }: TestButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex items-center gap-2 rounded-pill px-3 py-2.5 text-left text-xs',
        reserved
          ? 'bg-reserved-grad text-base shadow-reserved-glow'
          : 'bg-accent-grad text-white shadow-glow',
        'disabled:opacity-50',
      ].join(' ')}
    >
      <Icon size={14} strokeWidth={2.2} />
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}
