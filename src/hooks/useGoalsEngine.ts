import { useEffect } from 'react';
import { startGoalsEngine } from '@/engine/goalsEngine';

/**
 * Mounts the goals engine for the lifetime of the component.
 * Goals subscribe to module events and write contributions; mount once at root.
 */
export function useGoalsEngine(): void {
  useEffect(() => {
    const teardown = startGoalsEngine();
    return () => {
      teardown();
    };
  }, []);
}
