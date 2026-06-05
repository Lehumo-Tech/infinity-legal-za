/**
 * GET /api/holidays - Fetch South African public holidays
 * Uses Nager.Date API with 24-hour cache
 * Used for court date scheduling - prevents booking on public holidays
 */

import { NextRequest } from 'next/server';
import { apiResponse, apiError } from '@/lib/middleware';
import { getHolidaysForYear, getUpcomingHolidays, isSouthAfricanHoliday, isCourtWorkingDay } from '@/lib/holidays';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const yearParam = url.searchParams.get('year');
    const upcomingParam = url.searchParams.get('upcoming');
    const dateCheck = url.searchParams.get('date');
    const courtDayCheck = url.searchParams.get('court_day');

    // Check if a specific date is a holiday
    if (dateCheck) {
      const date = new Date(dateCheck);
      if (isNaN(date.getTime())) {
        return apiError('Invalid date format. Use YYYY-MM-DD.', 400, 'INVALID_DATE');
      }
      const isHoliday = await isSouthAfricanHoliday(date);
      return apiResponse({
        date: dateCheck,
        isHoliday,
        holidayType: isHoliday ? 'public_holiday' : null,
      });
    }

    // Check if a date is a valid court working day
    if (courtDayCheck) {
      const date = new Date(courtDayCheck);
      if (isNaN(date.getTime())) {
        return apiError('Invalid date format. Use YYYY-MM-DD.', 400, 'INVALID_DATE');
      }
      const isWorkingDay = await isCourtWorkingDay(date);
      return apiResponse({
        date: courtDayCheck,
        isCourtWorkingDay: isWorkingDay,
      });
    }

    // Get upcoming holidays
    if (upcomingParam) {
      const days = parseInt(upcomingParam) || 30;
      const holidays = await getUpcomingHolidays(days);
      return apiResponse({
        holidays,
        period: `${days} days`,
        count: holidays.length,
      });
    }

    // Get all holidays for a year
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    if (year < 1900 || year > 2100) {
      return apiError('Year must be between 1900 and 2100', 400, 'INVALID_YEAR');
    }

    const holidays = await getHolidaysForYear(year);
    return apiResponse({
      year,
      holidays,
      count: holidays.length,
    });
  } catch (error) {
    console.error('Holidays API error:', error);
    return apiError('Failed to fetch holidays', 500, 'HOLIDAY_ERROR');
  }
}
