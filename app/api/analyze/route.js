import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// POST /api/analyze — Free-tier AI legal analysis (mock response to save LLM costs)
export async function POST(request) {
  try {
    const body = await request.json()
    const { description, category, location } = body

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: 'Please provide a description of at least 10 characters.' }, { status: 400 })
    }

    // Determine legal category
    const normalizedCategory = (category || 'General').toLowerCase()
    let legalArea = 'Civil Law'
    let suggestedPlan = 'Civil Legal Plan'
    let relevantLegislation = []
    let nextSteps = []
    let urgency = 'medium'

    if (normalizedCategory.includes('labour') || normalizedCategory.includes('employment') || normalizedCategory.includes('dismissal') || normalizedCategory.includes('ccma')) {
      legalArea = 'Labour Law'
      suggestedPlan = 'Labour Legal Plan'
      relevantLegislation = [
        'Labour Relations Act 66 of 1995',
        'Basic Conditions of Employment Act 75 of 1997',
        'Employment Equity Act 55 of 1998',
      ]
      nextSteps = [
        'Document all communications with your employer',
        'Gather your employment contract and payslips',
        'Note the date of the incident or dismissal',
        'Do not sign any documents without legal advice',
        'Consider referral to the CCMA within 30 days if dismissed',
      ]
      urgency = 'high'
    } else if (normalizedCategory.includes('criminal')) {
      legalArea = 'Criminal Law'
      suggestedPlan = 'Extensive Legal Plan'
      relevantLegislation = [
        'Criminal Procedure Act 51 of 1977',
        'Constitution of the Republic of South Africa, 1996 (Section 35)',
      ]
      nextSteps = [
        'Exercise your right to remain silent',
        'Do not make any statements without a legal advisor present',
        'Gather any evidence or witness details that may support your case',
        'Request a copy of the charge sheet if arrested',
        'Contact a legal advisor immediately',
      ]
      urgency = 'emergency'
    } else if (normalizedCategory.includes('family') || normalizedCategory.includes('divorce') || normalizedCategory.includes('custody')) {
      legalArea = 'Family Law'
      suggestedPlan = 'Civil Legal Plan'
      relevantLegislation = [
        'Divorce Act 70 of 1979',
        'Children\'s Act 38 of 2005',
        'Maintenance Act 99 of 1998',
      ]
      nextSteps = [
        'Gather marriage certificates and prenuptial agreements',
        'Document all assets and liabilities',
        'Keep records of maintenance payments if applicable',
        'Consider mediation as a first step',
        'Consult a legal advisor before making any agreements',
      ]
    } else if (normalizedCategory.includes('property') || normalizedCategory.includes('landlord') || normalizedCategory.includes('tenant') || normalizedCategory.includes('eviction')) {
      legalArea = 'Property Law'
      suggestedPlan = 'Civil Legal Plan'
      relevantLegislation = [
        'Rental Housing Act 50 of 1999',
        'Prevention of Illegal Eviction (PIE) Act 19 of 1998',
        'Consumer Protection Act 68 of 2008',
      ]
      nextSteps = [
        'Review your lease agreement carefully',
        'Document any breach of contract with photos/screenshots',
        'Keep records of all payments and correspondence',
        'Contact the Rental Housing Tribunal if applicable',
        'Seek legal advice before vacating or taking action',
      ]
    } else if (normalizedCategory.includes('consumer') || normalizedCategory.includes('debt') || normalizedCategory.includes('credit')) {
      legalArea = 'Consumer Law'
      suggestedPlan = 'Civil Legal Plan'
      relevantLegislation = [
        'Consumer Protection Act 68 of 2008',
        'National Credit Act 34 of 2005',
      ]
      nextSteps = [
        'Keep all receipts and proof of purchase',
        'Document your complaint in writing',
        'Contact the supplier in writing first',
        'Lodge a complaint with the National Consumer Commission if unresolved',
        'Seek legal advice for debt review if over-indebted',
      ]
    } else {
      // General / Civil
      relevantLegislation = [
        'Constitution of the Republic of South Africa, 1996',
        'Promotion of Access to Information Act 2 of 2000',
      ]
      nextSteps = [
        'Document all relevant facts and dates',
        'Gather supporting evidence (contracts, correspondence, receipts)',
        'Consider whether alternative dispute resolution is appropriate',
        'Consult a qualified legal advisor for personalised advice',
        'Note any deadlines or prescription periods that may apply',
      ]
    }

    const response = {
      success: true,
      analysis: {
        legalArea,
        category: normalizedCategory !== 'general' ? category : legalArea,
        urgency,
        summary: `Based on your description, this matter falls under ${legalArea} in South Africa. ${location ? `Location noted: ${location}.` : ''} We recommend consulting with a qualified legal advisor for personalised guidance.`,
        relevantLegislation,
        nextSteps,
        suggestedPlan,
        estimatedTimeline: urgency === 'emergency' ? '1-7 days (urgent)' : urgency === 'high' ? '2-4 weeks' : '4-8 weeks',
        confidenceScore: 0.82,
      },
      disclaimer: 'This analysis is generated by AI and is for informational purposes only. It does not constitute legal advice. Infinity Legal (Pty) Ltd — CIPC Registration Pending. For formal legal advice, please consult a qualified legal practitioner. This free-tier analysis is provided as part of our pre-launch service.',
      freeTier: true,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Failed to process analysis. Please try again.' }, { status: 500 })
  }
}
