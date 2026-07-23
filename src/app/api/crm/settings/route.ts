/**
 * GET  /api/crm/settings - List all system settings (seeded from defaults on first call)
 * PATCH /api/crm/settings - Update a setting value by id
 *
 * Backed by the SystemSetting Prisma model. On first GET, any missing
 * default settings are inserted so the UI always shows the full set.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Seed defaults — inserted into the DB on first access if missing.
// Each entry: { key, value, type, description }
const SEED_DEFAULTS: Array<{ key: string; value: string; type: string; description: string }> = [
  {
    key: 'firm_name',
    value: 'Infinity Legal (Pty) Ltd',
    type: 'string',
    description: 'The legal name of the firm displayed across the platform',
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    type: 'boolean',
    description: 'Enable maintenance mode to prevent user access during updates',
  },
  {
    key: 'max_free_consultations',
    value: '3',
    type: 'number',
    description: 'Maximum free consultations allowed per client before subscription is required',
  },
  {
    key: 'auto_assign_leads',
    value: 'true',
    type: 'boolean',
    description: 'Automatically assign new leads to available legal advisors based on workload',
  },
  {
    key: 'lead_scoring_enabled',
    value: 'true',
    type: 'boolean',
    description: 'Enable AI-powered lead scoring to prioritize high-value leads',
  },
  {
    key: 'email_notifications',
    value: 'true',
    type: 'boolean',
    description: 'Send email notifications for important events (case updates, deadlines, etc.)',
  },
  {
    key: 'trial_period_days',
    value: '14',
    type: 'number',
    description: 'Number of days for the free trial period for new subscriptions',
  },
  {
    key: 'popia_consent_required',
    value: 'true',
    type: 'boolean',
    description: 'Require POPIA consent before collecting personal information',
  },
  {
    key: 'default_currency',
    value: 'ZAR',
    type: 'string',
    description: 'Default currency for billing and pricing display',
  },
  {
    key: 'session_timeout_minutes',
    value: '30',
    type: 'number',
    description: 'Minutes of inactivity before user session expires',
  },
];

const ADMIN_ROLES = ['managing_director', 'systems_admin'];

async function ensureSeeded() {
  // Upsert each default — insert if the key is missing, leave existing values alone
  await Promise.all(
    SEED_DEFAULTS.map((d) =>
      db.systemSetting.upsert({
        where: { key: d.key },
        update: {},
        create: { key: d.key, value: d.value, type: d.type, description: d.description },
      }),
    ),
  );
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!ADMIN_ROLES.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    await ensureSeeded();

    const settings = await db.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return apiResponse(settings);
  } catch (error) {
    console.error('CRM settings error:', error);
    return apiError('Failed to load settings', 500, 'SETTINGS_FETCH_ERROR');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!ADMIN_ROLES.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    const body = await request.json();
    const { id, value } = body;

    if (!id || value === undefined || value === null) {
      return apiError('id and value are required', 400, 'MISSING_FIELDS');
    }

    const existing = await db.systemSetting.findUnique({ where: { id } });
    if (!existing) {
      return apiError('Setting not found', 404, 'SETTING_NOT_FOUND');
    }

    const updated = await db.systemSetting.update({
      where: { id },
      data: {
        value: String(value),
        updated_by: auth.user.userId,
      },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_SYSTEM_SETTING',
      resource_type: 'system_setting',
      resource_id: id,
      details: { key: existing.key, old_value: existing.value, new_value: String(value) },
    });

    return apiResponse(updated);
  } catch (error) {
    console.error('CRM settings update error:', error);
    return apiError('Failed to save setting', 500, 'SETTINGS_ERROR');
  }
}
