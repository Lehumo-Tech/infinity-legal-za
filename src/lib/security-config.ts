/**
 * Infinity Legal ZA - Security Configuration
 * Centralized security settings for the application
 */

// ============================================
// CORS CONFIGURATION
// ============================================

export const CORS_CONFIG = {
  // Only allow requests from these origins
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours preflight cache
  allowCredentials: true,
} as const;

// ============================================
// RATE LIMIT CONFIGURATION
// ============================================

export const RATE_LIMIT_CONFIG = {
  // General API rate limiting
  api: {
    maxRequests: 60,
    windowMs: 60_000, // 1 minute
    message: 'Too many requests. Please try again later.',
  },
  // Authentication endpoints (stricter)
  auth: {
    maxRequests: 5,
    windowMs: 300_000, // 5 minutes
    message: 'Too many login attempts. Please wait 5 minutes.',
  },
  // Signup endpoints (very strict)
  signup: {
    maxRequests: 3,
    windowMs: 3_600_000, // 1 hour
    message: 'Too many signup attempts. Please try again later.',
  },
  // File upload endpoints
  upload: {
    maxRequests: 10,
    windowMs: 60_000, // 1 minute
    message: 'Too many upload requests. Please slow down.',
  },
  // Search endpoints
  search: {
    maxRequests: 20,
    windowMs: 60_000, // 1 minute
    message: 'Too many search requests. Please slow down.',
  },
  // Password reset
  passwordReset: {
    maxRequests: 3,
    windowMs: 3_600_000, // 1 hour
    message: 'Too many password reset attempts. Please try again later.',
  },
} as const;

// ============================================
// SESSION TIMEOUT SETTINGS
// ============================================

export const SESSION_CONFIG = {
  // Absolute session timeout (must re-authenticate)
  absoluteTimeoutMs: 8 * 60 * 60 * 1000, // 8 hours
  // Idle session timeout (no activity)
  idleTimeoutMs: 30 * 60 * 1000, // 30 minutes
  // JWT token expiry
  tokenExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  // Refresh token expiry
  refreshExpiryDays: 7,
  // Maximum concurrent sessions per user
  maxConcurrentSessions: 3,
  // Warning before session expires
  warningBeforeExpiryMs: 5 * 60 * 1000, // 5 minutes
} as const;

// ============================================
// PASSWORD POLICY
// ============================================

export const PASSWORD_POLICY = {
  // Minimum length
  minLength: 8,
  // Maximum length (prevent DoS)
  maxLength: 128,
  // Require at least one uppercase letter
  requireUppercase: true,
  // Require at least one lowercase letter
  requireLowercase: true,
  // Require at least one number
  requireNumber: true,
  // Require at least one special character
  requireSpecialChar: true,
  // Password expiration in days
  expiryDays: 90,
  // Number of days before expiry to show warning
  expiryWarningDays: 7,
  // Prevent reuse of last N passwords
  passwordHistoryCount: 5,
  // Minimum time between password changes (hours)
  minChangeIntervalHours: 1,
  // Common passwords to reject
  commonPasswords: [
    'Password1!', 'Password123!', 'Admin123!', 'Welcome1!',
    'Qwerty123!', 'Letmein1!', 'P@ssw0rd', 'ChangeMe1!',
    'Passw0rd!', 'Test1234!',
  ],
} as const;

// ============================================
// FILE UPLOAD RESTRICTIONS
// ============================================

export const FILE_UPLOAD_CONFIG = {
  // Maximum file size in bytes (10MB)
  maxFileSize: 10 * 1024 * 1024,
  // Allowed MIME types for document uploads
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
  ],
  // Allowed file extensions (secondary check)
  allowedExtensions: [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.txt', '.csv', '.rtf',
  ],
  // Blocked extensions (always reject regardless of other settings)
  blockedExtensions: [
    '.exe', '.bat', '.cmd', '.com', '.msi', '.scr',
    '.sh', '.bash', '.ps1', '.vbs', '.wsf',
    '.js', '.jar', '.app', '.deb', '.rpm',
    '.iso', '.dmg', '.zip', '.rar', '.7z',
    '.sql', '.db', '.sqlite',
  ],
  // Maximum files per upload request
  maxFilesPerRequest: 5,
  // Upload directory (server-side, relative to project root)
  uploadDir: process.env.UPLOAD_DIR || './uploads/documents',
} as const;

// ============================================
// IP BLOCKING RULES
// ============================================

export const IP_BLOCKING_CONFIG = {
  // Enable IP blocking
  enabled: true,
  // Automatically block IPs with too many failed auth attempts
  autoBlockEnabled: true,
  // Number of failed auth attempts before auto-block
  failedAuthThreshold: 10,
  // Time window for counting failed attempts (minutes)
  failedAuthWindowMinutes: 15,
  // Duration of auto-block (hours)
  blockDurationHours: 24,
  // Permanently blocked IP ranges (e.g., known malicious ranges)
  blockedRanges: [] as string[],
  // Whitelisted IPs that bypass rate limiting
  whitelistedIPs: ['127.0.0.1', '::1'] as string[],
} as const;

// ============================================
// SQL INJECTION DETECTION PATTERNS
// ============================================

export const SQL_INJECTION_PATTERNS = [
  // Classic SQL injection
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
  // Comment injection
  /(--|\/\*|\*\/|;)/,
  // String concatenation attacks
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
  // Quote-based injection
  /('(\s)*(OR|AND)(\s)*')/i,
  // Time-based blind injection
  /(\b(WAITFOR|DELAY|SLEEP|BENCHMARK)\b)/i,
  // Stacked queries
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)/i,
  // Hex encoding attempts
  /(0x[0-9a-fA-F]{2,})/i,
  // Char encoding attempts
  /(\bCHAR\s*\()/i,
  // Subquery injection
  /(\bSUBQUERY\b|\bSUBSTRING\b\s*\()/i,
  // Information schema access
  /(INFORMATION_SCHEMA\.)|(\bSYS\.)|(\bMYSQL\.)/i,
  // Boolean-based blind injection
  /(\b(TRUE|FALSE)\b\s*=\s*\b(TRUE|FALSE)\b)/i,
] as const;

// ============================================
// ADDITIONAL SECURITY SETTINGS
// ============================================

export const SECURITY_SETTINGS = {
  // Enable request logging for audit trail
  enableRequestLogging: true,
  // Log sensitive operations
  logSensitiveOperations: true,
  // Maximum request body size (bytes)
  maxRequestBodySize: 10 * 1024 * 1024, // 10MB
  // Enable HTTPS enforcement in production
  enforceHTTPS: process.env.NODE_ENV === 'production',
  // Cookie settings
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  // Anti-CSRF token expiry (minutes)
  csrfTokenExpiryMinutes: 60,
  // Maximum pagination limit (prevent data harvesting)
  maxPaginationLimit: 100,
  // Enable PII redaction in logs
  redactPIIInLogs: true,
  // Minimum TLS version
  minimumTLSVersion: '1.2',
} as const;
