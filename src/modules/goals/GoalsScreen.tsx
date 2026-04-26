import { Target } from 'lucide-react';
import { PlaceholderScreen } from '@/ui/components/PlaceholderScreen';

export function GoalsScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Goals"
      title="The throughline."
      subtitle="Money, habits, performance, and custom — all tied to the rest of MY.OS."
      Icon={Target}
      capabilities={[
        'Four types: Money (auto), Habits (auto), Performance (auto), Custom (manual).',
        'Primary, Secondary, Backburner tiers — focus on what matters now.',
        'Difficulty tiers reward harder goals: Small, Medium, Legendary.',
        'Rolling 7-day pace math — strong recent weeks pull you back to On Track.',
        'Sub-milestones for big projects. Every contribution is logged with a quip.',
      ]}
      voiceTease="A goal without a deadline is a wish. Pick one. We'll do the math."
    />
  );
}
