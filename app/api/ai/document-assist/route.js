import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

const LLM_KEY = process.env.EMERGENT_LLM_KEY || process.env.LLM_API_KEY || ''
const LLM_URL = 'https://integrations.emergentagent.com/llm/v1/chat/completions'

/**
 * POST /api/ai/document-assist
 * AI-powered document assistance: draft, review, summarize
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { action, content, documentType, context } = body

    if (!action || !content) {
      return NextResponse.json({ error: 'Action and content required' }, { status: 400 })
    }

    let systemPrompt = ''
    let userPrompt = ''

    switch (action) {
      case 'review':
        systemPrompt = 'You are a senior South African legal document reviewer. Analyze the document for: legal accuracy, completeness, potential risks, missing clauses, and compliance with South African law. Provide specific, actionable feedback.'
        userPrompt = `Review this ${documentType || 'legal'} document:\n\n${content}\n\nProvide:\n1. Summary of key issues\n2. Missing clauses or terms\n3. Risk assessment\n4. Recommended changes\n5. Compliance notes (SA law)`
        break
      case 'draft':
        systemPrompt = 'You are a South African legal document drafting assistant. Generate professional legal documents following SA legal conventions. Include proper formatting, standard legal language, and all necessary clauses.'
        userPrompt = `Draft a ${documentType || 'legal'} document with the following requirements:\n\n${content}\n\nContext: ${context || 'Standard South African legal document'}\n\nInclude all necessary clauses, definitions, and provisions.`
        break
      case 'summarize':
        systemPrompt = 'You are a legal document analyst. Provide clear, concise summaries of legal documents highlighting key terms, obligations, rights, and notable clauses.'
        userPrompt = `Summarize this legal document:\n\n${content}\n\nProvide:\n1. Executive summary (2-3 sentences)\n2. Key terms and conditions\n3. Important dates/deadlines\n4. Rights and obligations of each party\n5. Notable or unusual clauses`
        break
      case 'clause_suggest':
        systemPrompt = 'You are a South African legal clause specialist. Suggest relevant clauses based on the document type and context. Each clause should be complete and ready to insert.'
        userPrompt = `Suggest relevant clauses for this ${documentType || 'legal'} document:\n\n${content}\n\nProvide 3-5 recommended clauses with:\n- Clause title\n- Full clause text\n- Brief explanation of why it should be included`
        break
      default:
        return NextResponse.json({ error: 'Invalid action. Use: review, draft, summarize, clause_suggest' }, { status: 400 })
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
        temperature: 0.3,
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

    return NextResponse.json({ result, action, model: 'gpt-4o-mini' })
  } catch (err) {
    console.error('Document assist error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
