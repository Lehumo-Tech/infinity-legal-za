import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/security'
import { sendWelcomeEmail } from '@/lib/brevo'
import { validateSAIdLocal } from '@/lib/sa-id-validation-client'
import { notifyAttorneyVerified } from '@/lib/telegram-service'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    // Rate limit
    const forwarded = request.headers.get('x-forwarded-for') || ''
    const ip = forwarded.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkRateLimit(`attorney-signup:${ip}`, 3, 60000)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      fullName, email, password, phone,
      lpcNumber, saIdNumber, firmName,
      specializations, yearsExperience, hourlyRate, bio,
      trustAccountBank, trustAccountNumber, trustAccountHolder
    } = body

    // Validate required fields
    if (!email || !password || !fullName || !lpcNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate LPC number (7 digits)
    if (!/^\d{7}$/.test(lpcNumber)) {
      return NextResponse.json(
        { error: 'LPC number must be exactly 7 digits' },
        { status: 400 }
      )
    }

    // Validate SA ID number if provided
    let idValidation = null
    if (saIdNumber) {
      idValidation = validateSAIdLocal(saIdNumber)
      if (!idValidation.valid) {
        return NextResponse.json(
          { error: `SA ID validation failed: ${idValidation.reason}` },
          { status: 400 }
        )
      }
      if (!idValidation.isAdult) {
        return NextResponse.json(
          { error: 'Attorney must be 18 years or older' },
          { status: 400 }
        )
      }
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone,
        role: 'attorney'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
        role: 'attorney'
      }])

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create profile: ' + profileError.message },
        { status: 500 }
      )
    }

    // Create attorney record
    const { error: attorneyError } = await supabaseAdmin
      .from('attorneys')
      .insert([{
        id: authData.user.id,
        lpc_number: lpcNumber,
        status: 'unverified',
        specializations: specializations || [],
        years_experience: parseInt(yearsExperience) || 0,
        location: firmName || '',
        bio: bio || '',
        trust_account_bank: trustAccountBank || '',
        trust_account_number: trustAccountNumber || '',
        trust_account_branch: trustAccountHolder || ''
      }])

    if (attorneyError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create attorney record: ' + attorneyError.message },
        { status: 500 }
      )
    }

    // Send welcome email (async)
    sendWelcomeEmail(email, fullName).catch(err => {
      console.error('Welcome email failed:', err.message)
    })

    // Send Telegram notification about new attorney signup
    notifyAttorneyVerified(fullName, email).catch(err => {
      console.error('Telegram notification failed:', err.message)
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'attorney',
        status: 'unverified'
      },
      idValidation: idValidation ? {
        dateOfBirth: idValidation.dateOfBirth,
        gender: idValidation.gender,
        citizenship: idValidation.citizenship
      } : null
    })

  } catch (error) {
    console.error('Attorney signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}
