import { NextResponse } from 'next/server'
import { requireRole, ROLES } from '@/lib/rbac'
import { aiChat, DEFAULT_MODEL } from '@/lib/ai'

export const dynamic = 'force-dynamic'

const RESEARCH_PROMPT = `You are a Senior Legal Research AI for Infinity Legal, a South African law firm. You assist paralegals and attorneys with legal research, case law analysis, and strategy development.

Guidelines:
- Base all research on South African law
- Reference specific Acts, sections, and case law where possible
- For labour law: reference LRA (Act 66 of 1995), BCEA (Act 75 of 1997), EEA (Act 55 of 1998)
- For family law: Divorce Act (Act 70 of 1979), Children's Act (Act 38 of 2005), Maintenance Act (Act 99 of 1998)
- For criminal law: Criminal Procedure Act (Act 51 of 1977), Criminal Law Amendment Act
- For property: ESTA (Act 62 of 1997), PIE Act (Act 19 of 1998)
- For civil: Prescription Act (Act 68 of 1969)
- Reference Constitutional Court and Supreme Court of Appeal precedents
- Structure your response with clear headings
- Include practical strategy recommendations
- Note any prescription periods or deadlines
- Flag any areas where the law is unsettled or recently amended
- Always add a disclaimer that this is AI-generated research and must be verified by a qualified attorney

Format your response in clear, structured Markdown with:
## Heading
### Sub-heading
- Bullet points
**Bold** for emphasis`

export async function POST(request) {
  const { user, error, status } = await requireRole(request, [
    ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL, ROLES.ATTORNEY
  ])
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { query, caseType, context } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Please provide a research query' }, { status: 400 })
    }

    let userMessage = `Legal Research Request:\n\n`
    userMessage += `Query: ${query}\n\n`
    if (caseType) userMessage += `Case Type: ${caseType}\n`
    if (context) userMessage += `Additional Context: ${context}\n`

    const response = await aiChat({
      systemPrompt: RESEARCH_PROMPT,
      userMessage,
      temperature: 0.2,
      maxTokens: 3000,
    })

    return NextResponse.json({ research: response })

  } catch (err) {
    console.error('AI Research error:', err)
    return NextResponse.json({ error: 'Failed to complete research. Please try again.' }, { status: 500 })
  }
}
