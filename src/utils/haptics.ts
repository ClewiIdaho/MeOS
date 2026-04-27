/**
 * Haptic feedback via the Vibration API. No-op where unsupported (iOS Safari
 * has no vibrate, Android Chrome PWA has it).
 *
 * Patterns are short on purpose — long buzzes break the rhythm of tap-tap-done.
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some platforms throw if the document isn't user-activated yet.
  }
}

/** Light tap — successful single completion (task done, bill paid, set added). */
export function hapticTap(): void {
  vibrate(10);
}

/** Heavier acknowledgement — workout logged, milestone hit. */
export function hapticAck(): void {
  vibrate([0, 18, 40, 18]);
}

/** Reserved-tier moment — level up, PR, goal completed, streak milestone. */
export function hapticReserved(): void {
  vibrate([0, 30, 60, 30, 60, 60]);
}
