import type { VoiceIntensity } from '@/db';

/**
 * Thin wrapper around the Web Speech API. Browser support is uneven:
 * Chrome/Edge/Safari are solid, Firefox needs a flag on some platforms,
 * Android default voices vary. Callers should always check `speechSupported`
 * before showing a play affordance.
 */

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

const INTENSITY_PROFILE: Record<VoiceIntensity, { rate: number; pitch: number }> = {
  mellow: { rate: 0.92, pitch: 0.95 },
  standard: { rate: 1.0, pitch: 1.0 },
  spicy: { rate: 1.08, pitch: 1.05 },
};

interface SpeakOptions {
  intensity?: VoiceIntensity;
  onEnd?: () => void;
  onError?: () => void;
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!speechSupported() || !text.trim()) return;
  cancelSpeech();
  const utter = new SpeechSynthesisUtterance(text);
  const profile = INTENSITY_PROFILE[opts.intensity ?? 'standard'];
  utter.rate = profile.rate;
  utter.pitch = profile.pitch;
  utter.volume = 1;
  utter.onend = () => opts.onEnd?.();
  utter.onerror = () => (opts.onError ?? opts.onEnd)?.();
  window.speechSynthesis.speak(utter);
}

export function cancelSpeech(): void {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  if (!speechSupported()) return false;
  return window.speechSynthesis.speaking || window.speechSynthesis.pending;
}
