import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDb } from '@/lib/mongodb'

const ADMIN_EMAIL = 'tsatsi@infinitylegal.org'
const ADMIN_PASSWORD = 'Infinity2026!'
const ADMIN_NAME = 'Tidimalo Tsatsi'
const ADMIN_ROLE = 'managing_director'

export async function POST(request) {
  try {
    const results = { supabase: null, mongodb: null }

    // ═══ 1. SUPABASE AUTH + PROFILE ═══
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL)

      let userId
      if (existingUser) {
        userId = existingUser.id
        // Update password
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: ADMIN_PASSWORD,
          email_confirm: true,
        })
        results.supabase = { status: 'updated', userId, email: ADMIN_EMAIL }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: ADMIN_NAME, role: ADMIN_ROLE },
        })
        if (createError) throw createError
        userId = newUser.user.id
        results.supabase = { status: 'created', userId, email: ADMIN_EMAIL }
      }

      // Upsert profile in Supabase (match actual schema)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: ADMIN_EMAIL,
          full_name: ADMIN_NAME,
          role: ADMIN_ROLE,
          phone: '+27 68 164 0095',
          is_subscription_active: true,
          pocia_consent: true,
        }, { onConflict: 'id' })

      if (profileError) {
        console.warn('Profile upsert warning:', profileError.message)
        results.supabase.profileNote = profileError.message
      } else {
        results.supabase.profile = 'upserted'
      }
    } catch (e) {
      results.supabase = { status: 'error', error: e.message }
    }

    // ═══ 2. MONGODB ADMIN RECORD ═══
    try {
      const db = await getDb()

      // Create/update admin user in MongoDB
      await db.collection('users').updateOne(
        { email: ADMIN_EMAIL },
        {
          $set: {
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            role: ADMIN_ROLE,
            title: 'Managing Director & Founder',
            department: 'Executive',
            phone: '+27 68 164 0095',
            status: 'active',
            permissions: ['all'],
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      )
      results.mongodb = { status: 'ok', collection: 'users' }

      // Also seed some demo data into MongoDB for the portals
      // Seed members
      const members = [
        { email: 'member@demo.com', name: 'Thabo Mbeki', phone: '+27 82 123 4567', plan: 'labour', planName: 'Labour Legal Plan', planPrice: 99, coverageLimit: 82000, status: 'active', joinDate: '2026-01-15' },
        { email: 'nomsa@demo.com', name: 'Nomsa Dlamini', phone: '+27 83 234 5678', plan: 'civil', planName: 'Civil Legal Plan', planPrice: 99, coverageLimit: 82000, status: 'active', joinDate: '2026-02-01' },
        { email: 'peter@demo.com', name: 'Peter Naidoo', phone: '+27 84 345 6789', plan: 'extensive', planName: 'Extensive Plan', planPrice: 139, coverageLimit: 100000, status: 'active', joinDate: '2026-01-20' },
      ]
      for (const m of members) {
        await db.collection('members').updateOne(
          { email: m.email },
          { $set: { ...m, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        )
      }
      results.mongodb.members = members.length

      // Seed staff
      const staff = [
        { email: ADMIN_EMAIL, name: ADMIN_NAME, role: 'admin', title: 'Managing Director & Founder' },
        { email: 'advisor@infinitylegal.org', name: 'Adv. Sarah Johnson', role: 'legal_advisor', title: 'Senior Legal Advisor' },
        { email: 'themba@infinitylegal.org', name: 'Themba Moyo', role: 'legal_advisor', title: 'Legal Advisor' },
      ]
      for (const s of staff) {
        await db.collection('staff').updateOne(
          { email: s.email },
          { $set: { ...s, status: 'active', updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        )
      }
      results.mongodb.staff = staff.length

      // Seed sample requests/matters
      const requests = [
        { id: 'REQ-001', memberEmail: 'member@demo.com', memberName: 'Thabo Mbeki', subject: 'Unfair dismissal consultation', category: 'Labour', status: 'in_progress', priority: 'high', assignedTo: 'advisor@infinitylegal.org', description: 'Terminated without proper hearing process.' },
        { id: 'REQ-002', memberEmail: 'nomsa@demo.com', memberName: 'Nomsa Dlamini', subject: 'Lease deposit dispute', category: 'Civil', status: 'in_progress', priority: 'medium', assignedTo: 'themba@infinitylegal.org', description: 'Landlord refusing to return deposit after lease end.' },
        { id: 'REQ-003', memberEmail: 'member@demo.com', memberName: 'Thabo Mbeki', subject: 'CCMA referral preparation', category: 'Labour', status: 'new', priority: 'high', assignedTo: 'advisor@infinitylegal.org', description: 'Need help preparing CCMA referral documentation.' },
        { id: 'REQ-004', memberEmail: 'peter@demo.com', memberName: 'Peter Naidoo', subject: 'Bail application assistance', category: 'Criminal', status: 'resolved', priority: 'high', assignedTo: 'advisor@infinitylegal.org', description: 'Family member arrested, need bail application.' },
        { id: 'REQ-005', memberEmail: 'nomsa@demo.com', memberName: 'Nomsa Dlamini', subject: 'Consumer complaint — defective goods', category: 'Civil', status: 'new', priority: 'medium', assignedTo: 'themba@infinitylegal.org', description: 'Purchased item defective, store refusing refund.' },
      ]
      for (const r of requests) {
        await db.collection('requests').updateOne(
          { id: r.id },
          { $set: { ...r, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        )
      }
      results.mongodb.requests = requests.length

    } catch (e) {
      results.mongodb = { status: 'error', error: e.message }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account seeded successfully',
      credentials: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        demoPassword: 'demo123',
        note: 'Use Real Login for the full Infinity OS portal, or Demo Mode for member/staff/admin demo portals',
      },
      results,
    })

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
