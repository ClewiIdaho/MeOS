import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function ScreenHeader({ eyebrow, title, subtitle, right }: ScreenHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="mb-5 mt-2 flex items-end justify-between gap-3"
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="display-num mb-1.5 text-[11px] uppercase tracking-[0.22em] text-text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="display-num text-[34px] font-bold leading-[1.05] tracking-display text-text-primary">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm leading-snug text-text-secondary">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </motion.header>
  );
}
