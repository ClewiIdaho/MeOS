import { formatCents } from '@/utils/money';

/**
 * Goal values are stored as raw numbers, but money goals (unit '$') store cents
 * to match the rest of the money domain. Format-time only — never branch on
 * unit when reading or computing pace.
 */
export function formatGoalValue(value: number, unit: string): string {
  if (unit === '$') {
    return formatCents(Math.round(value), false);
  }
  return Math.round(value).toLocaleString();
}

export function isMoneyGoal(unit: string): boolean {
  return unit === '$';
}
