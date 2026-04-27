import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, X } from 'lucide-react';

const STORAGE_KEY = 'myos.ios-install-hint-dismissed';

/**
 * One-time install nudge for iOS Safari users who haven't installed yet.
 *
 * iOS doesn't offer the beforeinstallprompt event Chrome does, so we hand-roll
 * detection: look for an iOS UA, confirm we're not already in standalone mode,
 * and show a low-key bottom hint with the Share-button cue.
 *
 * Dismissal persists via localStorage so it never shows twice on the same
 * device, even if the user reopens the tab.
 */
export function IosInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) === '1') return;

    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    if (!isIos) return;

    type SafariNavigator = Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as SafariNavigator).standalone === true;
    if (isStandalone) return;

    const id = window.setTimeout(() => setShow(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="fixed inset-x-0 z-30 mx-auto flex max-w-md justify-center px-4"
          style={{ bottom: 'calc(max(var(--safe-bottom), 16px) + 76px)' }}
        >
          <div className="glass gradient-border shadow-card flex w-full items-start gap-3 rounded-card p-3">
            <span className="bg-accent-grad shadow-glow grid h-9 w-9 shrink-0 place-items-center rounded-xl">
              <Share size={16} strokeWidth={2} className="text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
                Install MY.OS
              </p>
              <p className="mt-1 text-[12px] leading-snug text-text-secondary">
                Tap <span className="text-text-primary">Share</span>, then{' '}
                <span className="text-text-primary">Add to Home Screen</span>. Runs offline.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-elevated text-text-muted hover:text-text-primary"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
