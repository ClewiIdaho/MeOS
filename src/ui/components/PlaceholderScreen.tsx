import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { ScreenHeader } from './ScreenHeader';
import { Card } from './Card';
import { DbStatsCard } from './DbStatsCard';

interface PlaceholderScreenProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  /** Short list of capabilities this module will have. */
  capabilities: string[];
  /** Optional Voice-style line teasing the tone for the module. */
  voiceTease?: ReactNode;
}

/**
 * PlaceholderScreen — Phase 1 stand-in that already sets the design language.
 * Each module's full screen will replace this in later phases.
 */
export function PlaceholderScreen({
  eyebrow,
  title,
  subtitle,
  Icon,
  capabilities,
  voiceTease,
}: PlaceholderScreenProps) {
  return (
    <>
      <ScreenHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
        }}
        className="flex flex-col gap-4"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.1 }}
                className="bg-accent-grad shadow-glow grid h-12 w-12 place-items-center rounded-2xl"
              >
                <Icon size={24} strokeWidth={2} className="text-text-primary" />
              </motion.span>
              <div className="min-w-0">
                <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  Coming online
                </p>
                <h2 className="display-num mt-1 text-xl font-semibold tracking-display text-text-primary">
                  Module wired. Awaiting data.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  This is a placeholder while MY.OS is being assembled in phases. The
                  shell, theming, and PWA install path are live — features land next.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <Card className="p-5">
            <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
              What's coming
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {capabilities.map((cap) => (
                <li key={cap} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-glow" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {voiceTease ? (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <Card className="p-5">
              <p className="display-num text-[11px] uppercase tracking-[0.22em] text-text-muted">
                The Voice
              </p>
              <p className="mt-2 text-[15px] italic leading-relaxed text-text-primary">
                {voiceTease}
              </p>
            </Card>
          </motion.div>
        ) : null}

        <DbStatsCard />
      </motion.div>
    </>
  );
}
