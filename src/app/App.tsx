import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Shell } from './Shell';
import { BootSplash } from './BootSplash';
import { Onboarding } from './Onboarding';
import { useDbReady } from '@/hooks/useDbReady';
import { useActionOrchestrator } from '@/hooks/useActionOrchestrator';
import { useGoalsEngine } from '@/hooks/useGoalsEngine';
import { useCelebrationFx } from '@/hooks/useCelebrationFx';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';
import { useHaptics } from '@/hooks/useHaptics';
import { useUserSettings } from '@/hooks/useUserSettings';
import { IosInstallHint } from '@/ui/components/IosInstallHint';
import { OfflineIndicator } from '@/ui/components/OfflineIndicator';

// Route-level code splitting. Each module becomes its own chunk so the cold-start
// bundle stays small. The service worker precaches every emitted chunk, so once
// the app is installed all routes load instantly from disk — online or offline.
const MoneyScreen = lazy(() =>
  import('@/modules/money/MoneyScreen').then((m) => ({ default: m.MoneyScreen })),
);
const ResponsibilitiesScreen = lazy(() =>
  import('@/modules/responsibilities/ResponsibilitiesScreen').then((m) => ({
    default: m.ResponsibilitiesScreen,
  })),
);
const WorkoutsScreen = lazy(() =>
  import('@/modules/workouts/WorkoutsScreen').then((m) => ({ default: m.WorkoutsScreen })),
);
const GoalsScreen = lazy(() =>
  import('@/modules/goals/GoalsScreen').then((m) => ({ default: m.GoalsScreen })),
);
const CoachScreen = lazy(() =>
  import('@/modules/coach/CoachScreen').then((m) => ({ default: m.CoachScreen })),
);
const SettingsScreen = lazy(() =>
  import('@/modules/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);

// Pulled into an array so the idle prefetcher can warm them all in one pass.
const ROUTE_PREFETCHERS: Array<() => Promise<unknown>> = [
  () => import('@/modules/money/MoneyScreen'),
  () => import('@/modules/responsibilities/ResponsibilitiesScreen'),
  () => import('@/modules/workouts/WorkoutsScreen'),
  () => import('@/modules/goals/GoalsScreen'),
  () => import('@/modules/coach/CoachScreen'),
  () => import('@/modules/settings/SettingsScreen'),
];

/**
 * Warm every route chunk during the browser's idle time after first paint.
 * Keeps initial TTI fast while ensuring tab-to-tab navigation feels instant
 * — and guarantees every chunk is in the SW cache before the user goes offline.
 */
function useIdleRoutePrefetch(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      for (const load of ROUTE_PREFETCHERS) {
        load().catch(() => undefined);
      }
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(run, { timeout: 4000 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const t = window.setTimeout(run, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [enabled]);
}

export function App() {
  const { ready, error } = useDbReady();
  const settings = useUserSettings();
  useActionOrchestrator();
  useGoalsEngine();
  useCelebrationFx();
  useHaptics();
  useNotificationScheduler();
  useIdleRoutePrefetch(ready);

  const showOnboarding = ready && settings && !settings.onboardingCompleted;

  return (
    <>
      <AnimatePresence mode="wait">
        {!ready && <BootSplash error={error?.message} key="splash" />}
      </AnimatePresence>

      {ready && (
        <Shell>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Navigate to="/tasks" replace />} />
              <Route path="/money" element={<MoneyScreen />} />
              <Route path="/tasks" element={<ResponsibilitiesScreen />} />
              <Route path="/workouts" element={<WorkoutsScreen />} />
              <Route path="/goals" element={<GoalsScreen />} />
              <Route path="/coach" element={<CoachScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="*" element={<Navigate to="/tasks" replace />} />
            </Routes>
          </Suspense>
        </Shell>
      )}

      <AnimatePresence>
        {showOnboarding ? <Onboarding key="onboarding" onComplete={() => undefined} /> : null}
      </AnimatePresence>

      {ready && !showOnboarding ? <IosInstallHint /> : null}
      {ready ? <OfflineIndicator /> : null}
    </>
  );
}
