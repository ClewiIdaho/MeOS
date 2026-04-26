import { motion } from 'framer-motion';

/**
 * Top-right floating avatar / level badge.
 * In Phase 1 this is a static placeholder; future phases will render the user's
 * initial, current rank, and a tap-to-open profile sheet.
 */
export function AvatarBadge() {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      className="glass gradient-border relative flex items-center gap-2 rounded-pill px-2.5 py-1.5"
      aria-label="Open profile"
    >
      <span className="display-num text-[11px] uppercase tracking-[0.18em] text-text-secondary">
        Lv 1
      </span>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-grad text-[12px] font-semibold text-white shadow-glow">
        ·
      </span>
    </motion.button>
  );
}
