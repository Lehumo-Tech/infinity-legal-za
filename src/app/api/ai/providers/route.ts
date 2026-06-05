/**
 * AI Providers API - GET /api/ai/providers
 * List available LLM providers and their status
 * 
 * Returns configuration status, available models, and usage statistics
 * for all integrated free LLM providers.
 */

import { NextRequest } from 'next/server';
import { getProviderStatuses, getTotalTokenUsage } from '@/lib/llm-providers';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';

// ============================================
// GET HANDLER - List providers and status
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Auth required — only staff should see provider details
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const statuses = getProviderStatuses();
    const tokenUsage = getTotalTokenUsage();

    // Count configured providers
    const configuredCount = statuses.filter(p => p.configured).length;
    const totalProviders = statuses.length;

    return apiResponse({
      overview: {
        totalProviders,
        configuredProviders: configuredCount,
        fallbackAvailable: true, // z-ai-web-dev-sdk always available
        status: configuredCount > 0 ? 'active' : 'fallback',
        statusMessage: configuredCount > 0
          ? `${configuredCount} of ${totalProviders} free LLM providers configured`
          : 'No free LLM providers configured — using z-ai-web-dev-sdk fallback',
      },
      providers: statuses.map(p => ({
        name: p.name,
        displayName: p.displayName,
        available: p.available,
        configured: p.configured,
        models: p.models,
        requestsToday: p.requestsToday,
        lastError: p.lastError,
        avgResponseMs: p.avgResponseMs,
        status: p.configured
          ? (p.lastError ? 'degraded' : 'healthy')
          : 'not_configured',
      })),
      tokenUsage: {
        totalToday: tokenUsage.today,
        byProvider: tokenUsage.byProvider,
      },
      poPIA: {
        notice: 'All AI processing is POPIA-compliant. No sensitive personal data is sent to external providers.',
        dataHandling: 'Conversation history is stored in-memory with 30-minute TTL. No data is persisted to external databases.',
      },
    });
  } catch (error) {
    console.error('Provider status error:', error);
    return apiError('Failed to retrieve provider status', 500, 'PROVIDER_STATUS_ERROR');
  }
}
