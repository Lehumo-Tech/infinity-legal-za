/**
 * Unit tests for src/lib/format.ts
 * Covers: formatRevenue, formatCurrency, formatPercent, formatCount.
 * The key invariant: formatters are null-safe and never return "NaN".
 */
import { test, expect, describe } from 'bun:test';
import {
  formatRevenue,
  formatCurrency,
  formatPercent,
  formatCount,
} from '@/lib/format';

describe('format: formatRevenue (adaptive scale)', () => {
  test('formats amounts under R1000 with rounding', () => {
    expect(formatRevenue(99)).toBe('R99');
    expect(formatRevenue(150)).toBe('R150');
    expect(formatRevenue(999.99)).toBe('R1,000');
  });

  test('formats thousands with K suffix', () => {
    expect(formatRevenue(1500)).toBe('R2K');
    expect(formatRevenue(99_000)).toBe('R99K');
  });

  test('formats millions with M suffix and 2 decimals', () => {
    expect(formatRevenue(1_500_000)).toBe('R1.50M');
    expect(formatRevenue(2_000_000)).toBe('R2.00M');
  });

  test('returns R0 for null, undefined, NaN', () => {
    expect(formatRevenue(null)).toBe('R0');
    expect(formatRevenue(undefined)).toBe('R0');
    expect(formatRevenue(NaN)).toBe('R0');
    expect(formatRevenue(Infinity)).toBe('R0');
  });
});

describe('format: formatCurrency (plain ZAR)', () => {
  test('formats with thousands separators', () => {
    expect(formatCurrency(1234)).toBe('R1,234');
    expect(formatCurrency(1_000_000)).toBe('R1,000,000');
  });

  test('rounds to nearest rand', () => {
    expect(formatCurrency(99.5)).toBe('R100');
    expect(formatCurrency(99.4)).toBe('R99');
  });

  test('returns R0 for invalid input', () => {
    expect(formatCurrency(null)).toBe('R0');
    expect(formatCurrency(undefined)).toBe('R0');
    expect(formatCurrency(NaN)).toBe('R0');
  });

  test('never returns "NaN"', () => {
    // The whole point of this helper — guard every UI surface.
    expect(formatCurrency(null)).not.toContain('NaN');
    expect(formatCurrency(undefined)).not.toContain('NaN');
    expect(formatCurrency(NaN as unknown as number)).not.toContain('NaN');
  });
});

describe('format: formatPercent', () => {
  test('formats values already on a 0-100 scale', () => {
    expect(formatPercent(50)).toBe('50.0%');
    expect(formatPercent(100)).toBe('100.0%');
  });

  test('formats fractional 0-1 values (auto-detect)', () => {
    expect(formatPercent(0.5)).toBe('50.0%');
    expect(formatPercent(1)).toBe('100.0%');
  });

  test('respects the decimals argument', () => {
    expect(formatPercent(33.333, 2)).toBe('33.33%');
    expect(formatPercent(33.333, 0)).toBe('33%');
  });

  test('returns 0% for invalid input', () => {
    expect(formatPercent(null)).toBe('0%');
    expect(formatPercent(undefined)).toBe('0%');
    expect(formatPercent(NaN)).toBe('0%');
  });

  test('never returns "NaN%"', () => {
    expect(formatPercent(null)).not.toContain('NaN');
    expect(formatPercent(undefined)).not.toContain('NaN');
  });
});

describe('format: formatCount', () => {
  test('formats integers with locale separators', () => {
    expect(formatCount(1234)).toBe('1,234');
    expect(formatCount(1_000_000)).toBe('1,000,000');
  });

  test('handles zero', () => {
    expect(formatCount(0)).toBe('0');
  });

  test('returns 0 for invalid input', () => {
    expect(formatCount(null)).toBe('0');
    expect(formatCount(undefined)).toBe('0');
    expect(formatCount(NaN)).toBe('0');
  });

  test('never returns "NaN"', () => {
    expect(formatCount(null)).not.toContain('NaN');
    expect(formatCount(undefined)).not.toContain('NaN');
  });
});
