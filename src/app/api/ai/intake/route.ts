/**
 * AI Intake API - POST /api/ai/intake
 * Free AI-powered legal intake form for Infinity Legal SA
 *
 * Visitors describe their legal matter, the AI analyzes it
 * and returns a structured assessment.
 *
 * GET /api/ai/intake - Staff review of intake submissions (requires auth)
 */

import { NextRequest } from 'next/server';
import { analyzeIntake } from '@/lib/llm-service';
import { db } from '@/lib/db';
import { apiResponse, apiError, checkRateLimit, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { authRateLimiter, isValidEmail, sanitizeString } from '@/lib/security';
import { isStaff, type RoleKey } from '@/lib/auth';
import { randomBytes } from 'crypto';

// ============================================
// HELPERS
// ============================================

function generateReferenceId(): string {
  const prefix = 'ILS'; // Infinity Legal Submission
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const VALID_CASE_TYPES = [
  'family_law',
  'criminal_defence',
  'civil_litigation',
  'conveyancing',
  'estate_planning',
  'corporate_commercial',
  'debt_collection',
  'immigration',
  'labour_law',
  'personal_injury',
  'other',
] as const;

const VALID_URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

// Map display names to internal case type values
const CASE_TYPE_MAP: Record<string, string> = {
  'Family Law': 'family_law',
  'Criminal Defence': 'criminal_defence',
  'Civil Litigation': 'civil_litigation',
  'Conveyancing': 'conveyancing',
  'Estate Planning': 'estate_planning',
  'Corporate Commercial': 'corporate_commercial',
  'Labour Law': 'labour_law',
  'Debt Collection': 'debt_collection',
  'Immigration': 'immigration',
  'Personal Injury': 'personal_injury',
  'Other': 'other',
};

// ============================================
// POST HANDLER - Submit intake with AI analysis
// ============================================

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    // Rate limiting
    const rateResult = await checkRateLimit(request, authRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many requests. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { name, email, phone, caseType, description, urgency, consent_given, popia_consent } = body;

    // ---- Validation ----
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return apiError('Full name is required (at least 2 characters)', 400, 'INVALID_NAME');
    }

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return apiError('A valid email address is required', 400, 'INVALID_EMAIL');
    }

    // Normalize case type (accept display names or snake_case)
    const normalizedCaseType = CASE_TYPE_MAP[caseType] || (VALID_CASE_TYPES.includes(caseType) ? caseType : null);
    if (!normalizedCaseType) {
      return apiError(`Case type must be one of: ${Object.keys(CASE_TYPE_MAP).join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return apiError('Please provide a description of your legal matter (at least 10 characters)', 400, 'INVALID_DESCRIPTION');
    }

    if (urgency && !VALID_URGENCY_LEVELS.includes(urgency)) {
      return apiError(`Urgency must be one of: ${VALID_URGENCY_LEVELS.join(', ')}`, 400, 'INVALID_URGENCY');
    }

    if (!consent_given) {
      return apiError('Consent to process your information is required', 400, 'CONSENT_REQUIRED');
    }

    if (!popia_consent) {
      return apiError('POPIA consent is required to process your submission', 400, 'POPIA_CONSENT_REQUIRED');
    }

    // ---- AI Analysis via LLM Service ----
    let aiAnalysis: string;
    let aiProvider = 'none';
    let aiModel = 'none';

    try {
      const result = await analyzeIntake({
        name: sanitizeString(name),
        caseType: normalizedCaseType,
        description: sanitizeString(description),
        urgency: urgency || 'Not specified',
      });

      aiAnalysis = result.content || 'AI analysis could not be generated at this time. Our team will review your submission manually.';
      aiProvider = result.provider;
      aiModel = result.model;
    } catch (aiError) {
      console.error('AI intake analysis failed:', aiError);
      aiAnalysis =
        'We were unable to generate an AI analysis at this time. Your submission has been received and our legal team will review it shortly. A consultant will contact you within 24 hours to discuss your matter.';
    }

    // ---- Save to Database ----
    const referenceId = generateReferenceId();

    const { data: submission, error: insertError } = await db
      .from('intake_submissions')
      .insert({
        reference_id: referenceId,
        full_name: sanitizeString(name.trim()),
        email: email.toLowerCase().trim(),
        phone: phone ? sanitizeString(phone.trim()) : null,
        case_type: normalizedCaseType,
        description: sanitizeString(description.trim()),
        urgency: urgency || 'medium',
        consent_given: true,
        popia_consent: true,
        ai_analysis: aiAnalysis,
        status: 'submitted',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save intake submission:', insertError);
      return apiError('Failed to process your submission. Please try again later.', 500, 'INTAKE_ERROR');
    }

    return apiResponse(
      {
        reference_id: submission.reference_id,
        ai_analysis: aiAnalysis,
        case_type: submission.case_type,
        status: submission.status,
        _meta: {
          provider: aiProvider,
          model: aiModel,
        },
      },
      201
    );
  } catch (error) {
    console.error('Intake submission error:', error);
    return apiError('Failed to process your submission. Please try again later.', 500, 'INTAKE_ERROR');
  }
}

// ============================================
// GET HANDLER - Staff review of submissions
// ============================================

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    // Require authentication (async for Supabase)
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const user = authResult.user!;
    const isStaffMember = isStaff(user.role as RoleKey);
    const { page, perPage, from, to } = getPaginationParams(request);

    // Build query - staff see all, clients see their own
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');
    const caseTypeFilter = url.searchParams.get('case_type');

    // Build Supabase query
    let query = db
      .from('intake_submissions')
      .select('*', { count: 'exact' });

    // Clients can only see their own submissions (matched by email)
    if (!isStaffMember) {
      query = query.eq('email', user.email);
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    if (caseTypeFilter) {
      query = query.eq('case_type', caseTypeFilter);
    }

    // Apply pagination and ordering
    const { data: submissions, count: total, error: queryError } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (queryError) {
      console.error('Intake list query error:', queryError);
      return apiError('Failed to retrieve submissions', 500, 'INTAKE_LIST_ERROR');
    }

    // For client view, omit sensitive fields
    const sanitized = (submissions || []).map((sub: any) => ({
      id: sub.id,
      reference_id: sub.reference_id,
      full_name: isStaffMember ? sub.full_name : undefined,
      email: isStaffMember ? sub.email : undefined,
      phone: isStaffMember ? sub.phone : undefined,
      case_type: sub.case_type,
      urgency: sub.urgency,
      ai_analysis: sub.ai_analysis,
      status: sub.status,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
    }));

    return apiResponse({
      submissions: sanitized,
      pagination: createPaginationResult(total || 0, page, perPage),
    });
  } catch (error) {
    console.error('Intake list error:', error);
    return apiError('Failed to retrieve submissions', 500, 'INTAKE_LIST_ERROR');
  }
}
