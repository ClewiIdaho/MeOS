import { Sparkles } from 'lucide-react';
import { PlaceholderScreen } from '@/ui/components/PlaceholderScreen';

export function CoachScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Coach"
      title="Notebook + Voice."
      subtitle="Your tips, lessons, and a lowkey-funny take from a local engine."
      Icon={Sparkles}
      capabilities={[
        'Notebook — write, tag, search your own lessons. Always works offline.',
        "The Voice — local personality engine reading your week's data.",
        'Three takes on tap: Recap, Push, Real Talk. Typing-effect delivery.',
        'Save quips you like to your Notebook with a Voice tag.',
        'Voice Studio in Settings lets you write your own quips into the pool.',
      ]}
      voiceTease="No cloud. No 'as a coach, I would suggest.' Just the data and one honest line."
    />
  );
}
