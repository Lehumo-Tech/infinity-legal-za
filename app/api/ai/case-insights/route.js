import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/rbac'
import { getDb } from '@/lib/mongodb'
import { aiChat } from '@/lib/ai'
export const dynamic = 'force-dynamic'

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
        systemPrompt = `You are a Senior Legal Strategist for Infinity Legal (South Africa). Provide actionable case strategy. Base advice on SA law.${precedentContext}`
        userPrompt = `Case: ${JSON.stringify(caseData, null, 2)}`
        break
      case 'risk':
        systemPrompt = `You are a Legal Risk Assessment AI. Analyze this case for risks, weaknesses, and exposure. Be objective.${precedentContext}`
        userPrompt = `Case: ${JSON.stringify(caseData, null, 2)}`
        break
      case 'research':
        systemPrompt = `You are a Legal Researcher. Find relevant SA case law, Acts, and precedents.${precedentContext}`
        userPrompt = query || `Research this case: ${JSON.stringify(caseData, null, 2)}`
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // Use free Hugging Face model via aiChat
    const response = await aiChat({
      systemPrompt,
      userMessage: userPrompt,
      model: 'mistralai/Mistral-7B-Instruct-v0.2', // Free model
      maxTokens: 1500,
    })
    
    return NextResponse.json({
      success: true,
      action,
      insights: response,
      precedents: precedents.map(p => ({ title: p.title, summary: p.summary })),
      model: 'mistral-7b-instruct',
      provider: 'huggingface',
    })
    
  } catch (error) {
    console.error('Case insights error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
