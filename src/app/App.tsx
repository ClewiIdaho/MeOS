import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Shell } from './Shell';
import { BootSplash } from './BootSplash';
import { MoneyScreen } from '@/modules/money/MoneyScreen';
import { ResponsibilitiesScreen } from '@/modules/responsibilities/ResponsibilitiesScreen';
import { WorkoutsScreen } from '@/modules/workouts/WorkoutsScreen';
import { GoalsScreen } from '@/modules/goals/GoalsScreen';
import { CoachScreen } from '@/modules/coach/CoachScreen';
import { useDbReady } from '@/hooks/useDbReady';
import { useActionOrchestrator } from '@/hooks/useActionOrchestrator';

export function App() {
  const { ready, error } = useDbReady();
  useActionOrchestrator();

  return (
    <>
      <AnimatePresence mode="wait">
        {!ready && <BootSplash error={error?.message} key="splash" />}
      </AnimatePresence>

      {ready && (
        <Shell>
          <Routes>
            <Route path="/" element={<Navigate to="/money" replace />} />
            <Route path="/money" element={<MoneyScreen />} />
            <Route path="/tasks" element={<ResponsibilitiesScreen />} />
            <Route path="/workouts" element={<WorkoutsScreen />} />
            <Route path="/goals" element={<GoalsScreen />} />
            <Route path="/coach" element={<CoachScreen />} />
            <Route path="*" element={<Navigate to="/money" replace />} />
          </Routes>
        </Shell>
      )}
    </>
  );
}
