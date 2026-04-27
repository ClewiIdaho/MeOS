import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  Download,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { Input, Segmented } from '@/ui/components/Input';
import { EmptyState } from '@/ui/components/EmptyState';
import { useUserSettings, updateUserSettings } from '@/hooks/useUserSettings';
import {
  exportBackup,
  downloadBackup,
  importBackup,
  resetApp,
  BackupVersionError,
} from './backup';
import {
  requestNotificationPermission,
  notificationsAvailable,
} from '@/notifications/scheduler';
import { VoiceStudioSheet } from './VoiceStudioSheet';
import { useCustomQuips, updateCustomQuip } from './voiceQuipQueries';
import type {
  CustomQuip,
  DistanceUnit,
  VoiceIntensity,
  WeightUnit,
} from '@/db';
import type { QuipCategory } from '@/voice/types';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SettingsScreen() {
  const navigate = useNavigate();
  const settings = useUserSettings();
  const customQuips = useCustomQuips();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [editingQuip, setEditingQuip] = useState<CustomQuip | undefined>(undefined);

  if (!settings) return null;

  const patch = updateUserSettings;
  const cats = settings.notificationCategories;

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const result = await requestNotificationPermission();
      if (result !== 'granted') {
        alert(
          'The browser denied notification permission. You can enable it from the page info menu.',
        );
        await patch({ notificationsEnabled: false });
        return;
      }
    }
    await patch({ notificationsEnabled: enabled });
  };

  const toggleCategory = async (key: keyof typeof cats, value: boolean) => {
    await patch({ notificationCategories: { ...cats, [key]: value } });
  };

  const toggleWorkoutDay = async (dow: number) => {
    const current = settings.workoutReminderDays ?? [];
    const next = current.includes(dow)
      ? current.filter((d) => d !== dow)
      : [...current, dow].sort((a, b) => a - b);
    await patch({ workoutReminderDays: next });
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      downloadBackup(await exportBackup());
    } finally {
      setBusy(false);
    }
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleImportFile = async (file: File) => {
    setBusy(true);
    try {
      const json = await file.text();
      await importBackup(json);
      alert('Restore complete. The app will reload.');
      window.location.reload();
    } catch (err) {
      if (err instanceof BackupVersionError) {
        alert(err.message);
      } else {
        alert('That file does not look like a MY.OS backup.');
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        'This wipes everything — bills, tasks, workouts, goals, XP, settings — and starts fresh. Sure?',
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await resetApp();
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  const openCreateQuip = () => {
    setEditingQuip(undefined);
    setStudioOpen(true);
  };

  const openEditQuip = (quip: CustomQuip) => {
    setEditingQuip(quip);
    setStudioOpen(true);
  };

  const toggleQuipEnabled = async (quip: CustomQuip) => {
    if (quip.id === undefined) return;
    await updateCustomQuip(quip.id, { enabled: !quip.enabled });
  };

  return (
    <>
      <ScreenHeader
        eyebrow="Settings"
        title="Tune the system."
        subtitle="Profile, voice, notifications, backups."
        right={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leadingIcon={<ArrowLeft size={14} strokeWidth={2.4} />}
          >
            Back
          </Button>
        }
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        className="flex flex-col gap-4"
      >
        <motion.div variants={fadeUp}>
          <Card className="flex flex-col gap-4 p-5">
            <SectionLabel label="Profile" />
            <Input
              label="Name"
              value={settings.name}
              onChange={(e) => void patch({ name: e.target.value })}
              maxLength={24}
            />
            <Input
              label="Daily XP goal"
              type="number"
              value={settings.dailyXpGoal}
              min={10}
              max={1000}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n > 0) void patch({ dailyXpGoal: Math.round(n) });
              }}
            />
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="flex flex-col gap-4 p-5">
            <SectionLabel label="Voice" />
            <Segmented<VoiceIntensity>
              label="Intensity"
              value={settings.voiceIntensity}
              options={[
                { value: 'mellow', label: 'Mellow' },
                { value: 'standard', label: 'Standard' },
                { value: 'spicy', label: 'Spicy' },
              ]}
              onChange={(v) => void patch({ voiceIntensity: v })}
              hint="Affects which lines the Voice picks. You can override per-quip in the Studio."
            />
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="flex flex-col gap-4 p-5">
            <SectionLabel label="Units" />
            <Segmented<WeightUnit>
              label="Weight"
              value={settings.weightUnit}
              options={[
                { value: 'lb', label: 'lb' },
                { value: 'kg', label: 'kg' },
              ]}
              onChange={(v) => void patch({ weightUnit: v })}
            />
            <Segmented<DistanceUnit>
              label="Distance"
              value={settings.distanceUnit}
              options={[
                { value: 'mi', label: 'mi' },
                { value: 'km', label: 'km' },
              ]}
              onChange={(v) => void patch({ distanceUnit: v })}
            />
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <SectionLabel label="Notifications" />
              <Toggle
                checked={settings.notificationsEnabled}
                onChange={toggleNotifications}
                disabled={!notificationsAvailable()}
              />
            </div>

            {!notificationsAvailable() ? (
              <p className="text-[12px] text-text-muted">
                This browser doesn't support local notifications.
              </p>
            ) : null}

            <Input
              label="Daily task reminder"
              type="time"
              value={settings.dailyTaskReminderTime ?? ''}
              onChange={(e) =>
                void patch({ dailyTaskReminderTime: e.target.value || undefined })
              }
              leading={<Bell size={14} strokeWidth={2} />}
            />

            <Input
              label="Workout reminder time"
              type="time"
              value={settings.workoutReminderTime ?? ''}
              onChange={(e) =>
                void patch({ workoutReminderTime: e.target.value || undefined })
              }
            />

            <div className="flex flex-col gap-1.5">
              <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
                Workout days
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DOW_LABELS.map((label, dow) => {
                  const active = settings.workoutReminderDays?.includes(dow) ?? false;
                  return (
                    <button
                      key={dow}
                      type="button"
                      onClick={() => void toggleWorkoutDay(dow)}
                      className={[
                        'rounded-pill border px-3 py-1.5 text-xs transition-colors',
                        active
                          ? 'border-accent bg-accent/15 text-text-primary shadow-glow'
                          : 'border-border-subtle text-text-secondary',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
                Categories
              </span>
              <NotificationCheck
                label="Bills due (2 days ahead)"
                checked={cats.bills}
                onChange={(v) => void toggleCategory('bills', v)}
              />
              <NotificationCheck
                label="Daily task reminder"
                checked={cats.dailyTasks}
                onChange={(v) => void toggleCategory('dailyTasks', v)}
              />
              <NotificationCheck
                label="Workout reminder"
                checked={cats.workouts}
                onChange={(v) => void toggleCategory('workouts', v)}
              />
              <NotificationCheck
                label="Streak about to break"
                checked={cats.streaks}
                onChange={(v) => void toggleCategory('streaks', v)}
              />
              <NotificationCheck
                label="Goal pace"
                checked={cats.goalPace}
                onChange={(v) => void toggleCategory('goalPace', v)}
              />
              <NotificationCheck
                label="Weekly recap (Sunday)"
                checked={cats.weeklyRecap}
                onChange={(v) => void toggleCategory('weeklyRecap', v)}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <SectionLabel label="Voice Studio" />
              <Button
                variant="primary"
                size="sm"
                onClick={openCreateQuip}
                leadingIcon={<Plus size={14} strokeWidth={2.4} />}
              >
                Write quip
              </Button>
            </div>
            <p className="text-[12px] leading-snug text-text-muted">
              Custom lines join the built-in pool. Tokens like{' '}
              <code className="font-mono text-[11px] text-text-secondary">
                {'{streak}'}
              </code>{' '}
              substitute at render.
            </p>
            {customQuips && customQuips.length > 0 ? (
              <div className="flex flex-col gap-2">
                {customQuips.map((q) => (
                  <CustomQuipRow
                    key={q.id}
                    quip={q}
                    onClick={() => openEditQuip(q)}
                    onToggle={() => void toggleQuipEnabled(q)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                Icon={Sparkles}
                title="No custom quips yet."
                description="Write a line in your own voice. It joins the rotation."
              />
            )}
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="flex flex-col gap-3 p-5">
            <SectionLabel label="Backup" />
            <p className="text-[12px] leading-snug text-text-muted">
              Export everything to a JSON file. Restore replaces the local database.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleExport}
                disabled={busy}
                leadingIcon={<Download size={14} strokeWidth={2} />}
              >
                Export
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleImportClick}
                disabled={busy}
                leadingIcon={<Upload size={14} strokeWidth={2} />}
              >
                Restore
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImportFile(f);
                }}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="flex flex-col gap-3 p-5">
            <SectionLabel label="Reset" />
            <p className="text-[12px] leading-snug text-text-muted">
              Wipes everything and re-runs onboarding. Cannot be undone.
            </p>
            <Button
              variant="danger"
              size="md"
              onClick={handleReset}
              disabled={busy}
              leadingIcon={<RotateCcw size={14} strokeWidth={2} />}
            >
              Reset app
            </Button>
          </Card>
        </motion.div>
      </motion.div>

      <VoiceStudioSheet
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        {...(editingQuip ? { quip: editingQuip } : {})}
      />
    </>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
      {label}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative h-6 w-10 rounded-full transition-colors',
        checked ? 'bg-accent shadow-glow' : 'bg-surface-elevated',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      <motion.span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      />
    </button>
  );
}

function NotificationCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-card border border-border-subtle px-4 py-2.5">
      <span className="text-sm text-text-primary">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function CustomQuipRow({
  quip,
  onClick,
  onToggle,
}: {
  quip: CustomQuip;
  onClick: () => void;
  onToggle: () => void;
}) {
  const cat = quip.category as QuipCategory;
  return (
    <div className="glass gradient-border flex items-start gap-3 rounded-card p-3">
      <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
        <p className="display-num text-[10px] uppercase tracking-[0.22em] text-text-muted">
          {cat}
        </p>
        <p
          className={[
            'mt-1 text-[13px] leading-snug',
            quip.enabled ? 'text-text-primary' : 'text-text-muted line-through',
          ].join(' ')}
        >
          {quip.text}
        </p>
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        <Toggle checked={quip.enabled} onChange={onToggle} />
        <button
          type="button"
          onClick={onClick}
          className="grid h-8 w-8 place-items-center rounded-full bg-surface-elevated text-text-muted hover:text-text-primary"
          aria-label="Edit quip"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
