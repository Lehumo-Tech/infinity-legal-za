import { NextResponse } from 'next/server'

// Mock implementation - will be replaced with real Supabase/OpenAI when keys are added

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// PII Redaction
function redactPII(text) {
  let redacted = text
  // South African ID numbers (13 digits)
  redacted = redacted.replace(/\b\d{13}\b/g, '[ID_REDACTED]')
  // Phone numbers
  redacted = redacted.replace(/\b0\d{9}\b/g, '[PHONE_REDACTED]')
  redacted = redacted.replace(/\b\+27\d{9}\b/g, '[PHONE_REDACTED]')
  // Email addresses
  redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
  return redacted
}

// Emergency keyword detection
function detectUrgency(text) {
  const emergencyKeywords = ['arrested', 'arrest', 'police', 'court tomorrow', 'eviction', 'urgent', 'emergency', 'assault', 'violence', 'threat']
  const lowerText = text.toLowerCase()
  const hasEmergency = emergencyKeywords.some(keyword => lowerText.includes(keyword))
  return hasEmergency ? 'emergency' : 'medium'
}

// Category detection
function detectCategory(text) {
  const lowerText = text.toLowerCase()
  if (lowerText.includes('arrest') || lowerText.includes('criminal') || lowerText.includes('police')) return 'Criminal Law'
  if (lowerText.includes('divorce') || lowerText.includes('custody') || lowerText.includes('maintenance')) return 'Family Law'
  if (lowerText.includes('fired') || lowerText.includes('employer') || lowerText.includes('ccma')) return 'Labour Law'
  if (lowerText.includes('eviction') || lowerText.includes('property') || lowerText.includes('tenant')) return 'Property Law'
  if (lowerText.includes('debt') || lowerText.includes('owe') || lowerText.includes('creditor')) return 'Debt Recovery'
  if (lowerText.includes('contract') || lowerText.includes('business') || lowerText.includes('company')) return 'Commercial Law'
  return 'Civil Litigation'
}

// Rate limiting helper
const rateLimitMap = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const windowMs = 3600000 // 1 hour
  const maxRequests = 100

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  const record = rateLimitMap.get(ip)
  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// ==============================================
// API ROUTES
// ==============================================

