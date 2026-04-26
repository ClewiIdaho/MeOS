import { Dumbbell } from 'lucide-react';
import { PlaceholderScreen } from '@/ui/components/PlaceholderScreen';

export function WorkoutsScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Workouts"
      title="Move it."
      subtitle="Lift, cardio, mobility. PRs auto-detected. Volume charted."
      Icon={Dumbbell}
      capabilities={[
        'Three log types: Lift (sets/reps/weight), Cardio, Mobility.',
        'Personal records auto-detected per exercise with a chronological PR feed.',
        'Animated weekly volume chart so progress is visible, not implied.',
        'Optional reminders on the days you actually train.',
        'Rest day toggle — counts as showing up, not skipping.',
      ]}
      voiceTease="Cardio counts. Mobility counts. Even the rest day. Lying on the couch and calling it 'recovery' does not."
    />
  );
}
