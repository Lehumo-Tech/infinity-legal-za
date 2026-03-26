import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requirePermission, createAuditLog, ROLES } from '@/lib/rbac'
import { createNotification } from '@/lib/notifications'
import { sendWelcomeEmail } from '@/lib/brevo'

/**
 * POST /api/auth/staff-signup
 * Create staff accounts (Legal Officers, Paralegals, Intake Agents, etc.)
 * Only Managing Partners and IT Admins can create staff accounts
 */
export async function POST(request) {
  const { user, error, status } = await requirePermission(request, 'MANAGE_USERS')
  if (error) return NextResponse.json({ error }, { status })

  const { email, password, fullName, phone, role, department, barNumber, supervisorId } = await request.json()

  // Validate required fields
  if (!email || !password || !fullName || !role) {
    return NextResponse.json({ error: 'Missing required fields: email, password, fullName, role' }, { status: 400 })
  }

  // Validate role
  const validStaffRoles = ['legal_officer', 'paralegal', 'intake_agent', 'admin', 'it_admin', 'managing_partner']
  if (!validStaffRoles.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${validStaffRoles.join(', ')}` }, { status: 400 })
  }

  // Bar number required for legal officers
  if (role === 'legal_officer' && !barNumber) {
    return NextResponse.json({ error: 'Bar number is required for Legal Officers' }, { status: 400 })
  }

  // Department mapping
  const deptMap = {
    legal_officer: 'legal',
    paralegal: 'legal',
    intake_agent: 'call_center',
    admin: 'operations',
    it_admin: 'it',
    managing_partner: 'executive',
  }

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, role }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile with staff-specific fields
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
        role,
        department: department || deptMap[role] || null,
        bar_number: barNumber || null,
        supervisor_id: supervisorId || null,
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true,
      }])

    if (profileError) {
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create profile: ' + profileError.message }, { status: 500 })
    }

    // Send welcome notification
    const roleLabels = {
      legal_officer: 'Legal Officer',
      paralegal: 'Paralegal',
      intake_agent: 'Intake Specialist',
      admin: 'Administrator',
      it_admin: 'IT Administrator',
      managing_partner: 'Managing Partner',
    }

    await createNotification({
      userId: authData.user.id,
      type: 'system',
      title: `Welcome to Infinity OS!`,
      message: `Hi ${fullName}, you've been onboarded as ${roleLabels[role]}. Access your portal to get started.`,
      link: '/portal',
    })

    // Welcome email
    sendWelcomeEmail(email, fullName).catch(() => {})

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE_STAFF_USER',
      resourceType: 'user',
      resourceId: authData.user.id,
      details: { email, role, department: deptMap[role] },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        role,
        department: deptMap[role],
      }
    }, { status: 201 })

  } catch (err) {
    console.error('Staff signup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