export async function POST(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api', '')

  // Security: Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    // Route: AI Intake Analysis
    if (path === '/intake/analyze') {
      const { responses, isUrgent } = await request.json()
      
      // Combine all responses
      const fullText = Object.values(responses).join(' ')
      
      // Security: Redact PII before processing
      const redactedText = redactPII(fullText)
      
      // Detect urgency and category
      const urgency = isUrgent ? 'emergency' : detectUrgency(fullText)
      const category = detectCategory(fullText)
      
      // Mock AI Analysis (will be replaced with OpenAI)
      const aiAnalysis = {
        caseId: 'CASE-' + Date.now(),
        category: category,
        urgency: urgency,
        summary: `Based on your description, this appears to be a ${category.toLowerCase()} matter. ${urgency === 'emergency' ? 'This case has been marked as urgent and will be prioritized.' : 'We recommend consulting with a specialist attorney.'}`,
        nextSteps: [
          'Gather all relevant documents (contracts, emails, notices)',
          'Document timeline of events with specific dates',
          'Consult with a verified attorney from our network',
          urgency === 'emergency' ? 'Seek immediate legal representation - time-sensitive matter' : 'Schedule a consultation within 7 days'
        ],
        estimatedCost: category === 'Criminal Law' ? 'R15,000 - R50,000' : category === 'Family Law' ? 'R10,000 - R35,000' : 'R5,000 - R25,000',
        confidence: 85,
        redactedInput: redactedText
      }
      
      // TODO: Save to Supabase when keys are added
      // await supabase.from('cases').insert({ ... })
      
      return NextResponse.json(aiAnalysis)
    }

    // Route: Get Attorneys
    if (path === '/attorneys/browse' && request.method === 'GET') {
      // Mock attorney data
      const mockAttorneys = [
        {
          id: '1',
          name: 'Adv. Thabo Mokwena',
          specializations: ['Criminal Law', 'Civil Litigation'],
          yearsExperience: 12,
          hourlyRate: 1500,
          rating: 4.8,
          verified: true,
          bio: 'Experienced criminal defense attorney with focus on serious crimes.'
        },
        {
          id: '2',
          name: 'Sarah van der Berg',
          specializations: ['Family Law', 'Divorce'],
          yearsExperience: 8,
          hourlyRate: 1200,
          rating: 4.9,
          verified: true,
          bio: 'Compassionate family law specialist. Over 200 successful divorce cases.'
        },
        {
          id: '3',
          name: 'Peter Naidoo',
          specializations: ['Labour Law', 'CCMA'],
          yearsExperience: 15,
          hourlyRate: 1800,
          rating: 4.7,
          verified: true,
          bio: 'Labour law expert with extensive CCMA experience.'
        }
      ]
      
      return NextResponse.json({ attorneys: mockAttorneys })
    }

    // Route: Attorney Signup
    if (path === '/attorney/signup') {
      const data = await request.json()
      
      // Validate LPC number format (SA format: typically 7 digits)
      if (!data.lpcNumber || !/^\d{7}$/.test(data.lpcNumber)) {
        return NextResponse.json(
          { error: 'Invalid LPC number format. Must be 7 digits.' },
          { status: 400 }
        )
      }
      
      // Mock response - will save to Supabase
      return NextResponse.json({
        success: true,
        message: 'Application submitted. We will verify your LPC number within 24 hours.',
        attorneyId: 'ATT-' + Date.now()
      })
    }

    // Route: PayFast Payment
    if (path === '/payment/create') {
      const { caseId, amount, type } = await request.json()
      
      // Mock PayFast integration
      const paymentId = 'PAY-' + Date.now()
      
      return NextResponse.json({
        paymentId: paymentId,
        paymentUrl: `/payment/mock?id=${paymentId}`,
        message: 'Payment integration ready. Add PayFast credentials to .env to enable real payments.'
      })
    }

    // Route: PayFast ITN (Instant Transaction Notification)
    if (path === '/payment/itn') {
      // This endpoint will validate PayFast signature
      const data = await request.json()
      
      // TODO: Implement signature validation
      // const signature = generateSignature(data, process.env.PAYFAST_PASSPHRASE)
      
      return NextResponse.json({ received: true })
    }

    // Route: Get User Cases
    if (path === '/cases/my-cases' && request.method === 'GET') {
      // Mock user cases
      return NextResponse.json({
        cases: [
          {
            id: 'CASE-123',
            title: 'Unfair Dismissal',
            category: 'Labour Law',
            status: 'matched',
            createdAt: new Date().toISOString(),
            attorney: 'Peter Naidoo'
          }
        ]
      })
    }

    // Route: Contact Attorney
    if (path === '/attorney/contact') {
      const { attorneyId, caseId, message } = await request.json()
      
      // TODO: Send notification to attorney
      
      return NextResponse.json({
        success: true,
        message: 'Your message has been sent to the attorney.'
      })
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    
    // TODO: Log to Sentry when configured
    // Sentry.captureException(error)
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api', '')

  try {
    // Route: Health check
    if (path === '/health') {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          api: 'running',
          supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not_configured',
          openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
          payfast: process.env.PAYFAST_MERCHANT_ID ? 'configured' : 'not_configured',
          sentry: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'not_configured'
        }
      })
    }

    // Route: Get attorneys
    if (path === '/attorneys/browse') {
      const mockAttorneys = [
        {
          id: '1',
          name: 'Adv. Thabo Mokwena',
          specializations: ['Criminal Law', 'Civil Litigation'],
          yearsExperience: 12,
          hourlyRate: 1500,
          rating: 4.8,
          verified: true,
          bio: 'Experienced criminal defense attorney with focus on serious crimes.'
        },
        {
          id: '2',
          name: 'Sarah van der Berg',
          specializations: ['Family Law', 'Divorce'],
          yearsExperience: 8,
          hourlyRate: 1200,
          rating: 4.9,
          verified: true,
          bio: 'Compassionate family law specialist. Over 200 successful divorce cases.'
        },
        {
          id: '3',
          name: 'Peter Naidoo',
          specializations: ['Labour Law', 'CCMA'],
          yearsExperience: 15,
          hourlyRate: 1800,
          rating: 4.7,
          verified: true,
          bio: 'Labour law expert with extensive CCMA experience.'
        }
      ]
      
      return NextResponse.json({ attorneys: mockAttorneys })
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}