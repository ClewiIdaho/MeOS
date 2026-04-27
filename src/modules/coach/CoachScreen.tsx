import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  BookmarkPlus,
} from 'lucide-react';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { EmptyState } from '@/ui/components/EmptyState';
import { TypingText } from '@/ui/components/TypingText';
import { NotebookSheet } from './NotebookSheet';
import { useNotebookEntries } from './queries';
import { useUserSettings } from '@/hooks/useUserSettings';
import { weekAnalyzer, recapToParams } from '@/voice/analyze';
import { pickQuip } from '@/voice/select';
import { speechSupported, speak, cancelSpeech } from '@/voice/speech';
import type { NotebookEntry } from '@/db';
import type { QuipCategory } from '@/voice/types';

const VOICE_BUTTONS: Array<{
  category: QuipCategory;
  label: string;
  hint: string;
  Icon: typeof Volume2;
}> = [
  { category: 'recap', label: 'Recap', hint: 'Read the week.', Icon: Sparkles },
  { category: 'push', label: 'Push', hint: 'Get moving.', Icon: Volume2 },
  { category: 'real_talk', label: 'Real Talk', hint: 'No sugar.', Icon: MessageCircle },
];

interface VoiceState {
  category: QuipCategory;
  text: string;
  /** Used as the React key so re-tapping the same button re-runs the typing effect. */
  key: number;
}

export function CoachScreen() {
  const settings = useUserSettings();
  const [search, setSearch] = useState('');
  const entries = useNotebookEntries(search);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<NotebookEntry | undefined>(undefined);
  const [voicePreset, setVoicePreset] = useState<{ body: string; category: string } | undefined>(
    undefined,
  );

  const [voice, setVoice] = useState<VoiceState | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const intensity = settings?.voiceIntensity ?? 'standard';
  const name = settings?.name?.trim() || undefined;
  const speakEnabled = settings?.soundEnabled ?? false;
  const ttsAvailable = speechSupported();

  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, []);

  const playVoice = (text: string) => {
    if (!ttsAvailable) return;
    setSpeaking(true);
    speak(text, {
      intensity,
      onEnd: () => setSpeaking(false),
    });
  };

  const stopVoice = () => {
    cancelSpeech();
    setSpeaking(false);
  };

  const runVoice = async (category: QuipCategory) => {
    if (running) return;
    setRunning(true);
    stopVoice();
    try {
      const recap = await weekAnalyzer();
      const params = recapToParams(name, recap);
      const result = await pickQuip(category, intensity, params);
      setVoice({ category, text: result.text, key: Date.now() });
      if (speakEnabled && ttsAvailable) {
        playVoice(result.text);
      }
    } finally {
      setRunning(false);
    }
  };

  const openCreate = () => {
    setEditing(undefined);
    setVoicePreset(undefined);
    setSheetOpen(true);
  };

  const openEdit = (entry: NotebookEntry) => {
    setEditing(entry);
    setVoicePreset(undefined);
    setSheetOpen(true);
  };

  const saveVoiceToNotebook = () => {
    if (!voice) return;
    setEditing(undefined);
    setVoicePreset({ body: voice.text, category: voice.category });
    setSheetOpen(true);
  };

  const totalEntries = entries?.length ?? 0;

  return (
    <>
      <ScreenHeader
        eyebrow="Coach"
        title="Voice + Notebook."
        subtitle="Three takes on demand. Lessons you write yourself."
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        className="flex flex-col gap-4"
      >
        <motion.div variants={fadeUp}>
          <VoiceCard
            running={running}
            voice={voice}
            speaking={speaking}
            ttsAvailable={ttsAvailable}
            onRun={runVoice}
            onPlay={() => voice && playVoice(voice.text)}
            onStop={stopVoice}
            onSave={saveVoiceToNotebook}
          />
        </motion.div>

        <motion.section variants={fadeUp} className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
              Notebook
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={openCreate}
              leadingIcon={<Plus size={14} strokeWidth={2.4} />}
            >
              New note
            </Button>
          </div>

          <Input
            placeholder="Search title, body, tags…"
            leading={<Search size={14} strokeWidth={2} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {totalEntries === 0 ? (
            <EmptyState
              Icon={BookOpen}
              title={search ? 'No matches.' : 'Notebook is empty.'}
              description={
                search
                  ? 'Try fewer words or a different tag.'
                  : 'Save lessons, tactics, and observations. Tag them so future-you can find them.'
              }
              action={
                search ? null : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={openCreate}
                    leadingIcon={<Plus size={14} strokeWidth={2.4} />}
                  >
                    Write your first note
                  </Button>
                )
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {entries!.map((entry) => (
                <NotebookRow key={entry.id} entry={entry} onClick={() => openEdit(entry)} />
              ))}
            </div>
          )}
        </motion.section>
      </motion.div>

      <NotebookSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setVoicePreset(undefined);
        }}
        {...(editing ? { entry: editing } : {})}
        {...(voicePreset
          ? {
              presetBody: voicePreset.body,
              presetTitle: 'From the Voice',
              voiceCategory: voicePreset.category,
            }
          : {})}
      />
    </>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

