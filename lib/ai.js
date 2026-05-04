import OpenAI from 'openai'

// Shared AI client for the Infinity Legal Platform
// Uses free Hugging Face Inference API as primary, with Emergent as backup

let hfClient = null
let emergentClient = null
let hfAvailable = true

function getHFClient() {
  if (!hfClient) {
    hfClient = new OpenAI({
      apiKey: process.env.HUGGINGFACE_API_KEY || 'dummy-key',
      baseURL: 'https://api-inference.huggingface.co/models',
    })
  }
  return hfClient
}

function getEmergentClient() {
  if (!emergentClient) {
    emergentClient = new OpenAI({
      apiKey: process.env.EMERGENT_LLM_KEY || 'dummy-key',
      baseURL: 'https://integrations.emergentagent.com/llm',
    })
  }
  return emergentClient
}

// Default model — using free Hugging Face models
export const DEFAULT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2'
// Higher quality model for complex analysis
export const PREMIUM_MODEL = 'mixtral/Mixtral-8x7B-Instruct-v0.1'

/**
 * Send a chat completion request with fallback
 */
export async function aiChat({ systemPrompt, userMessage, model = DEFAULT_MODEL, temperature = 0.3, maxTokens = 2000 }) {
  if (!process.env.HUGGINGFACE_API_KEY && !process.env.EMERGENT_LLM_KEY) {
    return JSON.stringify({ error: 'AI service not configured', mock: true })
  }

  // Try Hugging Face first (free!)
  if (process.env.HUGGINGFACE_API_KEY && hfAvailable) {
    try {
      const client = getHFClient()
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
      })
      return completion.choices[0]?.message?.content || ''
    } catch (hfError) {
      console.warn('Hugging Face failed, trying Emergent:', hfError.message)
      hfAvailable = false
    }
  }

  // Fallback to Emergent
  if (process.env.EMERGENT_LLM_KEY) {
    try {
      const client = getEmergentClient()
      const completion = await client.chat.completions.create({
        model: 'gemini/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
      })
      return completion.choices[0]?.message?.content || ''
    } catch (emError) {
      throw new Error('All AI providers failed: ' + emError.message)
    }
  }

  throw new Error('No AI provider configured')
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

export default getHFClient
