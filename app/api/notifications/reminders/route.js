import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createNotification } from '@/lib/notifications'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

// POST /api/notifications/reminders - Generate task & calendar reminders
// This can be called periodically (e.g., via cron or manual trigger)
export async function POST(request) {
  try {
    // Simple API key check for cron jobs
    const authHeader = request.headers.get('authorization')
    const cronKey = request.headers.get('x-cron-key')
    
    // Allow either auth token or cron key
    if (!authHeader && !cronKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const today = now.toISOString().split('T')[0]

    let notificationsCreated = 0

    // 1. Tasks due today
    const { data: todayTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, title, assigned_to, due_date')
      .eq('due_date', today)
      .neq('status', 'completed')

    for (const task of (todayTasks || [])) {
      if (task.assigned_to) {
        // Check if we already sent this reminder today
        const db = await getDb()
        const existing = await db.collection('notifications').findOne({
          userId: task.assigned_to,
          type: 'task_reminder',
          'metadata.taskId': task.id,
          'metadata.reminderDate': today
        })
        
        if (!existing) {
          await createNotification({
            userId: task.assigned_to,
            type: 'task_reminder',
            title: 'Task Due Today',
            message: `"${task.title}" is due today. Don't forget to complete it.`,
            link: '/attorney/office/tasks',
            metadata: { taskId: task.id, reminderDate: today }
          })
          notificationsCreated++
        }
      }
    }

    // 2. Tasks due tomorrow
    const { data: tomorrowTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, title, assigned_to, due_date')
      .eq('due_date', tomorrowStr)
      .neq('status', 'completed')

    for (const task of (tomorrowTasks || [])) {
      if (task.assigned_to) {
        const db = await getDb()
        const existing = await db.collection('notifications').findOne({
          userId: task.assigned_to,
          type: 'task_reminder',
          'metadata.taskId': task.id,
          'metadata.reminderDate': tomorrowStr
        })
        
        if (!existing) {
          await createNotification({
            userId: task.assigned_to,
            type: 'task_reminder',
            title: 'Task Due Tomorrow',
            message: `"${task.title}" is due tomorrow. Plan accordingly.`,
            link: '/attorney/office/tasks',
            metadata: { taskId: task.id, reminderDate: tomorrowStr }
          })
          notificationsCreated++
        }
      }
    }

    // 3. Consultation reminders for tomorrow
    const { data: tomorrowBookings } = await supabaseAdmin
      .from('consultation_bookings')
      .select('id, client_id, attorney_id, booking_date, booking_time')
      .eq('booking_date', tomorrowStr)
      .neq('status', 'cancelled')

    for (const booking of (tomorrowBookings || [])) {
      const db = await getDb()
      
      // Remind client
      if (booking.client_id) {
        const existing = await db.collection('notifications').findOne({
          userId: booking.client_id,
          type: 'booking',
          'metadata.bookingId': booking.id,
          'metadata.reminderType': 'day_before'
        })
        
        if (!existing) {
          await createNotification({
            userId: booking.client_id,
            type: 'booking',
            title: 'Consultation Tomorrow',
            message: `Reminder: Your consultation is tomorrow at ${booking.booking_time?.substring(0, 5)}. Please prepare any relevant documents.`,
            link: '/dashboard',
            metadata: { bookingId: booking.id, reminderType: 'day_before' }
          })
          notificationsCreated++
        }
      }
      
      // Remind attorney
      if (booking.attorney_id) {
        const existing = await db.collection('notifications').findOne({
          userId: booking.attorney_id,
          type: 'booking',
          'metadata.bookingId': booking.id,
          'metadata.reminderType': 'day_before_attorney'
        })
        
        if (!existing) {
          await createNotification({
            userId: booking.attorney_id,
            type: 'booking',
            title: 'Consultation Tomorrow',
            message: `Reminder: You have a consultation scheduled for tomorrow at ${booking.booking_time?.substring(0, 5)}.`,
            link: '/attorney/office/calendar',
            metadata: { bookingId: booking.id, reminderType: 'day_before_attorney' }
          })
          notificationsCreated++
        }
      }
    }

    // 4. Overdue tasks
    const { data: overdueTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, title, assigned_to, due_date')
      .lt('due_date', today)
      .neq('status', 'completed')
      .limit(20)

    for (const task of (overdueTasks || [])) {
      if (task.assigned_to) {
        const db = await getDb()
        const existing = await db.collection('notifications').findOne({
          userId: task.assigned_to,
          type: 'task_reminder',
          'metadata.taskId': task.id,
          'metadata.reminderType': 'overdue',
          createdAt: { $gte: new Date(today + 'T00:00:00Z') }
        })
        
        if (!existing) {
          const daysOverdue = Math.floor((now - new Date(task.due_date)) / (1000 * 60 * 60 * 24))
          await createNotification({
            userId: task.assigned_to,
            type: 'task_reminder',
            title: 'Overdue Task',
            message: `"${task.title}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Please complete it urgently.`,
            link: '/attorney/office/tasks',
            metadata: { taskId: task.id, reminderType: 'overdue', daysOverdue }
          })
          notificationsCreated++
        }
      }
    }

    return NextResponse.json({
      message: `Reminders processed`,
      notificationsCreated,
      timestamp: now.toISOString()
    })

  } catch (error) {
    console.error('Reminders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
