import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { aiChat, parseAIJson, DEFAULT_MODEL } from '@/lib/ai'

export const dynamic = 'force-dynamic'

const INTELLIGENCE_PROMPT = `You are a Business Development AI Strategist for Infinity Legal, a South African law firm based in Gauteng. You provide competitive intelligence, market analysis, and lead generation recommendations.

You MUST respond ONLY with valid JSON (no markdown, no code blocks). The JSON must follow this schema:

{
  "marketOverview": {
    "summary": "2-3 sentence market overview",
    "trendingPracticeAreas": [
      { "area": "Practice area name", "growth": "percentage or direction", "reason": "Why it's trending" }
    ],
    "marketSentiment": "positive|neutral|cautious|challenging"
  },
  "competitorInsights": [
    {
      "firmType": "Type of competing firm",
      "strengths": ["What they do well"],
      "weaknesses": ["Where they fall short"],
      "opportunityForUs": "How Infinity Legal can capitalize"
    }
  ],
  "leadRecommendations": [
    {
      "category": "Lead category",
      "targetDemographic": "Who to target",
      "channel": "How to reach them",
      "estimatedConversion": "high|medium|low",
      "rationale": "Why this lead source is promising",
      "actionPlan": "Specific steps to execute"
    }
  ],
  "pricingInsights": {
    "summary": "Brief pricing landscape overview",
    "recommendations": ["Pricing recommendation 1", "Pricing recommendation 2"]
  },
  "weeklyFocus": {
    "topPriority": "What to focus on this week",
    "quickWin": "An easy win to pursue immediately",
    "longTermPlay": "Strategic initiative to start planning"
  }
}

Context about Infinity Legal:
- Based in South Africa (Gauteng focus, expanding nationally)
- Practice areas: Labour Law, Family Law, Civil Law, Criminal Law, Property Law
- Subscription model: Labour Shield (R95/mo), Civil Guard (R115/mo), Complete Cover (R130/mo)
- Target market: Middle-income South Africans who can't afford traditional attorney fees
- Competitive advantage: AI-powered intake, subscription-based pricing, virtual consultations
- Competitors: Traditional law firms, legal aid, online legal services like LegalWise, Scorpion Legal Protection

Guidelines:
- Base insights on realistic South African legal market dynamics
- Reference real trends: CCMA case volumes, family court backlogs, property disputes
- Consider economic factors: load shedding litigation, retrenchment waves, cost of living
- Provide specific, actionable recommendations — not generic advice
- Factor in SA-specific channels: community radio, taxi rank advertising, WhatsApp groups, church networks`

export async function POST(request) {
  const { user, error, status } = await requirePermission(request, 'VIEW_ALL_CASES')
  if (error) return NextResponse.json({ error }, { status })

  try {
    const body = await request.json()
    const { currentLeads, currentCases, focusArea } = body

    let userMessage = `Generate a competitive intelligence and lead generation report for Infinity Legal.\n\n`

    if (currentLeads && currentLeads.length > 0) {
      const leadSummary = currentLeads.reduce((acc, l) => {
        acc[l.case_type || 'unknown'] = (acc[l.case_type || 'unknown'] || 0) + 1
        return acc
      }, {})
      userMessage += `Current lead pipeline breakdown: ${JSON.stringify(leadSummary)}\n`
      userMessage += `Total active leads: ${currentLeads.length}\n\n`
    }

    if (currentCases && currentCases.length > 0) {
      const caseSummary = currentCases.reduce((acc, c) => {
        acc[c.case_type || 'unknown'] = (acc[c.case_type || 'unknown'] || 0) + 1
        return acc
      }, {})
      userMessage += `Current case breakdown: ${JSON.stringify(caseSummary)}\n\n`
    }

    if (focusArea) {
      userMessage += `The managing partner wants to focus on: ${focusArea}\n\n`
    }

    userMessage += `Please provide your intelligence report with actionable lead generation strategies.`

    const rawResponse = await aiChat({
      systemPrompt: INTELLIGENCE_PROMPT,
      userMessage,
      temperature: 0.4,
      maxTokens: 3000,
    })

    const intelligence = parseAIJson(rawResponse)
    return NextResponse.json({ intelligence })

  } catch (err) {
    console.error('AI Lead Intelligence error:', err)
    return NextResponse.json({ error: 'Failed to generate intelligence report. Please try again.' }, { status: 500 })
  }
}
