import { useEffect, useState } from 'react';
import { runSeeds, type SeedReport } from '@/db';

interface DbReadyState {
  ready: boolean;
  report?: SeedReport;
  error?: Error;
}

/**
 * Boots the database, runs seeds, and exposes readiness state.
 * Mount once at the app root.
 */
export function useDbReady(): DbReadyState {
  const [state, setState] = useState<DbReadyState>({ ready: false });

  useEffect(() => {
    let cancelled = false;
    runSeeds()
      .then((report) => {
        if (!cancelled) setState({ ready: true, report });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            ready: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
