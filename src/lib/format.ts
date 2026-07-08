/**
 * Shared formatting helpers for Infinity Legal UI.
 * All formatters are null-safe — they return a sensible fallback
 * when given undefined/NaN/invalid input so the UI never shows "NaN".
 */

/** Format a ZAR currency amount with adaptive scale (R1.2K / R99 / R1.5M). */
export function formatRevenue(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return 'R0';
  if (amount >= 1_000_000) return `R${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `R${(amount / 1_000).toFixed(0)}K`;
  return `R${Math.round(amount).toLocaleString('en-ZA')}`;
}

/** Format a plain ZAR amount with thousands separators (R1,234). */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return 'R0';
  return `R${Math.round(amount).toLocaleString('en-ZA')}`;
}

/** Format a percentage value (0-100 or 0-1). Never returns "NaN%". */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return '0%';
  // Accept 0-1 fractions too
  const pct = value > 1 ? value : value * 100;
  return `${pct.toFixed(decimals)}%`;
}

/** Format a count safely — never "NaN". */
export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '0';
  return value.toLocaleString('en-ZA');
}
