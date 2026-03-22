import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

// Initialize the OpenAI-compatible client pointing to Emergent's proxy
const client = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY,
  baseURL: 'https://integrations.emergentagent.com/llm',
})

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

const SYSTEM_PROMPT = `You are an expert South African legal assistant for the Infinity Legal Platform. Your role is to analyze a client's legal situation and provide structured guidance.

You MUST respond ONLY with valid JSON (no markdown, no code blocks, no extra text). The JSON must follow this exact schema:

{
  "category": "One of: Criminal Law, Family Law, Labour Law, Personal Injury, Property Law, Debt Recovery, Civil Litigation, Commercial Law, Administrative Law, Other",
  "subcategory": "A more specific sub-category, e.g., 'Unfair Dismissal', 'Bail Application', 'Divorce', 'Motor Vehicle Accident'",
  "summary": "A concise 2-3 sentence summary of the legal issue. IMPORTANT: Remove or redact any personally identifiable information (PII) such as names, ID numbers, addresses, phone numbers, or email addresses. Replace them with [REDACTED].",
  "urgency": "One of: low, medium, high, emergency",
  "nextSteps": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "relevantLegislation": ["Name of relevant South African Act or law 1", "Name 2"],
  "estimatedCostRange": "A realistic cost range in South African Rand, e.g., 'R5,000 - R15,000'",
  "estimatedTimeline": "Expected duration, e.g., '2-4 weeks', '3-6 months'",
  "confidence": 85,
  "warnings": ["Any critical warnings or time-sensitive deadlines the client should know about"],
  "ppiCompliance": "A brief note about POPIA data handling"
}

Guidelines:
- Base your analysis on South African law and legal procedures.
- For Criminal Law cases, mention relevant sections of the Criminal Procedure Act 51 of 1977.
- For Family Law, reference the Divorce Act 70 of 1979, Children's Act 38 of 2005, or Maintenance Act 99 of 1998 as appropriate.
- For Labour Law, reference the Labour Relations Act 66 of 1995 or Basic Conditions of Employment Act 75 of 1997.
- Always recommend consulting with a qualified attorney.
- The confidence score should reflect how clear the legal situation is based on the information provided (0-100).
- If the matter involves domestic violence, child abuse, or imminent danger, set urgency to "emergency".
- Cost estimates should be realistic for the South African market.
- ALWAYS redact PII in the summary.`

export async function POST(request) {
  try {
    const body = await request.json()
    const { responses, isUrgent, selectedCategory } = body

    if (!responses || !responses.problem) {
      return NextResponse.json(
        { error: 'Please describe your legal problem' },
        { status: 400 }
      )
    }

    // Build the user message
    let userMessage = `Please analyze the following legal situation from a South African client:\n\n`
    userMessage += `**Legal Problem:**\n${responses.problem}\n\n`
    
    if (responses.timeline) {
      userMessage += `**Timeline/When it happened:**\n${responses.timeline}\n\n`
    }
    if (responses.outcome) {
      userMessage += `**Desired Outcome:**\n${responses.outcome}\n\n`
    }
    if (responses.parties) {
      userMessage += `**Parties Involved:**\n${responses.parties}\n\n`
    }
    if (responses.documents) {
      userMessage += `**Documents/Evidence Available:**\n${responses.documents}\n\n`
    }
    if (selectedCategory) {
      userMessage += `**Client-selected category:** ${selectedCategory}\n\n`
    }
    if (isUrgent) {
      userMessage += `**NOTE: The client has indicated this is an URGENT/EMERGENCY matter.**\n\n`
    }

    userMessage += `Please provide your analysis in the required JSON format.`

    // Call Gemini via Emergent proxy
    const completion = await client.chat.completions.create({
      model: 'gemini/gemini-2.5-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
    })

    const rawResponse = completion.choices[0]?.message?.content || ''
    
    // Parse the JSON response
    let analysis
    try {
      // Try direct parse first
      analysis = JSON.parse(rawResponse)
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1].trim())
      } else {
        // Try to find JSON object in the response
        const braceMatch = rawResponse.match(/\{[\s\S]*\}/)
        if (braceMatch) {
          analysis = JSON.parse(braceMatch[0])
        } else {
          throw new Error('Could not parse AI response as JSON')
        }
      }
    }

    // Override urgency if client flagged as urgent
    if (isUrgent && analysis.urgency !== 'emergency') {
      analysis.urgency = 'high'
    }

    // Map category to case_type for database
    const categoryToCaseType = {
      'Criminal Law': 'criminal',
      'Family Law': 'family',
      'Labour Law': 'civil',
      'Personal Injury': 'civil',
      'Property Law': 'civil',
      'Debt Recovery': 'civil',
      'Civil Litigation': 'civil',
      'Commercial Law': 'civil',
      'Administrative Law': 'civil',
      'Other': 'other'
    }

    // Try to save as a case if user is authenticated
    let caseId = null
    const user = await getUserFromRequest(request)
    
    if (user) {
      try {
        const caseNumber = 'INF-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4)
        const caseType = categoryToCaseType[analysis.category] || 'other'
        
        const { data: caseData, error: caseError } = await supabaseAdmin
          .from('cases')
          .insert([{
            case_number: caseNumber,
            client_id: user.id,
            case_type: caseType,
            case_subtype: analysis.subcategory || analysis.category,
            status: 'intake',
            urgency: analysis.urgency || 'medium',
            summary_encrypted: analysis.summary || ''
          }])
          .select()
          .single()

        if (!caseError && caseData) {
          caseId = caseData.id
        }
      } catch (e) {
        console.error('Failed to save case from intake:', e)
      }
    }

    return NextResponse.json({
      ...analysis,
      caseId,
      savedToAccount: !!caseId
    })

  } catch (error) {
    console.error('Intake analyze error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze your legal situation. Please try again.' },
      { status: 500 }
    )
  }
}
