import { motion } from 'framer-motion';
import { Trophy, Target, TrendingUp, TrendingDown, Clock, Sparkles } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/ui/components/Card';
import { AnimatedNumber } from '@/ui/components/AnimatedNumber';
import { db, type GoalContribution } from '@/db';
import { computePace, type GoalWithMilestones, type PaceBand } from './queries';
import { formatGoalValue } from './format';

interface GoalCardProps {
  entry: GoalWithMilestones;
  onOpen: () => void;
}

const bandStyle: Record<PaceBand, { label: string; pillClass: string; barClass: string }> = {
  completed: {
    label: 'Complete',
    pillClass: 'bg-reserved/15 text-reserved',
    barClass: 'bg-reserved-grad',
  },
  ahead: {
    label: 'Ahead',
    pillClass: 'bg-success/15 text-success',
    barClass: 'bg-success/80',
  },
  'on-track': {
    label: 'On track',
    pillClass: 'bg-accent/15 text-accent',
    barClass: 'bg-accent-grad',
  },
  behind: {
    label: 'Behind',
    pillClass: 'bg-warning/15 text-warning',
    barClass: 'bg-warning/80',
  },
  overdue: {
    label: 'Overdue',
    pillClass: 'bg-danger/15 text-danger',
    barClass: 'bg-danger/80',
  },
  'no-deadline': {
    label: 'No deadline',
    pillClass: 'bg-surface-elevated text-text-muted',
    barClass: 'bg-accent/70',
  },
};

export function GoalCard({ entry, onOpen }: GoalCardProps) {
  const { goal, milestones } = entry;

  const recent = useLiveQuery<GoalContribution[]>(async () => {
    return db.goalContributions.where('goalId').equals(goal.id!).reverse().sortBy('at');
  }, [goal.id]);

  const pace = computePace(goal, recent ?? []);
  const style = bandStyle[pace.band];
  const PaceIcon =
    pace.band === 'ahead'
      ? TrendingUp
      : pace.band === 'behind' || pace.band === 'overdue'
        ? TrendingDown
        : pace.band === 'completed'
          ? Trophy
          : pace.band === 'no-deadline'
            ? Sparkles
            : Target;

  return (
    <motion.button
      type="button"
      layout
      onClick={onOpen}
      whileTap={{ scale: 0.99 }}
      className="block w-full text-left"
    >
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="display-num text-[10px] uppercase tracking-[0.22em] text-text-muted">
              {goal.tier} · {goal.difficulty}
            </p>
            <h3 className="mt-1 truncate text-[16px] font-semibold leading-tight text-text-primary">
              {goal.title}
            </h3>
          </div>
          <span
            className={[
              'display-num flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider',
              style.pillClass,
            ].join(' ')}
          >
            <PaceIcon size={10} strokeWidth={2.4} />
            {style.label}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="display-num text-[26px] font-bold leading-none tracking-display tabular-nums text-text-primary">
            <AnimatedNumber value={goal.currentValue} />
          </span>
          <span className="text-xs text-text-muted">
            / {formatGoalValue(goal.targetValue, goal.unit)} {goal.unit && goal.unit !== '$' ? goal.unit : ''}
          </span>
        </div>

        <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pace.progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            className={[
              'absolute inset-y-0 left-0 rounded-full shadow-glow',
              style.barClass,
            ].join(' ')}
          />
        </div>

        {milestones.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {milestones.map((m) => (
              <span
                key={m.id}
                className={[
                  'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider',
                  m.reached
                    ? 'border-reserved/40 bg-reserved/10 text-reserved'
                    : 'border-border-subtle text-text-muted',
                ].join(' ')}
                title={`${m.title} — ${formatGoalValue(m.targetValue, goal.unit)}`}
              >
                {m.reached ? '◆' : '◇'} {m.title}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
          {pace.daysRemaining !== undefined ? (
            <span className="flex items-center gap-1">
              <Clock size={10} strokeWidth={1.8} />
              {pace.daysRemaining === 0
                ? pace.band === 'completed'
                  ? 'Done'
                  : 'Due today'
                : `${pace.daysRemaining} day${pace.daysRemaining === 1 ? '' : 's'} left`}
            </span>
          ) : (
            <span>No deadline set</span>
          )}
          <span>
            {pace.recent7d > 0
              ? `+${formatGoalValue(pace.recent7d, goal.unit)} this week`
              : 'No recent moves'}
          </span>
        </div>
      </Card>
    </motion.button>
  );
}
