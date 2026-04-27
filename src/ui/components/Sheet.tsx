import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** When true, the sheet fills the available height. Default false (auto height). */
  fullHeight?: boolean;
}

/**
 * Mobile-first bottom sheet. Backdrop blur, spring-driven entrance from below,
 * tap-out and Escape close. Locks body scroll while open.
 */
export function Sheet({ open, onClose, title, description, children, fullHeight }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-base/70 backdrop-blur-md"
            aria-hidden="true"
          />
          <motion.div
            key="sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.8 }}
            className={[
              'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-screen-sm flex-col',
              'rounded-t-sheet glass border-x border-t border-border-subtle',
              fullHeight ? 'h-[92dvh]' : 'max-h-[92dvh]',
            ].join(' ')}
            style={{ paddingBottom: 'max(var(--safe-bottom), 1rem)' }}
          >
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border-subtle" aria-hidden="true" />

            {(title || description) && (
              <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
                <div className="min-w-0">
                  {title ? (
                    <h2 className="display-num text-xl font-semibold tracking-display text-text-primary">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p className="mt-1 text-sm text-text-secondary">{description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-elevated text-text-secondary"
                  aria-label="Close"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 pb-4 pt-3">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
