import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function generateTimeSlots(start, end, intervalMinutes = 60) {
  const slots = []
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  let current = startH * 60 + startM
  const endMinutes = endH * 60 + endM - intervalMinutes // Leave room for the session

  while (current <= endMinutes) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    current += intervalMinutes
  }
  return slots
}

// GET /api/attorneys/[id]/availability?date=2026-04-01
export async function GET(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    // Fetch attorney
    const { data: attorney, error } = await supabaseAdmin
      .from('attorneys')
      .select('id, availability_schedule')
      .eq('id', id)
      .single()

    if (error || !attorney) {
      return NextResponse.json({ error: 'Attorney not found' }, { status: 404 })
    }

    let schedule = null
    try {
      schedule = typeof attorney.availability_schedule === 'string'
        ? JSON.parse(attorney.availability_schedule)
        : attorney.availability_schedule
    } catch {}

    // Generate available dates for the next 14 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const availableDates = []

    for (let i = 1; i <= 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dayName = DAY_NAMES[d.getDay()]

      if (schedule && schedule[dayName]) {
        availableDates.push({
          date: d.toISOString().split('T')[0],
          dayName: dayName,
          dayLabel: d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
        })
      }
    }

    // If a specific date is requested, get available time slots
    let timeSlots = []
    if (dateStr) {
      const requestedDate = new Date(dateStr)
      const dayName = DAY_NAMES[requestedDate.getDay()]

      if (schedule && schedule[dayName]) {
        const { start, end } = schedule[dayName]
        const allSlots = generateTimeSlots(start, end, 60)

        // Check existing bookings for this date
        const { data: existingBookings } = await supabaseAdmin
          .from('consultation_bookings')
          .select('booking_time')
          .eq('attorney_id', id)
          .eq('booking_date', dateStr)
          .neq('status', 'cancelled')

        const bookedTimes = new Set(
          (existingBookings || []).map(b => {
            const t = b.booking_time
            return typeof t === 'string' ? t.substring(0, 5) : ''
          })
        )

        timeSlots = allSlots.map(slot => ({
          time: slot,
          available: !bookedTimes.has(slot)
        }))
      }
    }

    return NextResponse.json({
      attorneyId: id,
      availableDates,
      timeSlots
    })
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
