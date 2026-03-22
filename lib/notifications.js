// Notification helper to create notifications from any API route
import { getDb } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

/**
 * Create a notification for a user
 * @param {Object} params
 * @param {string} params.userId - The user's Supabase UUID
 * @param {string} params.type - One of: booking, case_update, task_reminder, system, payment, document
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} [params.link] - Optional link to navigate to
 * @param {Object} [params.metadata] - Optional additional data
 */
export async function createNotification({ userId, type, title, message, link, metadata }) {
  try {
    const db = await getDb()
    await db.collection('notifications').insertOne({
      id: uuidv4(),
      userId,
      type: type || 'system',
      title,
      message,
      link: link || null,
      isRead: false,
      metadata: metadata || {},
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}

/**
 * Create multiple notifications at once
 * @param {Array} notifications - Array of notification objects
 */
export async function createBulkNotifications(notifications) {
  try {
    const db = await getDb()
    const docs = notifications.map(n => ({
      id: uuidv4(),
      userId: n.userId,
      type: n.type || 'system',
      title: n.title,
      message: n.message,
      link: n.link || null,
      isRead: false,
      metadata: n.metadata || {},
      createdAt: new Date()
    }))
    await db.collection('notifications').insertMany(docs)
  } catch (error) {
    console.error('Failed to create bulk notifications:', error)
  }
}
