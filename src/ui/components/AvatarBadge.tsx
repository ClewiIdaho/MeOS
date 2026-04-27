import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useLevelProgress } from '@/hooks/useLevelProgress';
import { useStreakState } from '@/hooks/useStreakState';
import { useUserSettings } from '@/hooks/useUserSettings';
import { AnimatedNumber } from './AnimatedNumber';

/**
 * Top-right floating badge: current level + rank, streak flame, and an
 * initial-letter avatar. Numbers tween smoothly when XP is awarded.
 */
export function AvatarBadge() {
  const level = useLevelProgress();
  const streak = useStreakState();
  const settings = useUserSettings();
  const initial = (settings?.name || 'M').trim().charAt(0).toUpperCase() || 'M';

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      className="glass gradient-border relative flex items-center gap-2 rounded-pill py-1.5 pl-2.5 pr-1.5"
      aria-label="Open profile"
    >
      <span className="display-num text-[11px] uppercase tracking-[0.18em] text-text-secondary">
        Lv{' '}
        <AnimatedNumber
          value={level?.level ?? 1}
          className="text-text-primary"
        />
      </span>

      {streak && streak.current > 0 ? (
        <span className="flex items-center gap-0.5 text-[11px] text-reserved text-glow-reserved">
          <Flame size={12} strokeWidth={2.4} className="text-reserved" />
          <AnimatedNumber value={streak.current} className="display-num" />
        </span>
      ) : null}

      <span className="bg-accent-grad shadow-glow flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold text-white">
        {initial}
      </span>
    </motion.button>
  );
}
