/**
 * Infinity Legal ZA - PocketBase HTTP Client
 * Uses Node.js http module for reliable networking in sandboxed environment.
 */

import http from 'http';

const PB_HOST = process.env.PB_HOST || '127.0.0.1';
const PB_PORT = parseInt(process.env.PB_PORT || '8090');

// Cache admin token
let adminToken: string | null = null;
let adminTokenExpiry = 0;

function pbRequest<T = any>(method: string, path: string, body?: unknown, token?: string): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options: http.RequestOptions = {
      hostname: PB_HOST,
      port: PB_PORT,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      family: 4, // Force IPv4
    };
    
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk: Buffer) => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode || 500, data: responseBody as any });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ============================================
// ADMIN AUTH
// ============================================

export async function getAdminToken(): Promise<string> {
  if (adminToken && Date.now() < adminTokenExpiry) return adminToken;
  
  const res = await pbRequest<{ token: string }>('POST', '/collections/_superusers/auth-with-password', {
    identity: process.env.PB_ADMIN_EMAIL || 'admin@infinitylegal.co.za',
    password: process.env.PB_ADMIN_PASSWORD || 'InfinityAdmin2026!',
  });
  
  if (!res.data.token) throw new Error('Failed to authenticate as admin');
  adminToken = res.data.token;
  adminTokenExpiry = Date.now() + 86400000; // Cache for 24h
  return adminToken;
}

// ============================================
// USER AUTH
// ============================================

export async function authenticateUser(email: string, password: string) {
  return pbRequest('POST', '/collections/users/auth-with-password', {
    identity: email,
    password,
  });
}

export async function createUser(data: Record<string, unknown>) {
  const token = await getAdminToken();
  return pbRequest('POST', '/collections/users/records', data, token);
}

export async function getUserByEmail(email: string) {
  const token = await getAdminToken();
  return pbRequest('GET', `/collections/users/records?filter=(email='${email}')`, null, token);
}

export async function getUserById(id: string) {
  const token = await getAdminToken();
  return pbRequest('GET', `/collections/users/records/${id}`, null, token);
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const token = await getAdminToken();
  return pbRequest('PATCH', `/collections/users/records/${id}`, data, token);
}

// ============================================
// GENERIC CRUD
// ============================================

export async function listRecords(
  collection: string,
  options: {
    page?: number;
    perPage?: number;
    filter?: string;
    sort?: string;
    expand?: string;
  } = {}
) {
  const token = await getAdminToken();
  const { page = 1, perPage = 20, filter = '', sort = '-created', expand = '' } = options;
  
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    sort,
    ...(filter ? { filter } : {}),
    ...(expand ? { expand } : {}),
  });
  
  return pbRequest('GET', `/collections/${collection}/records?${params}`, null, token);
}

export async function getRecord(collection: string, id: string, expand?: string) {
  const token = await getAdminToken();
  const params = expand ? `?expand=${expand}` : '';
  return pbRequest('GET', `/collections/${collection}/records/${id}${params}`, null, token);
}

export async function createRecord(collection: string, data: Record<string, unknown>) {
  const token = await getAdminToken();
  return pbRequest('POST', `/collections/${collection}/records`, data, token);
}

export async function updateRecord(collection: string, id: string, data: Record<string, unknown>) {
  const token = await getAdminToken();
  return pbRequest('PATCH', `/collections/${collection}/records/${id}`, data, token);
}

export async function deleteRecord(collection: string, id: string) {
  const token = await getAdminToken();
  return pbRequest('DELETE', `/collections/${collection}/records/${id}`, null, token);
}

export async function countRecords(collection: string, filter?: string): Promise<number> {
  const res = await listRecords(collection, { page: 1, perPage: 1, filter });
  return (res.data as any)?.totalItems || 0;
}

// ============================================
// HEALTH CHECK
// ============================================

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await pbRequest('GET', '/health');
    return res.status === 200;
  } catch {
    return false;
  }
}

// ============================================
// AGGREGATION HELPERS
// ============================================

export async function getFullList(collection: string, filter?: string, fields?: string) {
  const token = await getAdminToken();
  const params = new URLSearchParams({
    perPage: '500',
    ...(filter ? { filter } : {}),
    ...(fields ? { fields } : {}),
  });
  return pbRequest('GET', `/collections/${collection}/records?${params}`, null, token);
}

export async function groupByField(collection: string, field: string, filter?: string): Promise<Record<string, number>> {
  const res = await getFullList(collection, filter, field);
  const items = (res.data as any)?.items || (res.data as any) || [];
  const grouped: Record<string, number> = {};
  for (const item of Array.isArray(items) ? items : []) {
    const key = item[field] || 'unknown';
    grouped[key] = (grouped[key] || 0) + 1;
  }
  return grouped;
}
