import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { useLevelUpListener } from '@/hooks/useLevelUpListener';

const AUTO_DISMISS_MS = 6000;
const TAPS_TO_DISMISS = 3;

/**
 * Reserved-gold full-screen takeover for level transitions.
 *
 * Mounts at the Shell root. Listens for `level:up` via useLevelUpListener
 * and renders the head of the queue. Three taps anywhere or 6 seconds
 * dismiss it; rank-changed overlays get a bigger treatment.
 *
 * Reduced motion: animation timings are zeroed and the number snaps.
 * Auto-dismiss still applies so the overlay doesn't get stuck.
 */
export function LevelUpOverlay() {
  const { current, dismiss } = useLevelUpListener();
  const reduceMotion = useReducedMotion();
  const tapsRef = useRef(0);
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (!current) return;
    tapsRef.current = 0;
    dismissedRef.current = false;
    const t = window.setTimeout(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        dismiss();
      }
    }, AUTO_DISMISS_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [current, dismiss]);

  const handleTap = () => {
    tapsRef.current += 1;
    if (tapsRef.current >= TAPS_TO_DISMISS && !dismissedRef.current) {
      dismissedRef.current = true;
      dismiss();
    }
  };

  return (
    <AnimatePresence>
      {current ? (
        <motion.div
          key={current.key}
          role="status"
          aria-live="assertive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
          onClick={handleTap}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
        >
          <div className="absolute inset-0 bg-base/95" aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 260, damping: 26 }
            }
            className="relative z-10 flex flex-col items-center gap-5 px-6 text-center"
          >
            <span className="display-num text-[11px] uppercase tracking-[0.32em] text-reserved/80">
              {current.rankChanged ? 'New rank' : 'Level up'}
            </span>

            <motion.div
              initial={reduceMotion ? false : { rotate: -8, scale: 0.85 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 220, damping: 18 }
              }
              className="bg-reserved-grad shadow-reserved-glow grid h-24 w-24 place-items-center rounded-3xl text-base"
            >
              <Sparkles size={36} strokeWidth={1.8} />
            </motion.div>

            <div className="flex flex-col items-center gap-2">
              <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-secondary">
                Level
              </p>
              <span
                className={[
                  'display-num font-bold leading-none tracking-display text-reserved text-glow-reserved',
                  current.rankChanged ? 'text-[120px]' : 'text-[88px]',
                ].join(' ')}
              >
                <AnimatedNumber
                  value={current.newLevel}
                  stiffness={140}
                  damping={22}
                  thousandsSep=""
                />
              </span>
              <p className="display-num mt-1 text-base font-semibold tracking-tight text-text-primary">
                {current.rankName}
              </p>
              {current.rankChanged ? (
                <p className="mt-1 text-sm text-text-secondary">
                  The band shifted. So did the floor.
                </p>
              ) : (
                <p className="mt-1 text-sm text-text-secondary">
                  Same person. More receipts.
                </p>
              )}
            </div>

            <p className="display-num mt-4 text-[10px] uppercase tracking-[0.32em] text-text-muted">
              Tap to dismiss
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
