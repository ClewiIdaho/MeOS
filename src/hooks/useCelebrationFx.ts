import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { eventBus } from '@/utils/events';

/**
 * Subscribes once to celebration events and fires confetti.
 *
 * Mounts at the App root so any goal completion / streak milestone /
 * PR / level-up will trigger the burst, regardless of which screen is
 * currently showing.
 *
 * Reserved-gold palette is used for goal completions and level-ups
 * (the "real" rewards). Streaks and PRs use the violet accent.
 */
export function useCelebrationFx(): void {
  useEffect(() => {
    const offs: Array<() => void> = [];

    offs.push(
      eventBus.on('goal:completed', () => {
        burst('reserved');
      }),
    );

    offs.push(
      eventBus.on('level:up', (e) => {
        burst('reserved', e.rankChanged ? { particleCount: 140, spread: 110 } : {});
      }),
    );

    offs.push(
      eventBus.on('streak:updated', (e) => {
        if (e.isMilestone) burst('accent');
      }),
    );

    offs.push(
      eventBus.on('pr:set', () => {
        burst('accent', { particleCount: 50, spread: 60 });
      }),
    );

    return () => {
      for (const off of offs) off();
    };
  }, []);
}

function burst(
  palette: 'accent' | 'reserved',
  overrides: confetti.Options = {},
): void {
  if (prefersReducedMotion()) return;
  const colors =
    palette === 'reserved'
      ? ['#FFD27F', '#F59E0B', '#FFB547', '#F4F1FF']
      : ['#8B5CF6', '#9C75F8', '#CCB6FF', '#F4F1FF'];
  const base: confetti.Options = {
    particleCount: 90,
    spread: 75,
    origin: { y: 0.7 },
    colors,
    ticks: 220,
  };
  confetti({ ...base, ...overrides });
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
