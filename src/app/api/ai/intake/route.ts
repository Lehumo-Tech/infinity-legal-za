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

// ============================================
// HELPERS
// ============================================

const VALID_CASE_TYPES = [
  'civil',
  'criminal',
  'family',
  'corporate',
  'property',
  'labour',
  'immigration',
  'tax',
  'personal_injury',
  'debt_recovery',
  'other',
] as const;

const VALID_URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

// Map display names / old values to schema case type values
const CASE_TYPE_MAP: Record<string, string> = {
  'Family Law': 'family',
  'family_law': 'family',
  'Criminal Defence': 'criminal',
  'criminal_defence': 'criminal',
  'Civil Litigation': 'civil',
  'civil_litigation': 'civil',
  'Conveyancing': 'property',
  'Estate Planning': 'property',
  'estate_planning': 'property',
  'Corporate Commercial': 'corporate',
  'corporate_commercial': 'corporate',
  'Labour Law': 'labour',
  'labour_law': 'labour',
  'Debt Collection': 'debt_recovery',
  'debt_collection': 'debt_recovery',
  'Immigration': 'immigration',
  'Personal Injury': 'personal_injury',
  'personal_injury': 'personal_injury',
  'Tax': 'tax',
  'Intellectual Property': 'other',
  'Property': 'property',
  'Other': 'other',
};

// ============================================
// POST HANDLER - Submit intake with AI analysis
// ============================================

export async function POST(request: NextRequest) {
  try {
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

    // ---- Find or create client profile ----
    const normalizedEmail = email.toLowerCase().trim();
    let clientId: string | null = null;

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: { client_profile: true },
    });

    if (existingUser?.client_profile) {
      clientId = existingUser.client_profile.id;
    }

    // ---- AI Analysis via LLM Service ----
    let aiAnalysis: string;
    let aiProvider = 'none';
    let aiModel = 'none';
    let aiConfidence: number | null = null;

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
      aiConfidence = result.tokensUsed ? 0.85 : null; // placeholder confidence
    } catch (aiError) {
      console.error('AI intake analysis failed:', aiError);
      aiAnalysis =
        'We were unable to generate an AI analysis at this time. Your submission has been received and our legal team will review it shortly. A consultant will contact you within 24 hours to discuss your matter.';
    }

    // ---- Save to Database ----
    let submission: { id: string; status: string } | null = null;
    try {
      const data = await db.intakeSubmission.create({
        data: {
          client_id: clientId,
          case_type: normalizedCaseType,
          case_description: sanitizeString(description.trim()),
          urgency: urgency || 'medium',
          personal_info: {
            full_name: sanitizeString(name.trim()),
            email: normalizedEmail,
            phone: phone ? sanitizeString(phone.trim()) : null,
            consent_given: true,
            popi_consent: true,
          },
          case_details: {
            description: sanitizeString(description.trim()),
            urgency: urgency || 'medium',
          },
          ai_extracted_data: {
            ai_analysis: aiAnalysis,
            provider: aiProvider,
            model: aiModel,
          },
          ai_confidence: aiConfidence,
          ai_summary: aiAnalysis.substring(0, 500),
          status: 'submitted',
          submitted_at: new Date(),
        },
        select: { id: true, status: true },
      });
      submission = data;
    } catch (insertError) {
      console.error('Failed to save intake submission:', insertError);
      // Don't fail the request — still return the AI analysis
    }

    return apiResponse(
      {
        id: submission?.id || `temp-${Date.now()}`,
        ai_analysis: aiAnalysis,
        case_type: normalizedCaseType,
        status: submission?.status || 'analyzed',
        _meta: {
          provider: aiProvider,
          model: aiModel,
          saved: !!submission,
        },
      },
      submission ? 201 : 200
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
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const user = authResult.user!;
    const userIsStaff = isStaff(user.role as RoleKey);
    const { page, perPage } = getPaginationParams(request);

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');
    const caseTypeFilter = url.searchParams.get('case_type');

    // Build where clause
    const where: Record<string, unknown> = {};

    // Clients can only see their own submissions
    if (!userIsStaff) {
      // Find client profile for this user
      const clientProfile = await db.client.findUnique({
        where: { user_id: user.userId },
      });
      if (clientProfile) {
        where.client_id = clientProfile.id;
      } else {
        // No client profile — no submissions to show
        return apiResponse({
          submissions: [],
          pagination: createPaginationResult(0, page, perPage),
        });
      }
    }

    if (statusFilter) where.status = statusFilter;
    if (caseTypeFilter) where.case_type = caseTypeFilter;

    const [submissions, total] = await Promise.all([
      db.intakeSubmission.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          client: { include: { user: { select: { full_name: true, email: true } } } },
          case: { select: { case_ref: true, title: true } },
          reviewer: { select: { full_name: true, email: true } },
        },
      }),
      db.intakeSubmission.count({ where }),
    ]);

    // Map to response format
    const sanitized = submissions.map((sub) => {
      const personalInfo = (sub.personal_info || {}) as Record<string, unknown>;
      const aiData = (sub.ai_extracted_data || {}) as Record<string, unknown>;
      return {
        id: sub.id,
        case_type: sub.case_type,
        case_description: sub.case_description,
        urgency: sub.urgency,
        status: sub.status,
        full_name: userIsStaff ? personalInfo.full_name : undefined,
        email: userIsStaff ? personalInfo.email : undefined,
        phone: userIsStaff ? personalInfo.phone : undefined,
        ai_analysis: aiData.ai_analysis,
        ai_confidence: sub.ai_confidence,
        submitted_at: sub.submitted_at,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        client: sub.client?.user ? { full_name: sub.client.user.full_name, email: sub.client.user.email } : null,
        case: sub.case ? { case_ref: sub.case.case_ref, title: sub.case.title } : null,
        reviewer: sub.reviewer ? { full_name: sub.reviewer.full_name, email: sub.reviewer.email } : null,
      };
    });

    return apiResponse({
      submissions: sanitized,
      pagination: createPaginationResult(total, page, perPage),
    });
  } catch (error) {
    console.error('Intake list error:', error);
    return apiError('Failed to retrieve submissions', 500, 'INTAKE_LIST_ERROR');
  }
}
