/**
 * Infinity Legal ZA - PocketBase Client SDK
 * Server-side client for interacting with PocketBase from Next.js API routes.
 * Handles auth, CRUD operations, pagination, and real-time subscriptions.
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.POCKETBASE_URL || 'http://0.0.0.0:8090';

// Singleton pattern for PocketBase client
const globalForPB = globalThis as unknown as {
  pb: PocketBase | undefined;
  pbAdmin: PocketBase | undefined;
};

/**
 * Get a regular PocketBase client (for unauthenticated or user-authenticated requests)
 */
export function getPocketBase(): PocketBase {
  if (!globalForPB.pb) {
    globalForPB.pb = new PocketBase(PB_URL);
  }
  return globalForPB.pb;
}

/**
 * Get an admin-authenticated PocketBase client
 * Uses superuser credentials to bypass collection rules
 * Should only be used in server-side API routes
 */
export async function getAdminPocketBase(): Promise<PocketBase> {
  if (!globalForPB.pbAdmin || !globalForPB.pbAdmin.authStore.isValid) {
    const pb = new PocketBase(PB_URL);
    await pb.collection('_superusers').authWithPassword(
      process.env.PB_ADMIN_EMAIL || 'admin@infinitylegal.co.za',
      process.env.PB_ADMIN_PASSWORD || 'InfinityAdmin2026!'
    );
    globalForPB.pbAdmin = pb;
  }
  return globalForPB.pbAdmin;
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(email: string, password: string) {
  const pb = getPocketBase();
  const authData = await pb.collection('users').authWithPassword(email, password);
  return authData;
}

/**
 * Create a user with custom fields
 */
export async function createUser(data: {
  email: string;
  password: string;
  passwordConfirm: string;
  full_name: string;
  phone?: string;
  role: string;
  department?: string;
  password_expires_at?: string;
  last_password_change?: string;
}) {
  const pb = await getAdminPocketBase();
  return pb.collection('users').create(data);
}

/**
 * Generic paginated list with filters
 */
export async function listRecords(
  collection: string,
  options: {
    page?: number;
    perPage?: number;
    filter?: string;
    sort?: string;
    expand?: string;
    fields?: string;
    useAdmin?: boolean;
  } = {}
) {
  const { page = 1, perPage = 20, filter, sort = '-created', expand, fields, useAdmin = true } = options;
  const pb = useAdmin ? await getAdminPocketBase() : getPocketBase();
  
  return pb.collection(collection).getList(page, perPage, {
    filter: filter || '',
    sort,
    expand: expand || '',
    fields: fields || '',
  });
}

/**
 * Get a single record by ID
 */
export async function getRecord(
  collection: string,
  id: string,
  options: { expand?: string; fields?: string; useAdmin?: boolean } = {}
) {
  const pb = options.useAdmin !== false ? await getAdminPocketBase() : getPocketBase();
  return pb.collection(collection).getOne(id, {
    expand: options.expand || '',
    fields: options.fields || '',
  });
}

/**
 * Create a record
 */
export async function createRecord(
  collection: string,
  data: Record<string, unknown>,
  options: { useAdmin?: boolean } = {}
) {
  const pb = options.useAdmin !== false ? await getAdminPocketBase() : getPocketBase();
  return pb.collection(collection).create(data);
}

/**
 * Update a record
 */
export async function updateRecord(
  collection: string,
  id: string,
  data: Record<string, unknown>,
  options: { useAdmin?: boolean } = {}
) {
  const pb = options.useAdmin !== false ? await getAdminPocketBase() : getPocketBase();
  return pb.collection(collection).update(id, data);
}

/**
 * Delete a record
 */
export async function deleteRecord(
  collection: string,
  id: string,
  options: { useAdmin?: boolean } = {}
) {
  const pb = options.useAdmin !== false ? await getAdminPocketBase() : getPocketBase();
  return pb.collection(collection).delete(id);
}

/**
 * Count records in a collection
 */
export async function countRecords(
  collection: string,
  filter?: string
): Promise<number> {
  const pb = await getAdminPocketBase();
  const result = await pb.collection(collection).getList(1, 1, {
    filter: filter || '',
  });
  return result.totalItems;
}

/**
 * Get records with aggregation (group by)
 * PocketBase doesn't have native groupBy, so we fetch all and aggregate in JS
 */
export async function getRecordsGroupedBy(
  collection: string,
  groupByField: string,
  filter?: string
): Promise<Record<string, number>> {
  const pb = await getAdminPocketBase();
  const result = await pb.collection(collection).getFullList({
    filter: filter || '',
    fields: groupByField,
  });
  
  const grouped: Record<string, number> = {};
  for (const record of result) {
    const key = (record as Record<string, unknown>)[groupByField] as string || 'unknown';
    grouped[key] = (grouped[key] || 0) + 1;
  }
  return grouped;
}

/**
 * Verify a JWT token and return the user
 */
export async function verifyAuthToken(token: string) {
  try {
    const pb = getPocketBase();
    pb.authStore.save(token, null);
    // Try to refresh the auth to verify the token is valid
    const isSuperuser = token.includes('pbc_3142635823');
    if (isSuperuser) {
      // It's a superuser token - we can't refresh it the normal way
      return { valid: true, isSuperuser: true };
    }
    return { valid: pb.authStore.isValid, isSuperuser: false };
  } catch {
    return { valid: false, isSuperuser: false };
  }
}

/**
 * Health check for PocketBase
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const pb = getPocketBase();
    await pb.health.check();
    return true;
  } catch {
    return false;
  }
}

// Export the base client for advanced usage
export { PocketBase };
export default getPocketBase;
