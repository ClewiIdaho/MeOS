import { AnimatePresence, motion } from 'framer-motion';
import { CloudOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Subtle pill that surfaces when the device drops offline.
 *
 * MY.OS is fully local — going offline never breaks anything — so this is a
 * gentle confirmation rather than a warning. It hides automatically when the
 * connection returns.
 */
export function OfflineIndicator() {
  const online = useOnlineStatus();

  return (
    <AnimatePresence>
      {!online ? (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
          style={{ top: 'calc(var(--safe-top) + 12px)' }}
        >
          <div className="glass shadow-card flex items-center gap-1.5 rounded-pill px-3 py-1.5">
            <CloudOff size={12} strokeWidth={2.2} className="text-text-secondary" />
            <span className="display-num text-[10px] uppercase tracking-[0.22em] text-text-secondary">
              Offline
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
