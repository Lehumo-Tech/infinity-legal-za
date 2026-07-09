/**
 * auth-fetch.ts — Cross-origin iframe-safe authentication transport
 *
 * PROBLEM
 * -------
 * The app authenticates via an httpOnly `auth-token` cookie set by /api/auth/login
 * with `sameSite: 'lax'`. In a cross-origin iframe (e.g. preview-chat-*.space-z.ai
 * embedding the app), SameSite=Lax cookies are NOT sent on cross-origin fetch()
 * requests. So even though login returns 200 and the cookie is "set", the very next
 * call to /api/auth/profile sends no cookie → 401 → user appears to never log in.
 *
 * Worse: in some iframe sandbox configurations, localStorage is ALSO blocked
 * (SecurityError: Access is denied). So we can't rely on localStorage alone.
 *
 * SOLUTION
 * --------
 * The server's `requireAuth()` already accepts a `Bearer <jwt>` Authorization header
 * as a fallback to the cookie (see src/lib/middleware.ts Strategy 2). We leverage that:
 *
 *   1. On successful login, the response body contains the JWT `token`. We store it in
 *      an IN-MEMORY module-level variable (always works, immune to localStorage
 *      blocking) AND attempt to mirror it to localStorage (for page-refresh persistence,
 *      gracefully degrading if storage is blocked).
 *   2. We patch `window.fetch` at MODULE LOAD TIME (not in a React effect, to guarantee
 *      it's ready before any fetch fires) so every request to `/api/*` automatically
 *      gets `Authorization: Bearer <token>` attached when a token is in memory.
 *   3. The cookie is still set by the server for same-origin/normal-browser contexts,
 *      so both transports work. The header simply takes over when the cookie can't be sent.
 *
 * This is the standard pattern used by client-side auth libraries (e.g. axios interceptors).
 * All 15+ components that call `fetch('/api/...')` keep working with zero changes.
 */

// ============================================
// IN-MEMORY TOKEN STORE (primary — always works)
// ============================================
let inMemoryToken: string | null = null;

const TOKEN_KEY = 'il_auth_token';

/** Persist token to localStorage if the browser allows it (best-effort). */
function persistToStorage(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // localStorage may be blocked (sandbox, third-party storage partitioning, private
    // mode). That's fine — the in-memory copy is authoritative for the session.
  }
}

/** Try to load a previously-stored token from localStorage on startup. */
function loadFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  // In-memory is authoritative; localStorage is only a persistence backup.
  return inMemoryToken;
}

export function setStoredToken(token: string | null): void {
  inMemoryToken = token;
  persistToStorage(token);
}

// ============================================
// FETCH INTERCEPTOR
// ============================================

const originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;

/**
 * Patch window.fetch to attach the Bearer token to all same-origin /api/* requests.
 *
 * Wrapped in try/catch so a failure in the interceptor NEVER breaks the underlying
 * fetch — worst case the request goes out without the header (and falls back to cookie
 * auth, which works in same-origin contexts).
 */
function patchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    let url = '';
    try {
      url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    } catch {
      return originalFetch!(input, init);
    }

    // Only intercept relative /api/* calls (same-origin). Leave absolute URLs,
    // webhooks, and cross-origin requests untouched so they behave normally.
    const isSameOriginApi = url.startsWith('/api/') || (typeof window !== 'undefined' && url.startsWith(`${window.location.origin}/api/`));
    if (!isSameOriginApi) {
      return originalFetch!(input, init);
    }

    const token = getStoredToken();
    if (!token) {
      // No token in memory — fall back to cookie auth (same-origin normal context).
      return originalFetch!(input, init);
    }

    // Merge headers, preserving any caller-supplied headers. Never overwrite an
    // explicit Authorization header the caller set intentionally.
    const existingHeaders = init?.headers;
    const headers = new Headers(existingHeaders || undefined);
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // Always include credentials so the cookie is sent too when available —
    // belt-and-suspenders for same-origin contexts.
    const credentials = init?.credentials ?? 'include';

    return originalFetch!(input, { ...init, headers, credentials });
  } catch {
    // Never let the interceptor break a fetch — fall through to the original.
    return originalFetch!(input, init);
  }
}

/**
 * Install the global fetch interceptor. Idempotent — safe to call multiple times.
 * Called at module load (below) AND from the AuthProvider effect for safety.
 */
let installed = false;
export function installAuthFetch(): void {
  if (typeof window === 'undefined' || installed || !originalFetch) return;
  installed = true;
  window.fetch = patchedFetch as typeof window.fetch;
}

/**
 * Build a fetch options object with the Bearer header explicitly attached.
 * Use this for critical one-off authenticated calls (e.g. the post-login profile
 * fetch) so they don't depend on the interceptor being installed.
 */
export function withAuthHeader(init?: RequestInit): RequestInit {
  const token = getStoredToken();
  const headers = new Headers(init?.headers || undefined);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return { ...init, headers, credentials: init?.credentials ?? 'include' };
}

// ============================================
// MODULE-LOAD INSTALLATION
// ============================================
// Install the interceptor the moment this module is imported in the browser.
// useAuth.tsx imports this module, and AuthProvider (which wraps the whole app)
// imports useAuth — so the interceptor is live before any component can fire a fetch.
// We also eagerly load any previously-stored token from localStorage so a page
// refresh inside a normal browser restores the session.
if (typeof window !== 'undefined') {
  // Eagerly restore token from storage (best-effort; ignored if storage is blocked).
  const restored = loadFromStorage();
  if (restored) inMemoryToken = restored;
  installAuthFetch();
}
