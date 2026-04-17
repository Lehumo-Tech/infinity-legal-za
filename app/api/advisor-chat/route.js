import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import OpenAI from 'openai'
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY,
  baseURL: 'https://integrations.emergentagent.com/llm',
})

const AI_DISCLAIMER = '\n\n⚠️ This is AI-generated legal information — not legal advice. A human legal advisor will review your matter. For formal representation, consult an LPC-registered attorney.'

// POST /api/advisor-chat — Send a message in a chat session
export async function POST(request) {
  try {
    const body = await request.json()
    const { sessionId, matterId, userId, userEmail, userName, message, role } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const db = await getDb()
    const chatSessionId = sessionId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    // Save the user message
    const userMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId: chatSessionId,
      matterId: matterId || null,
      userId: userId || 'anonymous',
      userEmail: userEmail || '',
      userName: userName || 'Member',
      role: role || 'member',
      sender: role === 'advisor' ? 'advisor' : 'member',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    }
    await db.collection('chat_messages').insertOne(userMsg)

    // If message is from member, generate AI first-response
    let aiResponse = null
    if (role !== 'advisor') {
      try {
        // Get chat history for context
        const history = await db.collection('chat_messages').find({ sessionId: chatSessionId }).sort({ createdAt: 1 }).limit(10).toArray()
        const messages = [
          { role: 'system', content: `You are an AI legal assistant for Infinity Legal (South Africa). You provide an initial response to member queries while a human legal advisor is being assigned.\n\nRULES:\n1. Be empathetic and professional\n2. Acknowledge their concern\n3. Provide brief, helpful legal information based on SA law\n4. Let them know a human advisor will follow up\n5. NEVER provide case-specific advice\n6. Cite relevant SA Acts where possible\n7. Keep responses concise (under 200 words)\n8. If the matter involves violence, abuse, or immediate danger, provide emergency contacts (SAPS: 10111, GBV Helpline: 0800 150 150)` },
        ]
        for (const h of history.slice(-6)) {
          messages.push({ role: h.sender === 'member' ? 'user' : 'assistant', content: h.message })
        }

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          max_tokens: 400,
          temperature: 0.3,
        })

        const aiText = (completion.choices[0]?.message?.content || '') + AI_DISCLAIMER

        // Save AI response
        const aiMsg = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          sessionId: chatSessionId,
          matterId: matterId || null,
          userId: 'ai_assistant',
          userName: 'Infinity AI',
          sender: 'ai',
          message: aiText,
          createdAt: new Date().toISOString(),
        }
        await db.collection('chat_messages').insertOne(aiMsg)
        aiResponse = aiMsg
      } catch (aiError) {
        console.error('AI chat response failed:', aiError.message)
        // Save fallback
        const fallbackMsg = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          sessionId: chatSessionId,
          matterId: matterId || null,
          userId: 'ai_assistant',
          userName: 'Infinity AI',
          sender: 'ai',
          message: `Thank you for reaching out. I\'ve received your query and a human legal advisor will be assigned to assist you shortly. In the meantime, you can use our Free AI Analysis tool for immediate guidance.${AI_DISCLAIMER}`,
          createdAt: new Date().toISOString(),
        }
        await db.collection('chat_messages').insertOne(fallbackMsg)
        aiResponse = fallbackMsg
      }
    }

    // Update or create chat session
    await db.collection('chat_sessions').updateOne(
      { sessionId: chatSessionId },
      {
        $set: {
          matterId: matterId || null,
          userId: userId || 'anonymous',
          userEmail: userEmail || '',
          userName: userName || 'Member',
          lastMessage: message.substring(0, 100),
          lastActivity: new Date().toISOString(),
          status: 'active',
        },
        $setOnInsert: {
          sessionId: chatSessionId,
          createdAt: new Date().toISOString(),
          assignedAdvisor: null,
        },
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      sessionId: chatSessionId,
      userMessage: userMsg,
      aiResponse,
    }, { status: 201 })
  } catch (error) {
    console.error('Advisor chat error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/advisor-chat?sessionId=xxx — Get chat history
export async function GET(request) {
  try {
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Get messages for a specific session
      const messages = await db.collection('chat_messages').find({ sessionId }).sort({ createdAt: 1 }).toArray()
      const session = await db.collection('chat_sessions').findOne({ sessionId })
      return NextResponse.json({ success: true, session, messages })
    }

    // List all active sessions (for advisors)
    const sessions = await db.collection('chat_sessions').find({}).sort({ lastActivity: -1 }).limit(50).toArray()
    const stats = {
      total: sessions.length,
      active: sessions.filter(s => s.status === 'active').length,
      unassigned: sessions.filter(s => !s.assignedAdvisor).length,
    }

    return NextResponse.json({ success: true, stats, sessions })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
