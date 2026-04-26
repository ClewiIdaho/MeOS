import { ListChecks } from 'lucide-react';
import { PlaceholderScreen } from '@/ui/components/PlaceholderScreen';

export function ResponsibilitiesScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Tasks"
      title="Run the day."
      subtitle="Daily, weekly, one-off. Streaks. Categories. Swipe to clear."
      Icon={ListChecks}
      capabilities={[
        'Daily, weekly, and one-off tasks with custom categories.',
        'Streak tracking with current and longest run, plus warning before a break.',
        'Drag to reorder, swipe right to complete, satisfying haptic-style motion.',
        'Optional daily reminder at a time you pick.',
        'Every completion fires XP and pushes any linked goals forward.',
      ]}
      voiceTease="Three things. Not seventeen. Three things, then we talk."
    />
  );
}
