import { Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './Shell';
import { MoneyScreen } from '@/modules/money/MoneyScreen';
import { ResponsibilitiesScreen } from '@/modules/responsibilities/ResponsibilitiesScreen';
import { WorkoutsScreen } from '@/modules/workouts/WorkoutsScreen';
import { GoalsScreen } from '@/modules/goals/GoalsScreen';
import { CoachScreen } from '@/modules/coach/CoachScreen';

export function App() {
  return (
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
  );
}
