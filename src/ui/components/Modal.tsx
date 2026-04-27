import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
}

/**
 * Centered popup dialog. Sits above the bottom nav so action buttons are
 * never obscured. Backdrop blur, tap-out and Escape close, body scroll lock.
 */
export function Modal({ open, onClose, title, description, children }: ModalProps) {
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
        <div className="fixed inset-0 z-50">
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-base/70 backdrop-blur-md"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 flex items-center justify-center overflow-y-auto px-4"
            style={{
              paddingTop: 'max(var(--safe-top), 1rem)',
              paddingBottom: 'max(var(--safe-bottom), 1rem)',
            }}
            onClick={onClose}
          >
            <motion.div
              key="modal-panel"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30, mass: 0.7 }}
              onClick={(e) => e.stopPropagation()}
              className="glass relative my-auto flex w-full max-w-sm flex-col overflow-hidden rounded-card border border-border-subtle shadow-nav"
              style={{ maxHeight: 'calc(100dvh - max(var(--safe-top), 1rem) - max(var(--safe-bottom), 1rem))' }}
            >
              {(title || description) && (
                <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
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

              <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">{children}</div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
