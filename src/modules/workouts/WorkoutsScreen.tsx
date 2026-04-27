import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Dumbbell,
  Activity,
  Wind,
  Moon,
  Trophy,
  Trash2,
} from 'lucide-react';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { Segmented } from '@/ui/components/Input';
import { EmptyState } from '@/ui/components/EmptyState';
import { LevelPulseCard } from '@/ui/components/LevelPulseCard';
import { AnimatedNumber } from '@/ui/components/AnimatedNumber';
import { LiftSheet } from './LiftSheet';
import { CardioSheet } from './CardioSheet';
import { MobilitySheet } from './MobilitySheet';
import {
  useTodaysSessions,
  useRecentSessions,
  usePersonalRecords,
  useWeeklyVolume,
  logRestDay,
  deleteSession,
  type SessionSummary,
} from './queries';
import { useUserSettings } from '@/hooks/useUserSettings';
import type { WorkoutKind } from '@/db';

type Tab = WorkoutKind;

const TAB_OPTIONS: Array<{ value: Tab; label: string }> = [
  { value: 'lift', label: 'Lift' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'rest', label: 'Rest' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

export function WorkoutsScreen() {
  const [tab, setTab] = useState<Tab>('lift');
  const todays = useTodaysSessions();
  const recent = useRecentSessions(20);
  const prs = usePersonalRecords(6);
  const volume = useWeeklyVolume();
  const settings = useUserSettings();
  const unit = settings?.weightUnit ?? 'lb';

  const [liftSheet, setLiftSheet] = useState<{ open: boolean; sessionId?: number }>({ open: false });
  const [cardioSheetOpen, setCardioSheetOpen] = useState(false);
  const [mobilitySheetOpen, setMobilitySheetOpen] = useState(false);

  const todaysLift = todays?.find((s) => s.session.kind === 'lift');
  const todaysByKind = useMemo(() => {
    const map: Record<Tab, SessionSummary | undefined> = {
      lift: undefined,
      cardio: undefined,
      mobility: undefined,
      rest: undefined,
    };
    for (const s of todays ?? []) map[s.session.kind] = s;
    return map;
  }, [todays]);

  const recentForTab = (recent ?? []).filter((s) => s.session.kind === tab).slice(0, 6);

  const handleStart = async () => {
    if (tab === 'lift') {
      if (todaysLift?.session.id !== undefined) {
        setLiftSheet({ open: true, sessionId: todaysLift.session.id });
      } else {
        setLiftSheet({ open: true });
      }
      return;
    }
    if (tab === 'cardio') {
      setCardioSheetOpen(true);
      return;
    }
    if (tab === 'mobility') {
      setMobilitySheetOpen(true);
      return;
    }
    if (tab === 'rest') {
      await logRestDay();
    }
  };

  const startLabel: Record<Tab, string> = {
    lift: todaysLift ? 'Continue lift' : 'Start lift',
    cardio: 'Log cardio',
    mobility: 'Log mobility',
    rest: todaysByKind.rest ? 'Rest day logged' : 'Log rest day',
  };

  const headerCtaKind = tab === 'rest' ? 'rest' : tab;

  return (
    <>
      <ScreenHeader
        eyebrow="Workouts"
        title="Move it."
        subtitle="Lift, cardio, mobility — even rest. PRs flag automatically."
        right={
          <Button
            variant="primary"
            size="sm"
            onClick={handleStart}
            disabled={tab === 'rest' && Boolean(todaysByKind.rest)}
            leadingIcon={
              headerCtaKind === 'lift' ? (
                <Dumbbell size={14} strokeWidth={2.4} />
              ) : headerCtaKind === 'cardio' ? (
                <Activity size={14} strokeWidth={2.4} />
              ) : headerCtaKind === 'mobility' ? (
                <Wind size={14} strokeWidth={2.4} />
              ) : (
                <Moon size={14} strokeWidth={2.4} />
              )
            }
          >
            {tab === 'lift' && !todaysLift ? 'Lift' : tab === 'rest' && todaysByKind.rest ? 'Done' : 'Log'}
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
          <TodayOverviewCard todays={todays} />
        </motion.div>

        <motion.div variants={fadeUp}>
          <Segmented<Tab>
            value={tab}
            options={TAB_OPTIONS}
            onChange={setTab}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <Button
            variant={todaysByKind[tab] && tab !== 'lift' ? 'secondary' : 'primary'}
            size="lg"
            fullWidth
            onClick={handleStart}
            disabled={tab === 'rest' && Boolean(todaysByKind.rest)}
          >
            {startLabel[tab]}
          </Button>
        </motion.div>

        <motion.div variants={fadeUp}>
          <VolumeChartCard tab={tab} volume={volume} unit={unit} />
        </motion.div>

        {tab === 'lift' ? (
          <motion.div variants={fadeUp}>
            <PrFeedCard prs={prs ?? []} unit={unit} />
          </motion.div>
        ) : null}

        <motion.div variants={fadeUp} className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
              Recent {tab}
            </p>
          </div>
          {recentForTab.length === 0 ? (
            <EmptyState
              Icon={
                tab === 'lift'
                  ? Dumbbell
                  : tab === 'cardio'
                    ? Activity
                    : tab === 'mobility'
                      ? Wind
                      : Moon
              }
              title={`No ${tab} sessions yet.`}
              description={
                tab === 'lift'
                  ? 'Start one above. PRs auto-flag from the first set.'
                  : tab === 'rest'
                    ? "Log today's rest day to keep the streak alive."
                    : 'Log one session to get the chart populating.'
              }
            />
          ) : (
            recentForTab.map((s) => (
              <SessionRow
                key={s.session.id}
                summary={s}
                onOpen={() => {
                  if (s.session.kind === 'lift' && s.session.id !== undefined) {
                    setLiftSheet({ open: true, sessionId: s.session.id });
                  }
                }}
              />
            ))
          )}
        </motion.div>

        <motion.div variants={fadeUp}>
          <LevelPulseCard />
        </motion.div>
      </motion.div>

      <LiftSheet
        open={liftSheet.open}
        onClose={() => setLiftSheet({ open: false })}
        {...(liftSheet.sessionId !== undefined ? { sessionId: liftSheet.sessionId } : {})}
      />
      <CardioSheet open={cardioSheetOpen} onClose={() => setCardioSheetOpen(false)} />
      <MobilitySheet open={mobilitySheetOpen} onClose={() => setMobilitySheetOpen(false)} />
    </>
  );
}

interface TodayOverviewCardProps {
  todays: SessionSummary[] | undefined;
}

function TodayOverviewCard({ todays }: TodayOverviewCardProps) {
  const kinds = new Set((todays ?? []).map((s) => s.session.kind));
  const items: Array<{ kind: WorkoutKind; label: string }> = [
    { kind: 'lift', label: 'Lift' },
    { kind: 'cardio', label: 'Cardio' },
    { kind: 'mobility', label: 'Mobility' },
    { kind: 'rest', label: 'Rest' },
  ];
  const total = todays?.length ?? 0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} strokeWidth={2} className="text-accent" />
          <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
            Today
          </p>
        </div>
        <span className="display-num text-[11px] uppercase tracking-wider text-text-muted">
          {total === 0 ? 'nothing logged' : `${total} session${total === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {items.map(({ kind, label }) => {
          const done = kinds.has(kind);
          return (
            <div
              key={kind}
              className={[
                'flex flex-1 flex-col items-center gap-1 rounded-card border px-2 py-2.5',
                done
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-border-subtle bg-surface/50 text-text-muted',
              ].join(' ')}
            >
              <span
                className={[
                  'display-num text-[10px] uppercase tracking-wider',
                  done ? 'text-success' : 'text-text-muted',
                ].join(' ')}
              >
                {label}
              </span>
              <span className="display-num text-base font-semibold">
                {done ? '✓' : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

interface VolumeChartCardProps {
  tab: Tab;
  volume: ReturnType<typeof useWeeklyVolume>;
  unit: 'lb' | 'kg';
}

function VolumeChartCard({ tab, volume }: VolumeChartCardProps) {
  const data = (volume ?? []).map((d) => ({
    day: d.dayLabel,
    value:
      tab === 'lift'
        ? d.liftSets
        : tab === 'cardio'
          ? d.cardioMinutes
          : tab === 'mobility'
            ? d.mobilityMinutes
            : 0,
  }));
  const total = data.reduce((s, d) => s + d.value, 0);
  const metricLabel =
    tab === 'lift' ? 'sets' : tab === 'cardio' || tab === 'mobility' ? 'min' : 'days';

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
          Weekly volume
        </p>
        <span className="display-num text-[11px] uppercase tracking-wider text-text-muted">
          {tab}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="display-num text-[34px] font-bold leading-none tracking-display tabular-nums text-text-primary">
          <AnimatedNumber value={total} />
        </span>
        <span className="text-xs text-text-muted">{metricLabel} · 7d</span>
      </div>

      <div className="mt-4 h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#6B6890' }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'rgba(139, 92, 246, 0.08)' }}
              contentStyle={{
                background: '#1C1A38',
                border: '1px solid rgba(42, 39, 80, 0.6)',
                borderRadius: 12,
                fontSize: 12,
                color: '#F4F1FF',
              }}
              labelStyle={{ color: '#A8A3CC' }}
              formatter={(v: number) => [`${v} ${metricLabel}`, '']}
            />
            <Bar dataKey="value" radius={[6, 6, 2, 2]} maxBarSize={28}>
              {data.map((d, idx) => (
                <Cell
                  key={idx}
                  fill={d.value > 0 ? '#8B5CF6' : '#1C1A38'}
                  stroke={d.value > 0 ? '#9C75F8' : 'rgba(42, 39, 80, 0.6)'}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface PrFeedCardProps {
  prs: NonNullable<ReturnType<typeof usePersonalRecords>>;
  unit: 'lb' | 'kg';
}

function PrFeedCard({ prs, unit }: PrFeedCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={14} strokeWidth={2} className="text-reserved" />
          <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
            Recent PRs
          </p>
        </div>
        <span className="display-num text-[11px] uppercase tracking-wider text-text-muted">
          {prs.length === 0 ? '—' : `${prs.length}`}
        </span>
      </div>
      {prs.length === 0 ? (
        <p className="mt-3 text-xs text-text-muted">
          No PRs logged yet. Add a set in Lift — the first one always counts.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1.5">
          {prs.map((p) => (
            <li
              key={p.pr.id}
              className="flex items-center justify-between rounded-card border border-reserved/20 bg-reserved/5 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-text-primary">
                  {p.exercise?.name ?? 'Exercise'}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-text-muted">
                  {format(new Date(p.pr.achievedAt), 'MMM d')}
                </p>
              </div>
              <span className="display-num text-base font-semibold tabular-nums text-reserved">
                {p.pr.weight}
                <span className="text-[10px] uppercase tracking-wider"> {unit}</span>
                <span className="text-text-muted"> × </span>
                {p.pr.reps}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

interface SessionRowProps {
  summary: SessionSummary;
  onOpen: () => void;
}

function SessionRow({ summary, onOpen }: SessionRowProps) {
  const { session } = summary;
  const dateLabel = format(new Date(session.startedAt), 'MMM d · h:mm a');
  const KindIcon =
    session.kind === 'lift'
      ? Dumbbell
      : session.kind === 'cardio'
        ? Activity
        : session.kind === 'mobility'
          ? Wind
          : Moon;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this session?')) return;
    if (session.id !== undefined) await deleteSession(session.id);
  };

  return (
    <AnimatePresence initial={false}>
      <motion.div
        layout
        onClick={onOpen}
        className="glass flex cursor-pointer items-center gap-3 rounded-card border border-border-subtle px-4 py-3"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-elevated text-text-secondary">
          <KindIcon size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-text-primary">{summary.label}</p>
          <p className="text-[11px] text-text-muted">{dateLabel}</p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete session"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-muted hover:text-danger"
        >
          <Trash2 size={13} strokeWidth={1.8} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
