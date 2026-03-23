import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'
import { sendBookingConfirmation } from '@/lib/brevo'

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/consultations - List user's consultations
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('consultation_bookings')
      .select('*')
      .eq('client_id', user.id)
      .order('booking_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with attorney names
    const attorneyIds = [...new Set((data || []).map(b => b.attorney_id).filter(Boolean))]
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', attorneyIds)

    const nameMap = {}
    for (const p of (profiles || [])) { nameMap[p.id] = p.full_name }

    const consultations = (data || []).map(b => ({
      ...b,
      attorney_name: nameMap[b.attorney_id] || 'Attorney'
    }))

    return NextResponse.json({ consultations })
  } catch (error) {
    console.error('Consultations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/consultations - Create a booking
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to book a consultation.' }, { status: 401 })
    }

    const body = await request.json()
    const { attorneyId, bookingDate, bookingTime, duration, consultationType, notes, caseId } = body

    // Validation
    if (!attorneyId) {
      return NextResponse.json({ error: 'Please select an attorney' }, { status: 400 })
    }
    if (!bookingDate) {
      return NextResponse.json({ error: 'Please select a date' }, { status: 400 })
    }
    if (!bookingTime) {
      return NextResponse.json({ error: 'Please select a time slot' }, { status: 400 })
    }

    // Verify attorney exists
    const { data: attorney, error: attErr } = await supabaseAdmin
      .from('attorneys')
      .select('id')
      .eq('id', attorneyId)
      .eq('is_verified', true)
      .single()

    if (attErr || !attorney) {
      return NextResponse.json({ error: 'Attorney not found or not verified' }, { status: 404 })
    }

    // Check for double booking
    const { data: existing } = await supabaseAdmin
      .from('consultation_bookings')
      .select('id')
      .eq('attorney_id', attorneyId)
      .eq('booking_date', bookingDate)
      .eq('booking_time', bookingTime + ':00')
      .neq('status', 'cancelled')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'This time slot is no longer available. Please choose another.' }, { status: 409 })
    }

    // Create the booking
    const bookingData = {
      client_id: user.id,
      attorney_id: attorneyId,
      booking_date: bookingDate,
      booking_time: bookingTime + ':00',
      duration_minutes: duration || 60,
      status: 'pending',
      consultation_type: consultationType || 'direct_payment',
      notes: notes || null
    }

    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('consultation_bookings')
      .insert([bookingData])
      .select()
      .single()

    if (bookingErr) {
      console.error('Booking create error:', bookingErr)
      return NextResponse.json({ error: bookingErr.message }, { status: 500 })
    }

    // If there's a case, update the case to link to this attorney
    if (caseId) {
      await supabaseAdmin
        .from('cases')
        .update({ attorney_id: attorneyId, status: 'matched' })
        .eq('id', caseId)
        .eq('client_id', user.id)
    }

    // Get attorney name for response
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', attorneyId)
      .single()

    const attorneyName = profile?.full_name || 'Attorney'
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })

    // Create notifications for both client and attorney
    await createNotification({
      userId: user.id,
      type: 'booking',
      title: 'Consultation Booked',
      message: `Your consultation with ${attorneyName} is confirmed for ${formattedDate} at ${bookingTime}.`,
      link: '/dashboard',
      metadata: { bookingId: booking.id, attorneyId }
    })

    await createNotification({
      userId: attorneyId,
      type: 'booking',
      title: 'New Consultation Booking',
      message: `A client has booked a ${duration}-minute consultation for ${formattedDate} at ${bookingTime}.`,
      link: '/attorney/office',
      metadata: { bookingId: booking.id, clientId: user.id }
    })

    // Send booking confirmation email (async, non-blocking)
    sendBookingConfirmation(user.email, user.user_metadata?.full_name || '', {
      attorneyName,
      date: formattedDate,
      time: bookingTime,
      caseType: consultationType || 'General Consultation',
    }).catch(err => {
      console.error('Booking confirmation email failed (non-blocking):', err.message)
    })

    return NextResponse.json({
      booking: {
        ...booking,
        attorney_name: attorneyName
      },
      message: 'Consultation booked successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Consultations POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
