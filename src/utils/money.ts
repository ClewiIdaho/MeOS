/**
 * Money helpers — values are stored as integer cents.
 * `toDisplay(1234)` → "$12.34". `parseDollars("12.34")` → 1234.
 */

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatCents(cents: number, withCents = true): string {
  const dollars = Math.abs(cents) / 100;
  const sign = cents < 0 ? '-' : '';
  const formatted = withCents
    ? dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(dollars).toLocaleString('en-US');
  return `${sign}$${formatted}`;
}

/** Parse a freeform user-entered dollar string into integer cents. Returns null on bad input. */
export function parseDollarsToCents(input: string): number | null {
  const trimmed = input.trim().replace(/[$,\s]/g, '');
  if (!trimmed) return null;
  if (!/^-?\d*\.?\d*$/.test(trimmed)) return null;
  const dollars = Number(trimmed);
  if (!Number.isFinite(dollars)) return null;
  return Math.round(dollars * 100);
}
