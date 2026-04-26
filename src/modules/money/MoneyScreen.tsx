import { Wallet } from 'lucide-react';
import { PlaceholderScreen } from '@/ui/components/PlaceholderScreen';

export function MoneyScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Money"
      title="Cash flow."
      subtitle="Income in. Bills out. Goal contributions tracked."
      Icon={Wallet}
      capabilities={[
        'Income — one-time and recurring (weekly, biweekly, monthly).',
        'Bills with due dates, auto-rolling each month, paid/upcoming/overdue states.',
        'Color-coded calendar plus next 7 / next 30 day summaries.',
        'Local notifications 2 days before each bill is due.',
        'Every paid bill feeds XP and any active money goals.',
      ]}
      voiceTease="Cash on hand is a number. So is your phone bill. Pick which one matters first."
    />
  );
}
