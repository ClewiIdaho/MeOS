import { db, type VoiceIntensity, type CustomQuip } from '@/db';
import { QUIPS } from './quips';
import type { Quip, QuipCategory, QuipParams } from './types';

/**
 * Picks a quip and writes a voiceQuipHistory row.
 *
 * Selection rules:
 *   1. Pool = built-in QUIPS[category] ∪ enabled CustomQuips for category.
 *   2. Filter out any quip whose text matches one of the last RECENT_WINDOW
 *      shown rows for any category. Recent repeats are the loudest tell that
 *      the engine is canned.
 *   3. Prefer quips matching `intensity`. If that pool is empty after dedupe,
 *      widen to all intensities. If still empty, fall back to the unfiltered
 *      built-in pool — better to repeat than to render the empty string.
 *   4. Substitute {tokens} from `params`. Tokens missing from params are
 *      removed silently (along with the surrounding space), so quips read
 *      naturally even when a value is unavailable.
 */

const RECENT_WINDOW = 12;

export interface PickQuipResult {
  text: string;
  intensity: VoiceIntensity;
  category: QuipCategory;
}

export async function pickQuip(
  category: QuipCategory,
  intensity: VoiceIntensity,
  params: QuipParams = {},
): Promise<PickQuipResult> {
  const builtin = QUIPS[category] ?? [];
  const customRows = await db.customQuips.where('category').equals(category).toArray();
  const customs: Quip[] = customRows
    .filter((c) => c.enabled)
    .map<Quip>((c) => ({ text: c.text, intensity: customIntensity(c) }));

  const pool: Quip[] = [...builtin, ...customs];
  if (pool.length === 0) {
    return { text: '', intensity, category };
  }

  const recent = await db.voiceQuipHistory
    .orderBy('shownAt')
    .reverse()
    .limit(RECENT_WINDOW)
    .toArray();
  const recentTexts = new Set(recent.map((r) => r.quipText));

  const matchingIntensity = pool.filter((q) => q.intensity === intensity && !recentTexts.has(q.text));
  const anyIntensity = pool.filter((q) => !recentTexts.has(q.text));

  let chosen: Quip;
  if (matchingIntensity.length > 0) {
    chosen = pickRandom(matchingIntensity);
  } else if (anyIntensity.length > 0) {
    chosen = pickRandom(anyIntensity);
  } else {
    chosen = pickRandom(pool);
  }

  const text = substitute(chosen.text, params);

  await db.voiceQuipHistory.add({
    category,
    quipText: chosen.text,
    shownAt: Date.now(),
  });

  return { text, intensity: chosen.intensity, category };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * CustomQuip rows don't carry an explicit intensity column in the schema, so
 * we route them to 'standard' by default. Voice Studio can extend this later
 * without a schema bump by encoding intensity into the text or a tag column.
 */
function customIntensity(_c: CustomQuip): VoiceIntensity {
  return 'standard';
}

/**
 * Replaces {token} occurrences. If the token is missing or undefined,
 * the placeholder AND a single adjacent space (if any) are removed so the
 * surrounding sentence keeps reading cleanly.
 */
export function substitute(template: string, params: QuipParams): string {
  return template
    .replace(/\s?\{(\w+)\}/g, (full, key: string) => {
      const value = (params as Record<string, unknown>)[key];
      if (value === undefined || value === null || value === '') return '';
      return full.startsWith(' ') ? ` ${String(value)}` : String(value);
    })
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Test/diagnostic — clear the dedupe window. */
export async function clearVoiceHistory(): Promise<void> {
  await db.voiceQuipHistory.clear();
}
