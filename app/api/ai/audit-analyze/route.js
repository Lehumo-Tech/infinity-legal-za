import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { aiChat, parseAIJson, DEFAULT_MODEL } from '@/lib/ai'

export const dynamic = 'force-dynamic'

const AUDIT_ANALYST_PROMPT = `You are the Chief Compliance AI Analyst for Infinity Legal, a South African law firm. You analyze audit trail data and provide actionable security and compliance insights.

You MUST respond ONLY with valid JSON (no markdown, no code blocks). The JSON must follow this schema:

{
  "summary": "A 2-3 sentence executive summary of the audit period",
  "riskScore": 0-100,
  "riskLevel": "low|medium|high|critical",
  "patterns": [
    {
      "type": "anomaly|trend|compliance|security",
      "severity": "info|warning|alert|critical",
      "title": "Short title",
      "description": "Detailed description of the pattern",
      "recommendation": "Actionable recommendation"
    }
  ],
  "userActivity": [
    {
      "user": "Name",
      "role": "role",
      "actions": 0,
      "riskIndicator": "normal|elevated|high",
      "note": "Brief note about this user's activity"
    }
  ],
  "complianceNotes": [
    "POPIA-relevant observation 1",
    "LSSA compliance note 2"
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "What to do",
      "reason": "Why"
    }
  ]
}

Guidelines:
- Focus on South African legal compliance (POPIA, LSSA rules, Legal Practice Act)
- Flag unusual patterns: after-hours access, excessive privileged note views, bulk data access
- Note any potential attorney-client privilege breaches
- Consider RBAC violations or attempts
- Provide practical recommendations for the managing partner
- Be specific about which users and actions need attention`

export async function POST(request) {
  const { user, error, status } = await requirePermission(request, 'VIEW_AUDIT_LOGS')
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { logs } = await request.json()

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ error: 'No audit logs provided for analysis' }, { status: 400 })
    }

    // Prepare audit data for AI
    const auditSummary = logs.map(l => ({
      time: l.created_at,
      user: l.user?.full_name || 'Unknown',
      role: l.user?.role || 'unknown',
      action: l.action,
      resource: l.resource_type,
      details: l.details ? JSON.stringify(l.details).slice(0, 200) : ''
    }))

    const userMessage = `Analyze the following ${logs.length} audit log entries from our South African law firm. Identify patterns, anomalies, compliance risks, and provide recommendations:\n\n${JSON.stringify(auditSummary, null, 2)}`

    const rawResponse = await aiChat({
      systemPrompt: AUDIT_ANALYST_PROMPT,
      userMessage,
      temperature: 0.2,
      maxTokens: 3000,
    })

    const analysis = parseAIJson(rawResponse)
    return NextResponse.json({ analysis, logsAnalyzed: logs.length })

  } catch (err) {
    console.error('AI Audit analyze error:', err)
    return NextResponse.json({ error: 'Failed to analyze audit logs. Please try again.' }, { status: 500 })
  }
}
