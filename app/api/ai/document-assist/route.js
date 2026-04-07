import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { action, content, documentType } = await request.json()
    if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })
    
    // Use the Emergent LLM proxy
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({
      apiKey: process.env.LLM_API_KEY || process.env.EMERGENT_LLM_KEY,
      baseURL: 'https://integrations.emergentagent.com/llm',
    })
    
    const prompts = {
      review: `You are a South African legal document reviewer. Review the following ${documentType} document for legal accuracy, potential risks, missing clauses, and compliance with South African law. Provide specific, actionable feedback.\n\nDocument:\n${content}`,
      draft: `You are a South African legal document drafter. Draft a professional ${documentType} document based on the following requirements. Use proper legal language and comply with South African law.\n\nRequirements:\n${content}`,
      summarize: `You are a legal assistant. Summarize the following ${documentType} document in plain English, highlighting key terms, obligations, rights, and important dates.\n\nDocument:\n${content}`,
      clause_suggest: `You are a South African legal specialist. Based on the following ${documentType} document content, suggest additional clauses that should be included for better legal protection. Explain why each clause is important.\n\nDocument:\n${content}`,
    }
    
    const systemPrompt = prompts[action] || prompts.review
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert South African legal document assistant for Infinity Legal. Provide thorough, professional analysis.' },
        { role: 'user', content: systemPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    })
    
    const result = completion.choices?.[0]?.message?.content || 'No response generated'
    return NextResponse.json({ result })
    
  } catch (error) {
    console.error('AI Document Assist error:', error)
    return NextResponse.json({ 
      result: `AI service temporarily unavailable. Error: ${error.message}. Please try again or contact support.` 
    })
  }
}
