import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      className="glass gradient-border flex flex-col items-center gap-4 rounded-card px-6 py-10 text-center"
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-elevated">
        <Icon size={22} strokeWidth={1.6} className="text-text-muted" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="display-num text-base font-semibold text-text-primary">{title}</p>
        {description ? (
          <p className="text-sm leading-snug text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </motion.div>
  );
}
