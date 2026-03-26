import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
export const dynamic = 'force-dynamic'

/**
 * POST /api/setup/migrate
 * Runs database migrations for Infinity OS role-aware schema
 * This should be called once by an admin to set up the new tables
 */
export async function POST(request) {
  try {
    const results = []

    // 1. Extend profiles table — add new columns
    // We try each column individually so existing ones don't cause errors
    const profileColumns = [
      { name: 'department', type: 'text', default: null },
      { name: 'bar_number', type: 'text', default: null },
      { name: 'supervisor_id', type: 'uuid', default: null },
      { name: 'hire_date', type: 'date', default: null },
      { name: 'is_active', type: 'boolean', default: true },
    ]

    for (const col of profileColumns) {
      try {
        // Test if column exists by selecting it
        const { error } = await supabaseAdmin.from('profiles').select(col.name).limit(1)
        if (error && error.message.includes(col.name)) {
          // Column doesn't exist — we can't ALTER TABLE via Supabase client
          // We'll document this for manual SQL execution
          results.push({ column: col.name, status: 'needs_manual_sql' })
        } else {
          results.push({ column: col.name, status: 'exists' })
        }
      } catch (e) {
        results.push({ column: col.name, status: 'check_failed', error: e.message })
      }
    }

    // 2. Create leads table
    try {
      const { data: existingLeads } = await supabaseAdmin.from('leads').select('id').limit(1)
      results.push({ table: 'leads', status: 'exists' })
    } catch (e) {
      results.push({ table: 'leads', status: 'needs_creation', note: 'Run SQL migration' })
    }

    // 3. Create privileged_notes table
    try {
      const { data } = await supabaseAdmin.from('privileged_notes').select('id').limit(1)
      results.push({ table: 'privileged_notes', status: 'exists' })
    } catch (e) {
      results.push({ table: 'privileged_notes', status: 'needs_creation' })
    }

    // 4. Create audit_logs table
    try {
      const { data } = await supabaseAdmin.from('audit_logs').select('id').limit(1)
      results.push({ table: 'audit_logs', status: 'exists' })
    } catch (e) {
      results.push({ table: 'audit_logs', status: 'needs_creation' })
    }

    // 5. Check cases table for new columns
    try {
      const { error } = await supabaseAdmin.from('cases').select('lead_attorney_id').limit(1)
      if (error && error.message.includes('lead_attorney_id')) {
        results.push({ column: 'cases.lead_attorney_id', status: 'needs_manual_sql' })
      } else {
        results.push({ column: 'cases.lead_attorney_id', status: 'exists' })
      }
    } catch (e) {
      results.push({ column: 'cases.lead_attorney_id', status: 'check_failed' })
    }

    // 6. Check documents table for workflow columns
    try {
      const { error } = await supabaseAdmin.from('documents').select('workflow_status').limit(1)
      if (error && error.message.includes('workflow_status')) {
        results.push({ column: 'documents.workflow_status', status: 'needs_manual_sql' })
      } else {
        results.push({ column: 'documents.workflow_status', status: 'exists' })
      }
    } catch (e) {
      results.push({ column: 'documents.workflow_status', status: 'check_failed' })
    }

    return NextResponse.json({
      message: 'Migration check complete. Run the SQL migration script in Supabase SQL Editor for any items marked needs_manual_sql or needs_creation.',
      results,
      sqlScript: '/infinity-os-migration.sql',
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Infinity OS Migration API',
    instructions: 'POST to this endpoint to check migration status. Use the SQL script in /infinity-os-migration.sql for DDL changes.',
  })
}
