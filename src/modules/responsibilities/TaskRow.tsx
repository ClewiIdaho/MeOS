import { motion, useAnimation } from 'framer-motion';
import { Check, Pencil } from 'lucide-react';
import type { TaskWithStatus } from './queries';
import { completeTask, uncompleteTaskToday } from './queries';

interface TaskRowProps {
  item: TaskWithStatus;
  onEdit: () => void;
}

const cadenceLabel: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  'one-off': 'One-off',
};

export function TaskRow({ item, onEdit }: TaskRowProps) {
  const controls = useAnimation();
  const { task, category, done } = item;

  const toggle = async () => {
    if (done) {
      await uncompleteTaskToday(task.id!);
      return;
    }
    await controls.start({
      scale: [1, 1.04, 1],
      transition: { duration: 0.4, times: [0, 0.4, 1] },
    });
    await completeTask(task.id!);
  };

  return (
    <motion.div
      animate={controls}
      layout
      className={[
        'glass relative flex items-center gap-3 rounded-card border px-4 py-3 transition-colors',
        done ? 'border-success/30' : 'border-border-subtle',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={done ? 'Undo completion' : 'Mark complete'}
        className={[
          'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-all',
          done
            ? 'border-success bg-success/20 text-success'
            : 'border-border-subtle text-transparent hover:border-accent',
        ].join(' ')}
      >
        <motion.span
          initial={false}
          animate={{ scale: done ? 1 : 0, opacity: done ? 1 : 0 }}
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
            done ? 'text-text-muted line-through' : 'text-text-primary',
          ].join(' ')}
        >
          {task.title}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
          {category ? (
            <>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: category.color }}
                aria-hidden="true"
              />
              <span>{category.name}</span>
              <span className="text-border-subtle">•</span>
            </>
          ) : null}
          <span>{cadenceLabel[task.cadence]}</span>
        </span>
      </button>

      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit task"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:text-text-secondary"
      >
        <Pencil size={14} strokeWidth={1.8} />
      </button>
    </motion.div>
  );
}
