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
 * SameSite=None; Secure would fix the iframe case but requires HTTPS (impossible on
 * http://localhost in dev), so it can't be used universally.
 *
 * SOLUTION
 * --------
 * The server's `requireAuth()` already accepts a `Bearer <jwt>` Authorization header
 * as a fallback to the cookie (see src/lib/middleware.ts Strategy 2). We leverage that:
 *
 *   1. On successful login, the response body already contains the JWT `token`.
 *      We store it in localStorage (which works in cross-origin iframes, unlike cookies).
 *   2. We monkey-patch `window.fetch` so every request to `/api/*` automatically gets
 *      `Authorization: Bearer <token>` attached when a token is in storage. This means
 *      all 15+ components that call `fetch('/api/...')` keep working with zero changes.
 *   3. The cookie is still set by the server for same-origin/normal-browser contexts,
 *      so both transports work. The header simply takes over when the cookie can't be sent.
 *
 * This is the standard pattern used by client-side auth libraries (e.g. axios interceptors).
 */

const TOKEN_KEY = 'il_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // localStorage may be blocked in some contexts; ignore silently
  }
}

let installed = false;
const originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;

/**
 * Install a global fetch interceptor that attaches the Bearer token to all
 * same-origin /api/* requests. Idempotent — safe to call multiple times.
 *
 * The original fetch is preserved so the patch can be bypassed if ever needed.
 */
export function installAuthFetch(): void {
  if (typeof window === 'undefined' || installed || !originalFetch) return;
  installed = true;

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    let url = '';
    try {
      url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    } catch {
      // If we can't read the url, just pass through untouched
      return originalFetch(input, init);
    }

    // Only intercept relative /api/* calls (same-origin). Leave absolute URLs,
    // webhooks, and cross-origin requests untouched so they behave normally.
    const isSameOriginApi = url.startsWith('/api/') || url.startsWith(`${window.location.origin}/api/`);
    if (!isSameOriginApi) {
      return originalFetch(input, init);
    }

    const token = getStoredToken();
    if (!token) {
      // No token in storage — fall back to cookie auth (same-origin normal context)
      return originalFetch(input, init);
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

    return originalFetch(input, { ...init, headers, credentials });
  }) as typeof window.fetch;
}

/**
 * Restore the original fetch (mainly useful for tests / HMR cleanup).
 */
export function uninstallAuthFetch(): void {
  if (typeof window === 'undefined' || !installed || !originalFetch) return;
  window.fetch = originalFetch;
  installed = false;
}
