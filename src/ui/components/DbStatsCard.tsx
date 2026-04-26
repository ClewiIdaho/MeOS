import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { Card } from './Card';
import { useDbStats } from '@/hooks/useDbStats';

/**
 * Surfaces live IndexedDB row counts during the early build phases so the user
 * can verify on-device that seeding and persistence work. Will be removed once
 * each module ships its own dashboard.
 */
export function DbStatsCard() {
  const stats = useDbStats();

  if (!stats) return null;

  const rows: Array<[string, number]> = [
    ['Bills', stats.bills],
    ['Incomes', stats.incomes],
    ['Tasks', stats.tasks],
    ['Categories', stats.taskCategories],
    ['Workouts', stats.workouts],
    ['Goals', stats.goals],
    ['Notes', stats.notebookEntries],
    ['XP', stats.xpTotal],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.2 }}
    >
      <Card className="p-5" elevated={false}>
        <div className="mb-3 flex items-center gap-2">
          <Database size={14} strokeWidth={1.8} className="text-text-muted" />
          <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
            Live data
          </p>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Persisting
          </span>
        </div>
        <div className="grid grid-cols-4 gap-x-3 gap-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col items-start">
              <span className="display-num text-lg font-bold leading-none tracking-display text-text-primary">
                {value}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
                {label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
