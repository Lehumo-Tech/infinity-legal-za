import OpenAI from 'openai'

// Shared AI client for the Infinity Legal Platform
// Uses Emergent's LLM proxy with the universal key
const aiClient = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY,
  baseURL: 'https://integrations.emergentagent.com/llm',
})

// Default model — fast and capable
export const DEFAULT_MODEL = 'gemini/gemini-2.5-flash'
// Higher quality model for complex analysis
export const PREMIUM_MODEL = 'openai/gpt-4.1'

/**
 * Send a chat completion request
 */
export async function aiChat({ systemPrompt, userMessage, model = DEFAULT_MODEL, temperature = 0.3, maxTokens = 2000 }) {
  const completion = await aiClient.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature,
    max_tokens: maxTokens,
  })
  return completion.choices[0]?.message?.content || ''
}

/**
 * Parse JSON from AI response — handles markdown code blocks
 */
export function parseAIJson(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim())
    const braceMatch = raw.match(/\{[\s\S]*\}/)
    if (braceMatch) return JSON.parse(braceMatch[0])
    // Try array
    const arrayMatch = raw.match(/\[[\s\S]*\]/)
    if (arrayMatch) return JSON.parse(arrayMatch[0])
    throw new Error('Could not parse AI response as JSON')
  }
}

export default aiClient
