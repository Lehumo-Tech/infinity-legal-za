import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/rbac'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

const LLM_KEY = process.env.EMERGENT_LLM_KEY || process.env.LLM_API_KEY || ''
const LLM_URL = 'https://integrations.emergentagent.com/llm/v1/chat/completions'

/**
 * POST /api/ai/case-insights
 * AI-powered case analysis: strategy suggestions, risk assessment, research
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { action, caseData, query } = body

    if (!action) return NextResponse.json({ error: 'Action required' }, { status: 400 })

    let systemPrompt = ''
    let userPrompt = ''

    // Try to find related precedents from knowledge base
    let precedents = []
    try {
      const db = await getDb()
      if (caseData?.case_type) {
        precedents = await db.collection('knowledge_base')
          .find({ relatedCaseTypes: caseData.case_type, isActive: true })
          .limit(5)
          .toArray()
      }
    } catch { /* ignore */ }

    const precedentContext = precedents.length > 0
      ? `\n\nRelated precedents from firm knowledge base:\n${precedents.map(p => `- ${p.title}: ${p.summary}`).join('\n')}`
      : ''

    switch (action) {
      case 'strategy':
        systemPrompt = 'You are a senior South African legal strategist. Provide detailed case strategy recommendations based on SA law, including procedural steps, likely outcomes, and risk factors.'
        userPrompt = `Analyze this case and provide strategy recommendations:\n\nCase Type: ${caseData?.case_type || 'Unknown'}\nStatus: ${caseData?.status || 'Unknown'}\nDetails: ${caseData?.description || query || 'No details provided'}${precedentContext}\n\nProvide:\n1. Recommended legal strategy\n2. Key procedural steps\n3. Potential challenges\n4. Estimated timeline\n5. Success probability assessment`
        break
      case 'risk_assessment':
        systemPrompt = 'You are a legal risk assessment specialist for South African law. Evaluate cases for potential risks, liabilities, and areas of concern.'
        userPrompt = `Assess risks for this case:\n\nCase Type: ${caseData?.case_type || 'Unknown'}\nDetails: ${caseData?.description || query || 'No details provided'}${precedentContext}\n\nProvide:\n1. Risk level (High/Medium/Low)\n2. Key risk factors\n3. Mitigation strategies\n4. Potential financial exposure\n5. Recommended protective measures`
        break
      case 'research':
        systemPrompt = 'You are a South African legal researcher. Provide relevant case law, statutes, and legal principles applicable to the query.'
        userPrompt = `Research the following legal question under South African law:\n\n${query || caseData?.description || 'No query provided'}\n\nCase type: ${caseData?.case_type || 'General'}${precedentContext}\n\nProvide:\n1. Applicable legislation\n2. Relevant case law (SA courts)\n3. Key legal principles\n4. Practical application\n5. Recent developments`
        break
      case 'timeline':
        systemPrompt = 'You are a South African legal procedure specialist. Generate realistic case timelines based on court procedures and statutory deadlines.'
        userPrompt = `Generate a case timeline for:\n\nCase Type: ${caseData?.case_type || 'Unknown'}\nCourt: ${caseData?.court || 'To be determined'}\nCurrent Status: ${caseData?.status || 'New'}\n\nProvide a detailed timeline with:\n1. Immediate next steps (1-2 weeks)\n2. Short-term milestones (1-3 months)\n3. Medium-term milestones (3-12 months)\n4. Key statutory deadlines\n5. Estimated total duration`
        break
      default:
        return NextResponse.json({ error: 'Invalid action. Use: strategy, risk_assessment, research, timeline' }, { status: 400 })
    }

    if (!LLM_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const llmRes = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    })

    if (!llmRes.ok) {
      const err = await llmRes.text()
      console.error('LLM error:', err)
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const llmData = await llmRes.json()
    const result = llmData.choices?.[0]?.message?.content || 'No response generated'

    return NextResponse.json({ result, action, model: 'gpt-4o-mini', precedentsUsed: precedents.length })
  } catch (err) {
    console.error('Case insights error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
