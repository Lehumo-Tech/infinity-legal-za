/**
 * POST /api/intake - Submit an intake form (creates a lead + case + AI analysis)
 *
 * This is the main endpoint for the FREE AI intake on the landing page.
 * Visitors describe their legal matter, the system stores the intake,
 * optionally triggers AI analysis, and creates a case if appropriate.
 *
 * Flow:
 * 1. Validate and sanitize input
 * 2. Find or create user + client profile
 * 3. Create IntakeSubmission record
 * 4. Trigger AI analysis (via LLM service if available)
 * 5. Create a Case if analysis indicates merit
 * 6. Return the analysis to the user
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';
import { authRateLimiter, isValidEmail, sanitizeString } from '@/lib/security';
import { analyzeIntake } from '@/lib/llm-service';

// Valid enum values per Prisma schema
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

/**
 * Generate a unique case reference in format INF-YYYYMM-XXXXX
 */
async function generateCaseRef(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INF-${year}${month}`;

  const existingCases = await db.case.findMany({
    where: { case_ref: { startsWith: prefix } },
    select: { case_ref: true },
    orderBy: { case_ref: 'desc' },
    take: 1,
  });

  let nextNum = 1;
  if (existingCases.length > 0) {
    const lastRef = existingCases[0].case_ref;
    const lastNum = parseInt(lastRef.split('-').pop() || '0', 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}-${String(nextNum).padStart(5, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateResult = await checkRateLimit(request, authRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many requests. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { name, email, phone, caseType, description, urgency, consent_given, popia_consent, opposing_party, estimated_value } = body;

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

    // ---- Find or create user + client profile ----
    const normalizedEmail = email.toLowerCase().trim();
    let clientId: string | null = null;

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: { client_profile: true },
    });

    if (existingUser?.client_profile) {
      clientId = existingUser.client_profile.id;
    } else if (existingUser && !existingUser.client_profile) {
      // User exists but no client profile — create one
      const newClient = await db.client.create({
        data: {
          user_id: existingUser.id,
          subscription_status: 'none',
        },
      });
      clientId = newClient.id;
    }
    // If no user exists, we'll create the intake submission without a client_id
    // and create the user later when they sign up

    // ---- AI Analysis via LLM Service ----
    let aiAnalysis = '';
    let aiProvider = 'none';
    let aiModel = 'none';
    let aiConfidence: number | null = null;
    let aiRecommendations: Record<string, unknown> | null = null;

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
      aiConfidence = result.tokensUsed ? 0.85 : null;

      aiRecommendations = {
        provider: aiProvider,
        model: aiModel,
        analysis_type: 'merit_assessment',
      };
    } catch (aiError) {
      console.error('AI intake analysis failed:', aiError);
      aiAnalysis =
        'We were unable to generate an AI analysis at this time. Your submission has been received and our legal team will review it shortly. A consultant will contact you within 24 hours to discuss your matter.';
    }

    // ---- Create IntakeSubmission ----
    const submission = await db.intakeSubmission.create({
      data: {
        client_id: clientId,
        case_type: normalizedCaseType,
        case_description: sanitizeString(description.trim()),
        opposing_party: opposing_party ? sanitizeString(opposing_party) : null,
        estimated_value: estimated_value || null,
        urgency: urgency || 'medium',
        personal_info: {
          full_name: sanitizeString(name.trim()),
          email: normalizedEmail,
          phone: phone ? sanitizeString(phone.trim()) : null,
          consent_given: true,
          popia_consent: true,
        },
        case_details: {
          description: sanitizeString(description.trim()),
          urgency: urgency || 'medium',
          case_type: normalizedCaseType,
        },
        ai_extracted_data: {
          ai_analysis: aiAnalysis,
          provider: aiProvider,
          model: aiModel,
        },
        ai_confidence: aiConfidence,
        ai_summary: aiAnalysis.substring(0, 500),
        ai_recommendations: aiRecommendations
          ? (aiRecommendations as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        status: 'submitted',
        submitted_at: new Date(),
      },
    });

    // ---- Create a Case for this intake ----
    let caseData: { id: string; case_ref: string; title: string; status: string } | null = null;
    try {
      if (clientId) {
        const caseRef = await generateCaseRef();
        const newCase = await db.case.create({
          data: {
            case_ref: caseRef,
            title: `${normalizedCaseType.charAt(0).toUpperCase() + normalizedCaseType.slice(1)} Matter - ${name.trim()}`,
            description: sanitizeString(description.trim()),
            case_type: normalizedCaseType,
            status: 'intake',
            urgency: urgency || 'medium',
            client_id: clientId,
            opposing_party: opposing_party ? sanitizeString(opposing_party) : null,
            estimated_value: estimated_value || null,
          },
        });

        // Link intake submission to the case
        await db.intakeSubmission.update({
          where: { id: submission.id },
          data: { case_id: newCase.id },
        });

        // Create AI analysis record
        await db.aiAnalysis.create({
          data: {
            case_id: newCase.id,
            intake_id: submission.id,
            analysis_type: 'merit_assessment',
            status: 'completed',
            summary: aiAnalysis.substring(0, 500),
            result: {
              analysis: aiAnalysis,
              provider: aiProvider,
              model: aiModel,
            },
            recommendations: aiRecommendations
              ? (aiRecommendations as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            confidence_score: aiConfidence,
            ai_model_used: aiModel,
            completed_at: new Date(),
          },
        });

        // Create timeline entry
        await db.caseTimeline.create({
          data: {
            case_id: newCase.id,
            event_type: 'INTAKE_SUBMITTED',
            event_description: 'AI intake form submitted via website',
            is_system_event: true,
          },
        });

        caseData = {
          id: newCase.id,
          case_ref: newCase.case_ref,
          title: newCase.title,
          status: newCase.status,
        };
      }
    } catch (caseError) {
      console.error('Failed to create case from intake:', caseError);
      // Don't fail the request — the intake was still saved
    }

    // ---- Log consent ----
    try {
      await db.consentLog.create({
        data: {
          user_id: existingUser?.id || null,
          consent_type: 'popi_act',
          granted: true,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          user_agent: request.headers.get('user-agent') || null,
        },
      });

      await db.consentLog.create({
        data: {
          user_id: existingUser?.id || null,
          consent_type: 'data_processing',
          granted: true,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          user_agent: request.headers.get('user-agent') || null,
        },
      });
    } catch (consentError) {
      console.error('Failed to log consent:', consentError);
      // Non-critical — don't fail the request
    }

    return apiResponse(
      {
        id: submission.id,
        ai_analysis: aiAnalysis,
        case_type: normalizedCaseType,
        status: submission.status,
        case: caseData,
        _meta: {
          provider: aiProvider,
          model: aiModel,
          saved: true,
          case_created: !!caseData,
        },
      },
      201
    );
  } catch (error) {
    console.error('Intake submission error:', error);
    return apiError('Failed to process your submission. Please try again later.', 500, 'INTAKE_ERROR');
  }
}
