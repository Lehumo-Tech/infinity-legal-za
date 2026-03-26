import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { aiChat, parseAIJson, DEFAULT_MODEL } from '@/lib/ai'

export const dynamic = 'force-dynamic'

const LEAD_SCORER_PROMPT = `You are a Lead Scoring AI for Infinity Legal, a South African law firm. You analyze leads and provide conversion probability scores with reasoning.

You MUST respond ONLY with valid JSON (no markdown, no code blocks). The JSON must follow this schema:

{
  "scores": [
    {
      "leadId": "The lead ID",
      "score": 0-100,
      "grade": "A|B|C|D|F",
      "conversionLikelihood": "very_high|high|medium|low|very_low",
      "factors": {
        "urgencyScore": 0-25,
        "caseTypeScore": 0-25,
        "engagementScore": 0-25,
        "fitScore": 0-25
      },
      "recommendation": "Specific recommended action",
      "bestTimeToCall": "Suggested follow-up time",
      "talkingPoints": ["Key point 1", "Key point 2"]
    }
  ],
  "priorityOrder": ["leadId1", "leadId2"],
  "insights": "Brief overall insight about the lead batch"
}

Scoring criteria:
- Urgency (0-25): Emergency = 25, High = 20, Medium = 12, Low = 5
- Case Type Demand (0-25): Labour = 22 (high demand), Family = 20, Civil = 18, Criminal = 15, Property = 12
- Engagement (0-25): New + phone = 15, Contacted = 20, Qualified = 25
- Fit (0-25): Has email + phone = 20, Has employer info = 25, Minimal info = 10

Guidelines:
- Factor in South African market realities
- Labour cases have the highest conversion rate due to CCMA deadlines
- Emergency cases should always be prioritized regardless of score
- Provide specific, culturally appropriate talking points`

export async function POST(request) {
  const { user, error, status } = await requirePermission(request, 'VIEW_LEADS')
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { leads } = await request.json()

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No leads provided for scoring' }, { status: 400 })
    }

    const leadData = leads.map(l => ({
      id: l.id,
      name: l.full_name,
      caseType: l.case_type,
      urgency: l.urgency,
      status: l.status,
      hasPhone: !!l.phone,
      hasEmail: !!l.email,
      createdAt: l.created_at,
    }))

    const userMessage = `Score and prioritize these ${leads.length} leads for our South African law firm:\n\n${JSON.stringify(leadData, null, 2)}`

    const rawResponse = await aiChat({
      systemPrompt: LEAD_SCORER_PROMPT,
      userMessage,
      temperature: 0.2,
      maxTokens: 2500,
    })

    const result = parseAIJson(rawResponse)
    return NextResponse.json({ result })

  } catch (err) {
    console.error('AI Lead Score error:', err)
    return NextResponse.json({ error: 'Failed to score leads. Please try again.' }, { status: 500 })
  }
}
