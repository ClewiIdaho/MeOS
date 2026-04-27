import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Wallet, ListChecks, Dumbbell, Target } from 'lucide-react';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { Input, Segmented } from '@/ui/components/Input';
import { updateUserSettings } from '@/hooks/useUserSettings';
import type { VoiceIntensity } from '@/db';

interface OnboardingProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'name' | 'tone' | 'goal' | 'ready';

const STEPS: Step[] = ['welcome', 'name', 'tone', 'goal', 'ready'];

const toneOptions: Array<{ value: VoiceIntensity; label: string; sample: string }> = [
  { value: 'mellow', label: 'Mellow', sample: 'Take it easy. Just one task today is a win.' },
  { value: 'standard', label: 'Standard', sample: 'Three tasks. Then we talk. The plan is the plan.' },
  { value: 'spicy', label: 'Spicy', sample: 'You opened the app. Bold. Now do something useful.' },
];

const goalOptions: Array<{ value: number; label: string; description: string }> = [
  { value: 60, label: 'Easy', description: 'A daily task or two. Keep the streak alive.' },
  { value: 100, label: 'Standard', description: 'A few tasks, maybe a workout. Recommended.' },
  { value: 180, label: 'Hard', description: 'Most days log a workout, a bill, and tasks.' },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [tone, setTone] = useState<VoiceIntensity>('standard');
  const [goal, setGoal] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]!);
  const back = () => setStep(STEPS[Math.max(idx - 1, 0)]!);

  const finish = async () => {
    setSubmitting(true);
    try {
      await updateUserSettings({
        name: name.trim() || 'Me',
        voiceIntensity: tone,
        dailyXpGoal: goal,
        onboardingCompleted: true,
      });
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-app fixed inset-0 z-50 flex flex-col">
      <div className="noise-overlay" aria-hidden="true" />

      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(var(--safe-top),1.25rem)]">
        <div className="flex items-center gap-2">
          <span className="bg-accent-grad shadow-glow grid h-8 w-8 place-items-center rounded-lg">
            <span className="display-num text-sm font-bold text-white">M</span>
          </span>
          <span className="display-num text-[11px] uppercase tracking-[0.32em] text-text-muted">
            MY.OS
          </span>
        </div>
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={[
                'h-1.5 rounded-full transition-all duration-300',
                i <= idx ? 'w-6 bg-accent shadow-glow' : 'w-3 bg-border-subtle',
              ].join(' ')}
            />
          ))}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-screen-sm flex-1 flex-col px-5 pb-8 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="flex flex-1 flex-col gap-6"
          >
            {step === 'welcome' && <WelcomeStep />}
            {step === 'name' && <NameStep name={name} setName={setName} />}
            {step === 'tone' && <ToneStep tone={tone} setTone={setTone} />}
            {step === 'goal' && <GoalStep goal={goal} setGoal={setGoal} />}
            {step === 'ready' && <ReadyStep name={name} />}
          </motion.div>
        </AnimatePresence>

        <div className="mt-auto flex items-center gap-3 pt-6">
          {idx > 0 && step !== 'ready' ? (
            <Button variant="ghost" size="md" onClick={back}>
              Back
            </Button>
          ) : null}
          <div className="flex-1" />
          {step === 'ready' ? (
            <Button
              variant="primary"
              size="lg"
              onClick={finish}
              loading={submitting}
              trailingIcon={<ChevronRight size={18} strokeWidth={2.4} />}
            >
              Enter MY.OS
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={next}
              disabled={step === 'name' && !name.trim()}
              trailingIcon={<ChevronRight size={18} strokeWidth={2.4} />}
            >
              Continue
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function WelcomeStep() {
  const modules: Array<{ Icon: typeof Wallet; label: string }> = [
    { Icon: Wallet, label: 'Money' },
    { Icon: ListChecks, label: 'Tasks' },
    { Icon: Dumbbell, label: 'Workouts' },
    { Icon: Target, label: 'Goals' },
    { Icon: Sparkles, label: 'Coach' },
  ];

  return (
    <>
      <div>
        <p className="display-num text-[11px] uppercase tracking-[0.32em] text-text-muted">
          Welcome
        </p>
        <h1 className="display-num mt-2 text-[36px] font-bold leading-[1.05] tracking-display text-text-primary">
          One app.<br />The whole life.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Money in, bills out, tasks done, workouts logged, goals tracked — all
          connected through XP, levels, and a coach that knows what you actually
          did this week.
        </p>
      </div>

      <Card className="p-5">
        <p className="display-num mb-3 text-[11px] uppercase tracking-[0.22em] text-text-muted">
          Five modules. One throughline.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {modules.map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-elevated">
                <Icon size={16} strokeWidth={1.8} className="text-accent" />
              </span>
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                {label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
          On-device
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          No cloud, no telemetry, no sign-in. Your data lives in your browser.
          Works offline. Install it like an app.
        </p>
      </Card>
    </>
  );
}

function NameStep({ name, setName }: { name: string; setName: (s: string) => void }) {
  return (
    <>
      <div>
        <p className="display-num text-[11px] uppercase tracking-[0.32em] text-text-muted">
          Question one
        </p>
        <h1 className="display-num mt-2 text-[32px] font-bold leading-[1.1] tracking-display text-text-primary">
          What should we call you?
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          The Coach uses this. One word is plenty.
        </p>
      </div>

      <Input
        label="Your name"
        placeholder="e.g. Ricky"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        maxLength={24}
      />
    </>
  );
}

function ToneStep({
  tone,
  setTone,
}: {
  tone: VoiceIntensity;
  setTone: (t: VoiceIntensity) => void;
}) {
  const sample = toneOptions.find((o) => o.value === tone)!.sample;
  return (
    <>
      <div>
        <p className="display-num text-[11px] uppercase tracking-[0.32em] text-text-muted">
          Question two
        </p>
        <h1 className="display-num mt-2 text-[32px] font-bold leading-[1.1] tracking-display text-text-primary">
          How blunt should the Coach be?
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          You can change this anytime in Settings.
        </p>
      </div>

      <Segmented
        value={tone}
        options={toneOptions.map((o) => ({ value: o.value, label: o.label }))}
        onChange={setTone}
      />

      <Card className="p-5">
        <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
          Sample
        </p>
        <p className="mt-2 text-[15px] italic leading-relaxed text-text-primary">
          "{sample}"
        </p>
      </Card>
    </>
  );
}

function GoalStep({ goal, setGoal }: { goal: number; setGoal: (g: number) => void }) {
  return (
    <>
      <div>
        <p className="display-num text-[11px] uppercase tracking-[0.32em] text-text-muted">
          Question three
        </p>
        <h1 className="display-num mt-2 text-[32px] font-bold leading-[1.1] tracking-display text-text-primary">
          Pick a daily XP target.
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          XP comes from completing tasks, paying bills, training, and goals.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {goalOptions.map((opt) => {
          const active = opt.value === goal;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGoal(opt.value)}
              className={[
                'glass flex items-center gap-4 rounded-card border px-5 py-4 text-left transition-colors',
                active ? 'border-accent shadow-glow' : 'border-border-subtle',
              ].join(' ')}
            >
              <span
                className={[
                  'display-num text-2xl font-bold tracking-display',
                  active ? 'text-accent text-glow-accent' : 'text-text-primary',
                ].join(' ')}
              >
                {opt.value}
              </span>
              <div className="min-w-0">
                <p className="display-num text-sm font-semibold text-text-primary">{opt.label}</p>
                <p className="text-xs text-text-secondary">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function ReadyStep({ name }: { name: string }) {
  return (
    <>
      <div>
        <p className="display-num text-[11px] uppercase tracking-[0.32em] text-text-muted">
          Ready
        </p>
        <h1 className="display-num mt-2 text-[36px] font-bold leading-[1.05] tracking-display text-text-primary">
          Let's go, {name.trim() || 'friend'}.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          You start at <span className="text-accent">Level 1 — Apprentice</span>. The
          first action you log starts your streak. Pay a bill, finish a task, log a
          workout — anything counts.
        </p>
      </div>

      <Card className="p-5">
        <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
          The Voice
        </p>
        <p className="mt-2 text-[15px] italic leading-relaxed text-text-primary">
          "We don't do streaks for the streak. We do them so you stop wondering if today counts. It does."
        </p>
      </Card>
    </>
  );
}
