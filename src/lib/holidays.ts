/**
 * Infinity Legal ZA - South African Public Holiday Utility
 * Uses Nager.Date API with 24-hour in-memory cache
 * Critical for court date scheduling - prevents booking on public holidays
 */

import { callExternalApi, setCache, getCache, type NagerHoliday } from '@/lib/external-apis';

// ============================================
// CONSTANTS
// ============================================

const HOLIDAY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const NAGER_API_BASE = 'https://date.nager.at/api/v3';

// ============================================
// TYPES
// ============================================

export interface SAHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  types: string[];
}

// ============================================
// FALLBACK HOLIDAYS (2026 - if API is down)
// ============================================

const FALLBACK_HOLIDAYS_2026: SAHoliday[] = [
  { date: '2026-01-01', localName: 'Nuwejaarsdag', name: "New Year's Day", countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2026-03-21', localName: 'Menseregtaandag', name: 'Human Rights Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2026-04-03', localName: 'Goëe Vrydag', name: 'Good Friday', countryCode: 'ZA', fixed: false, global: true, types: ['Public'] },
  { date: '2026-04-06', localName: 'Familiendag', name: 'Family Day', countryCode: 'ZA', fixed: false, global: true, types: ['Public'] },
  { date: '2026-04-27', localName: 'Vryheidsdag', name: 'Freedom Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2026-05-01', localName: 'Werkersdag', name: 'Workers Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2026-06-16', localName: 'Jeugdag', name: 'Youth Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2026-08-09', localName: 'Nasionale Vrouedag', name: 'National Womens Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2026-09-24', localName: 'Erfenisdag', name: 'Heritage Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2026-12-16', localName: 'Versoeningsdag', name: 'Day of Reconciliation', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2026-12-25', localName: 'Kersdag', name: 'Christmas Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2026-12-26', localName: 'Dag van Goedwilligheid', name: 'Day of Goodwill', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
];

const FALLBACK_HOLIDAYS_2025: SAHoliday[] = [
  { date: '2025-01-01', localName: 'Nuwejaarsdag', name: "New Year's Day", countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2025-03-21', localName: 'Menseregtaandag', name: 'Human Rights Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2025-04-18', localName: 'Goëe Vrydag', name: 'Good Friday', countryCode: 'ZA', fixed: false, global: true, types: ['Public'] },
  { date: '2025-04-21', localName: 'Familiendag', name: 'Family Day', countryCode: 'ZA', fixed: false, global: true, types: ['Public'] },
  { date: '2025-04-27', localName: 'Vryheidsdag', name: 'Freedom Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2025-05-01', localName: 'Werkersdag', name: 'Workers Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2025-06-16', localName: 'Jeugdag', name: 'Youth Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2025-08-09', localName: 'Nasionale Vrouedag', name: 'National Womens Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2025-09-24', localName: 'Erfenisdag', name: 'Heritage Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2025-12-16', localName: 'Versoeningsdag', name: 'Day of Reconciliation', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2025-12-25', localName: 'Kersdag', name: 'Christmas Day', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
  { date: '2025-12-26', localName: 'Dag van Goedwilligheid', name: 'Day of Goodwill', countryCode: 'ZA', fixed: true, global: true, types: ['Public'] },
];

function getFallbackHolidays(year: number): SAHoliday[] {
  if (year === 2026) return FALLBACK_HOLIDAYS_2026;
  if (year === 2025) return FALLBACK_HOLIDAYS_2025;
  return [];
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all South African public holidays for a given year.
 * Results are cached for 24 hours.
 */
export async function getHolidaysForYear(year: number): Promise<SAHoliday[]> {
  const cacheKey = `holidays:za:${year}`;

  // Check cache first
  const cached = getCache<SAHoliday[]>(cacheKey);
  if (cached) return cached;

  // Fetch from Nager.Date API
  const result = await callExternalApi<NagerHoliday[]>(
    `${NAGER_API_BASE}/PublicHolidays/${year}/ZA`,
    { timeout: 5000, maxRetries: 2 }
  );

  if (result.success && result.data) {
    const holidays: SAHoliday[] = result.data.map(h => ({
      date: h.date,
      localName: h.localName,
      name: h.name,
      countryCode: h.countryCode,
      fixed: h.fixed,
      global: h.global,
      types: h.types,
    }));

    // Cache for 24 hours
    setCache(cacheKey, holidays, HOLIDAY_CACHE_TTL);
    return holidays;
  }

  // Fallback to hardcoded holidays if API is down
  console.warn(`[Holidays] API failed for year ${year}, using fallback data`);
  const fallback = getFallbackHolidays(year);
  if (fallback.length > 0) {
    setCache(cacheKey, fallback, HOLIDAY_CACHE_TTL);
  }
  return fallback;
}

/**
 * Check if a given date is a South African public holiday.
 * Used for court date scheduling - prevents booking on public holidays.
 */
export async function isSouthAfricanHoliday(date: Date | string): Promise<boolean> {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

  const holidays = await getHolidaysForYear(year);
  return holidays.some(h => h.date === dateStr);
}

/**
 * Get upcoming South African public holidays.
 * @param days - Number of days to look ahead (default: 30)
 */
export async function getUpcomingHolidays(days: number = 30): Promise<SAHoliday[]> {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + days);

  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;

  // Fetch both years if the range spans across
  const holidaysCurrent = await getHolidaysForYear(currentYear);
  const holidaysNext = futureDate.getFullYear() !== currentYear
    ? await getHolidaysForYear(nextYear)
    : [];

  const allHolidays = [...holidaysCurrent, ...holidaysNext];

  const nowStr = now.toISOString().split('T')[0];
  const futureStr = futureDate.toISOString().split('T')[0];

  return allHolidays
    .filter(h => h.date >= nowStr && h.date <= futureStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Check if a date falls on a weekend (Saturday or Sunday).
 * Also useful for court scheduling.
 */
export function isWeekend(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = dateObj.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is a valid court working day (not a holiday or weekend).
 */
export async function isCourtWorkingDay(date: Date | string): Promise<boolean> {
  const isHoliday = await isSouthAfricanHoliday(date);
  if (isHoliday) return false;
  return !isWeekend(date);
}
