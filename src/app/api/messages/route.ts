import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';

// GET /api/messages — Get messages for the current user
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authenticated) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });

    const userId = auth.user.userId;
    const { searchParams } = new URL(req.url);
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const isRead = searchParams.get('is_read');

    const where: any = {
      OR: [
        { sender_id: userId },
        { recipient_id: userId },
      ],
    };

    if (isRead !== null && isRead !== undefined && isRead !== '') {
      where.is_read = isRead === 'true';
    }

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        include: {
          sender: { select: { id: true, full_name: true, email: true } },
          recipient: { select: { id: true, full_name: true, email: true } },
          case: { select: { id: true, title: true, case_ref: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.message.count({ where }),
    ]);

    // Count unread messages where user is the recipient
    const unreadCount = await db.message.count({
      where: {
        recipient_id: userId,
        is_read: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        data: messages,
        pagination: {
          page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
        },
        unread_count: unreadCount,
      },
    });
  } catch (error: any) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch messages' } },
      { status: 500 }
    );
  }
}

// POST /api/messages — Send a new message
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authenticated) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });

    const body = await req.json();
    const { recipient_id, subject, content, case_id, message_type } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: { message: 'Message content is required' } },
        { status: 400 }
      );
    }

    if (!recipient_id) {
      return NextResponse.json(
        { success: false, error: { message: 'Recipient is required' } },
        { status: 400 }
      );
    }

    const message = await db.message.create({
      data: {
        sender_id: auth.user.userId,
        recipient_id,
        subject: subject || null,
        content: content.trim(),
        case_id: case_id || null,
        message_type: message_type || 'direct',
        is_encrypted: false,
        is_read: false,
      },
      include: {
        sender: { select: { id: true, full_name: true, email: true } },
        recipient: { select: { id: true, full_name: true, email: true } },
      },
    });

    // Create a notification for the recipient
    try {
      await db.notification.create({
        data: {
          user_id: recipient_id,
          type: 'new_message',
          title: 'New Message',
          message: `You have a new message from ${message.sender?.full_name || 'a user'}`,
        },
      });
    } catch {
      // Non-critical: notification creation failure shouldn't block the message
    }

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error: any) {
    console.error('Messages POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to send message' } },
      { status: 500 }
    );
  }
}

// PUT /api/messages — Mark a message as read
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authenticated) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });

    const body = await req.json();
    const { message_id } = body;

    if (!message_id) {
      return NextResponse.json(
        { success: false, error: { message: 'Message ID is required' } },
        { status: 400 }
      );
    }

    const message = await db.message.update({
      where: { id: message_id },
      data: { is_read: true },
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    console.error('Messages PUT error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update message' } },
      { status: 500 }
    );
  }
}

// PATCH /api/messages — Mark all messages as read for the current user
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authenticated) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });

    const result = await db.message.updateMany({
      where: {
        recipient_id: auth.user.userId,
        is_read: false,
      },
      data: { is_read: true },
    });

    return NextResponse.json({ success: true, data: { updated: result.count } });
  } catch (error: any) {
    console.error('Messages PATCH error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to mark messages as read' } },
      { status: 500 }
    );
  }
}
