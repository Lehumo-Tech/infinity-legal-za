/**
 * Infinity Legal ZA - Audit & Analytics Library (PocketBase version)
 * Writes audit logs, consent logs, and analytics to PocketBase collections.
 */

import { createRecord } from '@/lib/pb-client';

export async function createAuditLogPB(params: {
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    return await createRecord('audit_logs', {
      user_id: params.user_id || '',
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id || '',
      details: params.details ? JSON.stringify({ text: params.details }) : '',
      ip_address: params.ip_address || '',
      user_agent: params.user_agent || '',
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}

export async function trackApiEventPB(params: {
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    return await createRecord('api_analytics', {
      endpoint: params.endpoint,
      method: params.method,
      status_code: params.status_code,
      response_time_ms: params.response_time_ms || 0,
      user_id: params.user_id || '',
      ip_address: params.ip_address || '',
    });
  } catch (error) {
    console.error('Failed to track API event:', error);
    return null;
  }
}

export async function logConsentPB(params: {
  user_id?: string;
  consent_type: string;
  purpose: string;
  granted: boolean;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    return await createRecord('consent_logs', {
      user_id: params.user_id || '',
      consent_type: params.consent_type,
      purpose: params.purpose,
      granted: params.granted,
      ip_address: params.ip_address || '',
      user_agent: params.user_agent || '',
    });
  } catch (error) {
    console.error('Failed to log consent:', error);
    return null;
  }
}

export async function logErrorPB(params: {
  error_type: string;
  message: string;
  stack_trace?: string;
  url?: string;
  user_id?: string;
  metadata?: string;
}) {
  try {
    return await createRecord('error_logs', {
      error_type: params.error_type,
      message: params.message,
      stack_trace: params.stack_trace || '',
      url: params.url || '',
      resolved: false,
    });
  } catch (error) {
    console.error('Failed to log error:', error);
    return null;
  }
}
