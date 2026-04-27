import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TypingTextProps {
  text: string;
  /** Characters per second. Default 32. Range 25–40 reads natural for short quips. */
  charsPerSecond?: number;
  className?: string;
  /** Called when the full string finishes rendering. */
  onComplete?: () => void;
}

/**
 * Renders text with a typewriter cadence. Honors prefers-reduced-motion by
 * snapping to the full string immediately.
 *
 * Caret is a CSS pseudo-element via the trailing block; we don't use
 * Framer here because the timer-driven slice is simpler than animating
 * a shared MotionValue character-by-character.
 */
export function TypingText({ text, charsPerSecond = 32, className, onComplete }: TypingTextProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState('');

  useEffect(() => {
    if (reduceMotion) {
      setShown(text);
      onComplete?.();
      return;
    }
    setShown('');
    if (!text) return;
    const stepMs = 1000 / Math.max(1, charsPerSecond);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        onComplete?.();
      }
    }, stepMs);
    return () => window.clearInterval(id);
  }, [text, charsPerSecond, reduceMotion, onComplete]);

  const done = shown.length === text.length;

  return (
    <span className={className}>
      {shown}
      {!done ? <span className="ml-0.5 inline-block animate-pulse text-accent">|</span> : null}
    </span>
  );
}
