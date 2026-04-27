import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  /** Decimal places to round to. Default 0. */
  decimals?: number;
  /** Optional thousands separator. Default ','. Set to '' to disable. */
  thousandsSep?: string;
  /** Spring stiffness — higher = snappier. Default 220. */
  stiffness?: number;
  /** Spring damping. Default 28. */
  damping?: number;
  className?: string;
  /** Optional content prepended (not animated) — e.g. "$". */
  prefix?: string;
  /** Optional content appended — e.g. " XP". */
  suffix?: string;
}

/**
 * Tweens between numeric values with a spring. Uses a single MotionValue and
 * subscribes once — does not re-render on every frame.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  thousandsSep = ',',
  stiffness = 220,
  damping = 28,
  className,
  prefix,
  suffix,
}: AnimatedNumberProps) {
  const mv = useMotionValue(value);
  const display = useTransform(mv, (n) => formatNumber(n, decimals, thousandsSep));

  useEffect(() => {
    const controls = animate(mv, value, {
      type: 'spring',
      stiffness,
      damping,
      mass: 0.7,
    });
    return () => controls.stop();
  }, [value, mv, stiffness, damping]);

  return (
    <span className={className}>
      {prefix ? <span aria-hidden="true">{prefix}</span> : null}
      <motion.span>{display}</motion.span>
      {suffix ? <span aria-hidden="true">{suffix}</span> : null}
    </span>
  );
}

function formatNumber(n: number, decimals: number, sep: string): string {
  const fixed = n.toFixed(decimals);
  if (!sep) return fixed;
  const [int, frac] = fixed.split('.');
  const withSep = int!.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return frac ? `${withSep}.${frac}` : withSep;
}
