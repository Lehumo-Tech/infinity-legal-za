import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createNotification, createBulkNotifications } from '@/lib/notifications'

// POST /api/applications - Process a full application
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      // Personal details
      title, fullName, idNumber, email, phone, password,
      postalAddress, postalCode, language, communicationPreference,
      // Plan
      selectedPlan,
      // Dependants
      spouse, children,
      // Legal matter
      legalMatterType, legalMatterDescription, legalMatterUrgency, opposingParty,
      // Banking
      accountHolder, bank, accountNumber, branchCode, accountType, debitDate,
      // Consent
      popiaConsent, termsAccepted, digitalSignature
    } = body

    // Validation
    if (!fullName || !email || !password || !idNumber) {
      return NextResponse.json({ error: 'Full name, email, password and ID number are required' }, { status: 400 })
    }
    if (!popiaConsent || !termsAccepted) {
      return NextResponse.json({ error: 'You must accept POPIA consent and Terms & Conditions' }, { status: 400 })
    }
    if (!digitalSignature) {
      return NextResponse.json({ error: 'Digital signature is required' }, { status: 400 })
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'client' }
    })

    if (authError) {
      console.error('Auth error:', authError)
      if (authError.message?.includes('already been registered')) {
        return NextResponse.json({ error: 'An account with this email already exists. Please login instead.' }, { status: 400 })
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const userId = authData.user.id

    // 2. Create/update profile with all personal details
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        phone,
        role: 'client'
      })

    if (profileError) {
      console.error('Profile error:', profileError)
    }

    // 3. Create a case if legal matter details provided
    let caseRecord = null
    if (legalMatterType || legalMatterDescription) {
      const caseNumber = 'INF-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4)
      const { data: caseData, error: caseError } = await supabaseAdmin
        .from('cases')
        .insert([{
          case_number: caseNumber,
          client_id: userId,
          case_type: legalMatterType || 'other',
          case_subtype: legalMatterDescription?.substring(0, 100) || '',
          status: 'intake',
          urgency: legalMatterUrgency || 'medium',
          summary_encrypted: legalMatterDescription || '',
          opposing_party: opposingParty || null
        }])
        .select()
        .single()

      if (caseError) {
        console.error('Case creation error:', caseError)
      } else {
        caseRecord = caseData
      }
    }

    // 4. Store application metadata (banking, dependants, etc.) as notes in the case
    // or in a dedicated storage. For now, we'll store it in the case notes.
    const applicationMeta = {
      personalDetails: { title, idNumber, postalAddress, postalCode, language, communicationPreference },
      selectedPlan,
      dependants: { spouse, children: children?.filter(c => c.fullName) },
      banking: { accountHolder, bank, accountNumber: accountNumber ? '****' + accountNumber.slice(-4) : null, branchCode, accountType, debitDate },
      consent: { popiaConsent, termsAccepted, digitalSignature, consentDate: new Date().toISOString() },
      applicationDate: new Date().toISOString(),
      applicationStatus: 'pending_review'
    }

    // Store in the case's notes_encrypted field
    if (caseRecord) {
      await supabaseAdmin
        .from('cases')
        .update({ notes_encrypted: JSON.stringify(applicationMeta) })
        .eq('id', caseRecord.id)
    }

    // Send notifications
    try {
      // Welcome notification for the new client
      await createNotification({
        userId,
        type: 'system',
        title: 'Welcome to Infinity Legal!',
        message: `Hi ${fullName}, your application has been received and is being reviewed. We'll be in touch shortly.`,
        link: '/dashboard',
        metadata: { applicationStatus: 'pending_review' },
      })

      // Notify intake agents about the new application
      const { data: intakeAgents } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .in('role', ['intake_agent', 'managing_partner'])
        .limit(50)
      if (intakeAgents?.length) {
        await createBulkNotifications(intakeAgents.map(a => ({
          userId: a.id,
          type: 'system',
          title: 'New Application Received',
          message: `${fullName} has submitted a new application${legalMatterType ? ` (${legalMatterType})` : ''}.`,
          link: '/portal/leads',
          metadata: { applicantId: userId, caseId: caseRecord?.id },
        })))
      }
    } catch (notifErr) {
      console.error('Failed to send application notifications:', notifErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      user: { id: userId, email, fullName },
      case: caseRecord ? { id: caseRecord.id, caseNumber: caseRecord.case_number } : null,
      plan: selectedPlan
    }, { status: 201 })

  } catch (error) {
    console.error('Application API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
