import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/security'
import { createNotification } from '@/lib/notifications'

export async function POST(request) {
  try {
    // Rate limit: max 5 signups per minute per IP
    const forwarded = request.headers.get('x-forwarded-for') || ''
    const ip = forwarded.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkRateLimit(`signup:${ip}`, 5, 60000)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { email, password, fullName, phone, role } = await request.json()

    // Validate inputs
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create user with Supabase Auth using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        phone: phone,
        role: role
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create profile using admin client (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email: email,
        full_name: fullName,
        phone: phone || null,
        role: role || 'client'
      }])

    if (profileError) {
      console.error('Profile error:', profileError)
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create profile: ' + profileError.message },
        { status: 500 }
      )
    }

    // Send welcome notification
    await createNotification({
      userId: authData.user.id,
      type: 'system',
      title: 'Welcome to Infinity Legal!',
      message: `Hi ${fullName}, welcome to the platform. Start by describing your legal issue using our free AI intake tool.`,
      link: '/intake'
    })

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}
