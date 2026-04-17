import { NextResponse } from 'next/server'
import { matchLegislation, recommendPlan } from '@/lib/sa-legislation'
import OpenAI from 'openai'
import { checkHighRisk } from '@/app/api/flagged-matters/route'

const openai = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY,
  baseURL: 'https://integrations.emergentagent.com/llm',
})

const DISCLAIMER = "⚠️ This is general legal information based on South African legislation — not legal advice. No attorney-client relationship is created. Outcomes depend on your specific circumstances. For personalised assistance, join Infinity Legal."

function buildRuleBasedResponse(query, matches, messageCount) {
  if (matches.length === 0) {
    return {
      response: `🔍 **Your Question:** "${query}"\n\nI wasn't able to match your question to a specific South African Act. Could you rephrase your question or provide more detail?\n\nFor example, try asking about:\n• Employment disputes or unfair dismissal\n• Consumer rights or faulty products\n• Rental/landlord disputes\n• Debt or credit problems\n• Traffic offences\n• Domestic violence\n• Child maintenance\n\n${DISCLAIMER}`,
      categories: [],
    }
  }

  let response = `🔍 **Your Question:** "${query}"\n\n`
  const categories = [...new Set(matches.map(m => m.category))]

  // Legislation citations
  response += `📜 **Relevant Legislation:**\n\n`
  for (const match of matches) {
    for (const sec of match.sections.slice(0, 2)) {
      response += `• **${match.act}**, Section ${sec.number} (${match.year})\n`
      response += `  → _"${sec.text.slice(0, 150)}${sec.text.length > 150 ? '...' : ''}"_\n`
      response += `  → **Plain English:** ${sec.plain}\n\n`
    }
  }

  // Practical bullets
  response += `💡 **What This Means For You:**\n\n`
  const topSections = matches.flatMap(m => m.sections.slice(0, 1))
  for (const sec of topSections.slice(0, 3)) {
    const bullet = sec.plain.split('.')[0]
    response += `• ${bullet}.\n`
  }
  response += `\n`

  // CTA after 2 messages
  if (messageCount >= 2) {
    const rec = recommendPlan(categories)
    response += `🚀 **Need Personalised Help?**\n\n`
    response += `For your type of matter, we recommend the **${rec.plan}** (${rec.price}/month):\n`
    response += `✓ Dedicated legal specialist\n`
    response += `✓ Unlimited legal consultations\n`
    response += `✓ 24/7 Legal Contact Centre\n`
    response += `✓ Family plan included\n`
    response += `→ [Select This Plan](/signup)\n\n`
  }

  response += DISCLAIMER

  return { response, categories }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { query, messageCount = 0, history = [] } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide a question.' }, { status: 400 })
    }

    if (query.trim().length > 1000) {
      return NextResponse.json({ error: 'Question too long. Please keep it under 1000 characters.' }, { status: 400 })
    }

    // Step 1: Rule-based keyword matching
    const matches = matchLegislation(query)
    const categories = [...new Set(matches.map(m => m.category))]

    // Step 2: If we have good matches, try LLM enhancement for better plain-language
    let finalResponse
    if (matches.length > 0) {
      try {
        // Build context from cached legislation
        const legislationContext = matches.map(m => 
          m.sections.map(s => `${m.act}, Section ${s.number} (${m.year}): "${s.text}" Plain: ${s.plain}`).join('\n')
        ).join('\n\n')

        const rec = recommendPlan(categories)
        const showCTA = messageCount >= 2

        const systemPrompt = `You are "Ask Infinity", a legal information assistant for Infinity Legal, a South African legal protection company.

STRICT RULES:
1. ONLY provide general legal information based on South African law
2. ALWAYS cite the specific Act, Section number, and year
3. NEVER provide personalised legal advice, case strategy, or document drafting
4. Use the provided legislation cache as your primary source
5. Be empathetic, professional, and clear
6. Write in a structured format using the template below

RESPONSE TEMPLATE:
🔍 **Your Question:** "[the user's question]"

📜 **Relevant Legislation:**
• [Full Act Name], Section [X] ([Year])
  → "[quote from the Act]"
  → **Plain English:** [clear summary]

💡 **What This Means For You:**
• [2-3 practical bullets about what they can do]

${showCTA ? `🚀 **Need Personalised Help?**
For your type of matter, we recommend the **${rec.plan}** (${rec.price}/month):
✓ Dedicated legal specialist
✓ Unlimited legal consultations
✓ 24/7 Legal Contact Centre
✓ Family plan included
→ [Select This Plan](/signup)` : ''}

⚠️ This is general legal information based on South African legislation — not legal advice. No attorney-client relationship is created. Outcomes depend on your specific circumstances. For personalised assistance, join Infinity Legal.

LEGISLATION CACHE:
${legislationContext}`

        const messages = [
          { role: 'system', content: systemPrompt },
        ]

        // Add recent history for context (max 4 messages)
        const recentHistory = history.slice(-4)
        for (const msg of recentHistory) {
          messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content })
        }

        messages.push({ role: 'user', content: query })

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          max_tokens: 800,
          temperature: 0.3,
        })

        finalResponse = completion.choices[0]?.message?.content || buildRuleBasedResponse(query, matches, messageCount).response
      } catch (llmError) {
        console.error('LLM call failed, falling back to rule-based:', llmError.message)
        finalResponse = buildRuleBasedResponse(query, matches, messageCount).response
      }
    } else {
      // No matches — try pure LLM with strict guardrails
      try {
        const rec = recommendPlan(['civil'])
        const showCTA = messageCount >= 2
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: `You are "Ask Infinity", a legal information assistant for Infinity Legal (South Africa).

STRICT RULES:
1. ONLY answer about South African law
2. If the question is NOT about law, politely redirect
3. ALWAYS cite specific SA Acts and Sections where possible
4. NEVER give personalised advice
5. Keep responses structured and concise

${showCTA ? `After answering, add:
🚀 **Need Personalised Help?**
Infinity Legal members get a dedicated legal specialist, unlimited consultations, and 24/7 support from ${rec.price}/month.
→ [View Plans](/pricing)` : ''}

Always end with:
⚠️ This is general legal information — not legal advice. Outcomes depend on specific circumstances.` },
            { role: 'user', content: query },
          ],
          max_tokens: 600,
          temperature: 0.3,
        })

        finalResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your question. Please try rephrasing it."
      } catch (llmError) {
        console.error('LLM fallback failed:', llmError.message)
        finalResponse = buildRuleBasedResponse(query, matches, messageCount).response
      }
    }

    return NextResponse.json({
      response: finalResponse,
      categories,
      matchCount: matches.length,
      messageCount: messageCount + 1,
      highRisk: checkHighRisk(query),
    })
  } catch (error) {
    console.error('Ask Infinity error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Ask Infinity',
    description: 'AI Legal Information Assistant for South African law',
    disclaimer: 'General legal information only — not legal advice.',
    status: 'active',
  })
}
