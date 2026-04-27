import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card } from './Card';
import { AnimatedNumber } from './AnimatedNumber';
import { useLevelProgress } from '@/hooks/useLevelProgress';
import { useStreakState } from '@/hooks/useStreakState';
import { streakMultiplier } from '@/utils/xp';

/**
 * Live level + XP + streak summary.
 * Shows current rank, level, XP toward next, and the active streak multiplier.
 * Progress bar fills with a spring whenever XP is awarded.
 */
export function LevelPulseCard() {
  const progress = useLevelProgress();
  const streak = useStreakState();

  if (!progress) return null;

  const multiplier = streakMultiplier(streak?.current ?? 0);
  const showMultiplier = multiplier > 1.0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} strokeWidth={1.8} className="text-accent" />
          <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
            {progress.rank}
          </p>
        </div>
        {showMultiplier ? (
          <span className="display-num rounded-full bg-reserved/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-reserved">
            ×{multiplier.toFixed(1)} streak
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="display-num text-[44px] font-bold leading-none tracking-display text-text-primary">
          <AnimatedNumber value={progress.level} />
        </span>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
            Lifetime XP
          </span>
          <span className="display-num text-base font-semibold text-text-secondary">
            <AnimatedNumber value={progress.totalXp} suffix=" XP" />
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, mass: 0.6 }}
            className="bg-accent-grad shadow-glow absolute inset-y-0 left-0 rounded-full"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="text-text-muted">
            {progress.isMaxLevel ? (
              'Ascendant — max level reached.'
            ) : (
              <>
                <AnimatedNumber value={progress.xpInCurrent} className="text-text-secondary" /> /{' '}
                <AnimatedNumber value={progress.xpSpan} className="text-text-secondary" /> XP this
                level
              </>
            )}
          </span>
          {!progress.isMaxLevel ? (
            <span className="text-text-muted">
              Lv {progress.level + 1} at{' '}
              <AnimatedNumber value={progress.xpForNext} className="text-text-secondary" />
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
