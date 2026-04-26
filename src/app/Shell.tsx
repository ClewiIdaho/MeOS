import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from '@/ui/components/BottomNav';
import { AvatarBadge } from '@/ui/components/AvatarBadge';

interface ShellProps {
  children: ReactNode;
}

/**
 * Shell — the persistent app frame.
 * Hosts the noise overlay, the floating top-right avatar, the routed children,
 * and the floating bottom nav. Pages animate in via AnimatePresence.
 */
export function Shell({ children }: ShellProps) {
  const location = useLocation();

  return (
    <div className="bg-app relative min-h-[100dvh] w-full overflow-hidden">
      <div className="noise-overlay" aria-hidden="true" />

      <header
        className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-end px-4 pt-safe"
      >
        <div className="pointer-events-auto pt-3">
          <AvatarBadge />
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.6 }}
          className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-screen-sm flex-col px-4 pb-nav pt-safe"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
