import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Sparkles, Wallet } from 'lucide-react';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { Button } from '@/ui/components/Button';
import { EmptyState } from '@/ui/components/EmptyState';
import { LevelPulseCard } from '@/ui/components/LevelPulseCard';
import { GoalCard } from './GoalCard';
import { GoalSheet } from './GoalSheet';
import { ContributionSheet } from './ContributionSheet';
import { useGoalsByTier, type GoalWithMilestones } from './queries';
import type { Goal, GoalTier } from '@/db';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

const tierLabel: Record<GoalTier, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  backburner: 'Backburner',
};

const tierHint: Record<GoalTier, string> = {
  primary: 'Eyes here.',
  secondary: 'Still moving.',
  backburner: 'Not now, not gone.',
};

export function GoalsScreen() {
  const buckets = useGoalsByTier();
  const [goalSheet, setGoalSheet] = useState<{ open: boolean; goal?: Goal }>({ open: false });
  const [contribSheet, setContribSheet] = useState<{ open: boolean; goal?: Goal }>({ open: false });
  const [showCompleted, setShowCompleted] = useState(false);

  const totalActive =
    (buckets?.primary.length ?? 0) +
    (buckets?.secondary.length ?? 0) +
    (buckets?.backburner.length ?? 0);

  const openCard = (entry: GoalWithMilestones) => {
    const m = entry.goal.metric;
    const supportsManualContribution = m === 'cash_saved_to_goal' || m === 'custom';
    if (supportsManualContribution) {
      setContribSheet({ open: true, goal: entry.goal });
    } else {
      setGoalSheet({ open: true, goal: entry.goal });
    }
  };

  const editGoal = (entry: GoalWithMilestones) => {
    setGoalSheet({ open: true, goal: entry.goal });
  };

  return (
    <>
      <ScreenHeader
        eyebrow="Goals"
        title="The throughline."
        subtitle="Money, habits, performance — pick what matters and we'll pace it."
        right={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setGoalSheet({ open: true })}
            leadingIcon={<Plus size={14} strokeWidth={2.4} />}
          >
            New
          </Button>
        }
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        className="flex flex-col gap-5"
      >
        {totalActive === 0 && (buckets?.completed.length ?? 0) === 0 ? (
          <motion.div variants={fadeUp}>
            <EmptyState
              Icon={Target}
              title="No goals yet."
              description="A goal without a deadline is a wish. Pick one. We'll do the math."
              action={
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setGoalSheet({ open: true })}
                  leadingIcon={<Plus size={14} strokeWidth={2.4} />}
                >
                  Set your first goal
                </Button>
              }
            />
          </motion.div>
        ) : null}

        {(['primary', 'secondary', 'backburner'] as const).map((tier) => {
          const items = buckets?.[tier] ?? [];
          if (items.length === 0) return null;
          return (
            <motion.section key={tier} variants={fadeUp} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  {tierLabel[tier]} · {tierHint[tier]}
                </p>
                <span className="display-num text-[11px] uppercase tracking-wider text-text-muted">
                  {items.length}
                </span>
              </div>
              <AnimatePresence initial={false}>
                <div className="flex flex-col gap-2">
                  {items.map((entry) => (
                    <div key={entry.goal.id} className="relative">
                      <GoalCard entry={entry} onOpen={() => openCard(entry)} />
                      <button
                        type="button"
                        onClick={() => editGoal(entry)}
                        aria-label="Edit goal"
                        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-surface-elevated/80 text-text-muted transition-colors hover:text-text-secondary"
                      >
                        <Sparkles size={12} strokeWidth={1.8} />
                      </button>
                    </div>
                  ))}
                </div>
              </AnimatePresence>
            </motion.section>
          );
        })}

        {(buckets?.completed.length ?? 0) > 0 ? (
          <motion.section variants={fadeUp} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowCompleted((v) => !v)}
              className="flex items-center justify-between px-1 text-left"
            >
              <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
                Completed
              </p>
              <span className="display-num text-[11px] uppercase tracking-wider text-reserved">
                {buckets!.completed.length} · tap to {showCompleted ? 'hide' : 'show'}
              </span>
            </button>
            {showCompleted ? (
              <div className="flex flex-col gap-2">
                {buckets!.completed.map((entry) => (
                  <GoalCard
                    key={entry.goal.id}
                    entry={entry}
                    onOpen={() => editGoal(entry)}
                  />
                ))}
              </div>
            ) : null}
          </motion.section>
        ) : null}

        {totalActive > 0 ? (
          <motion.div variants={fadeUp}>
            <ManualContributionHintCard
              onPick={(g) => setContribSheet({ open: true, goal: g })}
              candidates={[
                ...(buckets?.primary ?? []),
                ...(buckets?.secondary ?? []),
                ...(buckets?.backburner ?? []),
              ]
                .filter(
                  (e) =>
                    e.goal.metric === 'cash_saved_to_goal' || e.goal.metric === 'custom',
                )
                .map((e) => e.goal)}
            />
          </motion.div>
        ) : null}

        <motion.div variants={fadeUp}>
          <LevelPulseCard />
        </motion.div>
      </motion.div>

      <GoalSheet
        open={goalSheet.open}
        onClose={() => setGoalSheet({ open: false })}
        {...(goalSheet.goal !== undefined ? { goal: goalSheet.goal } : {})}
      />
      <ContributionSheet
        open={contribSheet.open}
        onClose={() => setContribSheet({ open: false })}
        goal={contribSheet.goal}
      />
    </>
  );
}

interface ManualContributionHintCardProps {
  candidates: Goal[];
  onPick: (goal: Goal) => void;
}

function ManualContributionHintCard({ candidates, onPick }: ManualContributionHintCardProps) {
  if (candidates.length === 0) return null;
  return (
    <div className="glass gradient-border rounded-card p-4">
      <div className="flex items-center gap-2">
        <Wallet size={14} strokeWidth={2} className="text-accent" />
        <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
          Quick contribute
        </p>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        Manual contributions for sinking funds and custom goals.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {candidates.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onPick(g)}
            className="rounded-pill border border-border-subtle px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
          >
            + {g.title}
          </button>
        ))}
      </div>
    </div>
  );
}