interface VoiceCardProps {
  running: boolean;
  voice: VoiceState | undefined;
  speaking: boolean;
  ttsAvailable: boolean;
  onRun: (category: QuipCategory) => void;
  onPlay: () => void;
  onStop: () => void;
  onSave: () => void;
}

function VoiceCard({
  running,
  voice,
  speaking,
  ttsAvailable,
  onRun,
  onPlay,
  onStop,
  onSave,
}: VoiceCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
          The Voice
        </p>
        <span className="display-num text-[10px] uppercase tracking-[0.22em] text-text-muted">
          local · no cloud
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {VOICE_BUTTONS.map(({ category, label, hint, Icon }) => (
          <button
            key={category}
            type="button"
            disabled={running}
            onClick={() => onRun(category)}
            className="glass gradient-border flex flex-col items-center gap-1.5 rounded-card px-3 py-3 text-center transition-colors hover:border-accent/60 disabled:opacity-60"
          >
            <Icon size={16} strokeWidth={1.8} className="text-accent-300" />
            <span className="display-num text-sm font-semibold text-text-primary">{label}</span>
            <span className="text-[11px] text-text-muted">{hint}</span>
          </button>
        ))}
      </div>

      <VoicePanel
        voice={voice}
        speaking={speaking}
        ttsAvailable={ttsAvailable}
        onPlay={onPlay}
        onStop={onStop}
        onSave={onSave}
      />
    </Card>
  );
}

interface VoicePanelProps {
  voice: VoiceState | undefined;
  speaking: boolean;
  ttsAvailable: boolean;
  onPlay: () => void;
  onStop: () => void;
  onSave: () => void;
}

function VoicePanel({ voice, speaking, ttsAvailable, onPlay, onStop, onSave }: VoicePanelProps) {
  if (!voice) {
    return (
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">
        Tap a button above. The Voice reads your week and gives one honest line.
      </p>
    );
  }
  return (
    <motion.div
      key={voice.key}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="mt-4 flex flex-col gap-3"
    >
      <p className="display-num text-[10px] uppercase tracking-[0.22em] text-text-muted">
        {humanCategory(voice.category)}
      </p>
      <p className="display-num text-base leading-relaxed text-text-primary">
        <TypingText key={voice.key} text={voice.text} charsPerSecond={32} />
      </p>
      <div className="flex items-center justify-end gap-2">
        {ttsAvailable ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={speaking ? onStop : onPlay}
            leadingIcon={
              speaking ? (
                <VolumeX size={14} strokeWidth={2} />
              ) : (
                <Volume2 size={14} strokeWidth={2} />
              )
            }
            aria-label={speaking ? 'Stop speaking' : 'Speak the line aloud'}
          >
            {speaking ? 'Stop' : 'Hear it'}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          leadingIcon={<BookmarkPlus size={14} strokeWidth={2} />}
        >
          Save to notebook
        </Button>
      </div>
    </motion.div>
  );
}

function humanCategory(c: QuipCategory): string {
  switch (c) {
    case 'recap':
      return 'Recap';
    case 'push':
      return 'Push';
    case 'real_talk':
      return 'Real talk';
    default:
      return c;
  }
}

function NotebookRow({
  entry,
  onClick,
}: {
  entry: NotebookEntry;
  onClick: () => void;
}) {
  const preview = useMemo(() => {
    const oneLine = entry.body.split(/\n+/)[0] ?? '';
    return oneLine.length > 140 ? `${oneLine.slice(0, 140)}…` : oneLine;
  }, [entry.body]);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="glass gradient-border flex flex-col gap-1.5 rounded-card p-4 text-left transition-colors hover:border-accent/60"
    >
      <div className="flex items-center gap-2">
        {entry.fromVoice ? (
          <span className="bg-accent-grad rounded-pill px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
            Voice
          </span>
        ) : null}
        <p className="display-num truncate text-sm font-semibold text-text-primary">
          {entry.title}
        </p>
      </div>
      {preview ? <p className="line-clamp-2 text-[13px] leading-snug text-text-secondary">{preview}</p> : null}
      {entry.tags.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="display-num rounded-pill border border-border-subtle px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </motion.button>
  );
}
