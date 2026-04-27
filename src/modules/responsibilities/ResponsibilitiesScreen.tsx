import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, Plus, Flame } from 'lucide-react';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { EmptyState } from '@/ui/components/EmptyState';
import { LevelPulseCard } from '@/ui/components/LevelPulseCard';
import { TaskRow } from './TaskRow';
import { TaskSheet } from './TaskSheet';
import { useTodayTasks } from './queries';
import { useStreakState } from '@/hooks/useStreakState';
import type { Task } from '@/db';

export function ResponsibilitiesScreen() {
  const buckets = useTodayTasks();
  const streak = useStreakState();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>(undefined);

  const summary = useMemo(() => {
    if (!buckets) return null;
    const dailyDone = buckets.daily.filter((t) => t.done).length;
    const total = buckets.daily.length;
    return { dailyDone, total };
  }, [buckets]);

  const openCreate = () => {
    setEditing(undefined);
    setSheetOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setSheetOpen(true);
  };

  const totalActive =
    (buckets?.daily.length ?? 0) + (buckets?.weekly.length ?? 0) + (buckets?.oneoff.length ?? 0);

  return (
    <>
      <ScreenHeader
        eyebrow="Tasks"
        title="Run the day."
        subtitle="Daily, weekly, one-off — whatever's actually on the plate."
        right={
          <Button
            variant="primary"
            size="sm"
            onClick={openCreate}
            leadingIcon={<Plus size={14} strokeWidth={2.4} />}
          >
            New
          </Button>
        }
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
        className="flex flex-col gap-4"
      >
        <motion.div variants={fadeUp}>
          <StreakCard
            current={streak?.current ?? 0}
            longest={streak?.longest ?? 0}
            dailyDone={summary?.dailyDone ?? 0}
            dailyTotal={summary?.total ?? 0}
          />
        </motion.div>

        {totalActive === 0 ? (
          <motion.div variants={fadeUp}>
            <EmptyState
              Icon={ListChecks}
              title="No tasks yet."
              description="Add one daily task. Just one. Make the bed. Drink water. Anything."
              action={
                <Button
                  variant="primary"
                  size="md"
                  onClick={openCreate}
                  leadingIcon={<Plus size={14} strokeWidth={2.4} />}
                >
                  Add your first task
                </Button>
              }
            />
          </motion.div>
        ) : (
          <>
            {buckets && buckets.daily.length > 0 ? (
              <motion.section variants={fadeUp} className="flex flex-col gap-2">
                <SectionLabel
                  label="Today"
                  meta={`${summary?.dailyDone ?? 0} / ${summary?.total ?? 0}`}
                />
                <AnimatePresence initial={false}>
                  {buckets.daily.map((item) => (
                    <TaskRow
                      key={item.task.id}
                      item={item}
                      onEdit={() => openEdit(item.task)}
                    />
                  ))}
                </AnimatePresence>
              </motion.section>
            ) : null}

            {buckets && buckets.weekly.length > 0 ? (
              <motion.section variants={fadeUp} className="flex flex-col gap-2">
                <SectionLabel
                  label="This week"
                  meta={`${buckets.weekly.filter((t) => t.done).length} / ${buckets.weekly.length}`}
                />
                <AnimatePresence initial={false}>
                  {buckets.weekly.map((item) => (
                    <TaskRow
                      key={item.task.id}
                      item={item}
                      onEdit={() => openEdit(item.task)}
                    />
                  ))}
                </AnimatePresence>
              </motion.section>
            ) : null}

            {buckets && buckets.oneoff.length > 0 ? (
              <motion.section variants={fadeUp} className="flex flex-col gap-2">
                <SectionLabel label="One-off" meta={`${buckets.oneoff.length}`} />
                <AnimatePresence initial={false}>
                  {buckets.oneoff.map((item) => (
                    <TaskRow
                      key={item.task.id}
                      item={item}
                      onEdit={() => openEdit(item.task)}
                    />
                  ))}
                </AnimatePresence>
              </motion.section>
            ) : null}
          </>
        )}

        <motion.div variants={fadeUp}>
          <LevelPulseCard />
        </motion.div>
      </motion.div>

      <TaskSheet open={sheetOpen} onClose={() => setSheetOpen(false)} task={editing} />
    </>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

interface StreakCardProps {
  current: number;
  longest: number;
  dailyDone: number;
  dailyTotal: number;
}

function StreakCard({ current, longest, dailyDone, dailyTotal }: StreakCardProps) {
  const ratio = dailyTotal > 0 ? dailyDone / dailyTotal : 0;
  const allDone = dailyTotal > 0 && dailyDone === dailyTotal;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={14} strokeWidth={2} className="text-reserved" />
          <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
            Streak
          </p>
        </div>
        {longest > 0 ? (
          <span className="display-num text-[11px] uppercase tracking-wider text-text-muted">
            best {longest}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <span
          className={[
            'display-num text-[44px] font-bold leading-none tracking-display',
            current > 0 ? 'text-reserved text-glow-reserved' : 'text-text-primary',
          ].join(' ')}
        >
          {current}
        </span>
        <span className="text-sm text-text-secondary">
          {current === 1 ? 'day' : 'days'} in a row
        </span>
      </div>

      {dailyTotal > 0 ? (
        <>
          <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${ratio * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              className={[
                'absolute inset-y-0 left-0 rounded-full',
                allDone ? 'bg-reserved-grad shadow-reserved-glow' : 'bg-accent-grad shadow-glow',
              ].join(' ')}
            />
          </div>
          <p className="mt-2 text-[11px] text-text-muted">
            {allDone
              ? 'Daily list cleared. Day counts.'
              : `${dailyTotal - dailyDone} ${dailyTotal - dailyDone === 1 ? 'task' : 'tasks'} left to lock in today.`}
          </p>
        </>
      ) : (
        <p className="mt-3 text-[11px] text-text-muted">
          Add a daily task to start a streak.
        </p>
      )}
    </Card>
  );
}

function SectionLabel({ label, meta }: { label: string; meta?: string }) {
  return (
    <div className="flex items-center justify-between px-1">
      <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">{label}</p>
      {meta ? (
        <span className="display-num text-[11px] uppercase tracking-wider text-text-muted">{meta}</span>
      ) : null}
    </div>
  );
}
