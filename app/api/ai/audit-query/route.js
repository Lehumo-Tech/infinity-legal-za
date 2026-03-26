import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { aiChat, DEFAULT_MODEL } from '@/lib/ai'

export const dynamic = 'force-dynamic'

const AUDIT_QUERY_PROMPT = `You are an audit intelligence assistant for Infinity Legal, a South African law firm. You answer questions about audit trail data in clear, professional language.

You have access to the firm's audit logs which track: staff logins, document approvals/rejections, privileged note access, lead management actions, staff account creation, and case status changes.

Guidelines:
- Answer in concise, professional English
- Reference specific users, dates, and actions from the provided data
- Flag any compliance concerns related to POPIA, LSSA, or the Legal Practice Act
- If you notice security concerns, highlight them prominently
- If the data doesn't contain enough information to answer, say so clearly
- Use bullet points for clarity
- Always mention if a pattern could indicate a policy violation`

export async function POST(request) {
  const { user, error, status } = await requirePermission(request, 'VIEW_AUDIT_LOGS')
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { query, logs } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Please provide a query' }, { status: 400 })
    }

    const auditContext = (logs || []).map(l => ({
      time: l.created_at,
      user: l.user?.full_name || 'Unknown',
      role: l.user?.role || 'unknown',
      action: l.action,
      resource: l.resource_type,
      details: l.details ? JSON.stringify(l.details).slice(0, 200) : ''
    }))

    const userMessage = `Here are the recent audit logs from our firm:\n\n${JSON.stringify(auditContext, null, 2)}\n\nQuestion: ${query}`

    const response = await aiChat({
      systemPrompt: AUDIT_QUERY_PROMPT,
      userMessage,
      temperature: 0.3,
      maxTokens: 1500,
    })

    return NextResponse.json({ answer: response })

  } catch (err) {
    console.error('AI Audit query error:', err)
    return NextResponse.json({ error: 'Failed to process your query. Please try again.' }, { status: 500 })
  }
}
