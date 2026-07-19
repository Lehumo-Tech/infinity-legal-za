/**
 * Pinecone Vector Database Configuration
 *
 * Pinecone is conditionally enabled: when PINECONE_API_KEY is set, the vector
 * database activates for semantic search and AI-powered legal document retrieval.
 * When absent, AI features fall back to keyword-based search or the existing
 * z-ai-web-dev-sdk analysis.
 *
 * To activate Pinecone:
 * 1. Create an account at https://app.pinecone.io
 * 2. Create an index (recommended: 1536 dimensions for text-embedding-ada-002,
 *    or 3072 for text-embedding-3-large)
 * 3. Add to .env:
 *      PINECONE_API_KEY=your-api-key
 *      PINECONE_INDEX_NAME=infinity-legal  (or your index name)
 *
 * Usage:
 * - Legal articles are indexed for semantic search ("find articles about eviction")
 * - AI intake analysis retrieves similar past cases for context
 * - AI chat uses relevant legal documents as RAG context
 */

export const isPineconeEnabled: boolean = !!process.env.PINECONE_API_KEY;

export const pineconeApiKey = process.env.PINECONE_API_KEY || '';
export const pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'infinity-legal';

/**
 * Lazily-initialized Pinecone client. Only creates a client when enabled.
 */
let pineconeClient: import('@pinecone-database/pinecone').Pinecone | null = null;

export async function getPinecone() {
  if (!isPineconeEnabled) return null;
  if (!pineconeClient) {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    pineconeClient = new Pinecone({ apiKey: pineconeApiKey });
  }
  return pineconeClient;
}

/**
 * Get the default index for legal document vectors.
 */
export async function getPineconeIndex() {
  const client = await getPinecone();
  if (!client) return null;
  return client.index(pineconeIndexName);
}

/**
 * Upsert a legal document vector into Pinecone.
 * Returns true on success, false if Pinecone is disabled or on error.
 */
export async function upsertDocumentVector(params: {
  id: string;
  values: number[];
  metadata: {
    title: string;
    type: 'article' | 'case' | 'document' | 'statute';
    content_preview: string;
    url?: string;
    practice_area?: string;
    created_at?: string;
  };
}) {
  try {
    const index = await getPineconeIndex();
    if (!index) return false;
    await index.upsert({
      records: [{ id: params.id, values: params.values, metadata: params.metadata }],
    } as Parameters<typeof index.upsert>[0]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Query Pinecone for similar legal documents.
 * Returns an empty array if Pinecone is disabled or on error.
 */
export async function querySimilarDocuments(
  vector: number[],
  topK: number = 5,
  filter?: Record<string, unknown>
) {
  try {
    const index = await getPineconeIndex();
    if (!index) return [];
    const result = await index.query({ vector, topK, includeMetadata: true, filter });
    return result.matches || [];
  } catch {
    return [];
  }
}
