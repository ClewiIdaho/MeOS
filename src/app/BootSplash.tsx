import { motion } from 'framer-motion';

interface BootSplashProps {
  /** Optional error message — shown when DB init fails. */
  error?: string;
}

/**
 * BootSplash — visible only during the brief window between mount and first DB read.
 * On modern devices this resolves in well under 100ms; the splash is here so a slow
 * cold start (or a corrupted IDB) never shows a blank black screen.
 */
export function BootSplash({ error }: BootSplashProps) {
  return (
    <div className="bg-app fixed inset-0 z-50 flex flex-col items-center justify-center">
      <div className="noise-overlay" aria-hidden="true" />
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        className="relative z-10 flex flex-col items-center gap-5"
      >
        <motion.div
          animate={
            error
              ? { rotate: 0 }
              : { rotate: 360 }
          }
          transition={
            error
              ? { duration: 0 }
              : { repeat: Infinity, duration: 2.4, ease: 'linear' }
          }
          className="bg-accent-grad shadow-glow-lg flex h-16 w-16 items-center justify-center rounded-2xl"
        >
          <span className="display-num text-xl font-bold text-white">M</span>
        </motion.div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="display-num text-[11px] uppercase tracking-[0.32em] text-text-muted">
            MY.OS
          </p>
          <p className="text-sm text-text-secondary">
            {error ? 'Database error' : 'Booting…'}
          </p>
          {error ? (
            <p className="mt-2 max-w-xs text-center text-xs text-danger">{error}</p>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
