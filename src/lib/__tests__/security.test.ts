/**
 * Unit tests for src/lib/security.ts
 * Covers: sanitizeString (XSS), sanitizeObject, redactPII, checkHighRisk,
 * isValidEmail, isValidSAPhone, isValidSAIdNumber, sanitizeFilename,
 * encrypt/decrypt round-trip, RateLimiter behaviour.
 */
import { test, expect, describe, beforeEach } from 'bun:test';
import {
  sanitizeString,
  sanitizeObject,
  redactPII,
  checkHighRisk,
  isValidEmail,
  isValidSAPhone,
  isValidSAIdNumber,
  sanitizeFilename,
  encrypt,
  decrypt,
  RateLimiter,
} from '@/lib/security';

describe('security: sanitizeString strips XSS payloads', () => {
  test('removes <script> blocks', () => {
    const input = 'Hello <script>alert("xss")</script> world';
    expect(sanitizeString(input)).toBe('Hello  world');
  });

  test('removes <iframe> blocks', () => {
    const input = '<iframe src="evil.com"></iframe>safe';
    expect(sanitizeString(input)).toBe('safe');
  });

  test('removes on* event handlers', () => {
    const input = '<img src=x onerror="alert(1)">';
    const out = sanitizeString(input);
    expect(out).not.toContain('onerror=');
    expect(out).not.toContain('alert');
  });

  test('removes javascript: URIs', () => {
    expect(sanitizeString('Click <a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  test('removes vbscript: URIs', () => {
    expect(sanitizeString('href="vbscript:msgbox"')).not.toContain('vbscript:');
  });

  test('removes data:text/html URIs', () => {
    expect(sanitizeString('src="data:text/html,<script>"')).not.toContain('data:text/html');
  });

  test('preserves apostrophes in names (O\'Brien)', () => {
    // Regression: HTML-encoding would corrupt stored names.
    expect(sanitizeString("O'Brien")).toBe("O'Brien");
  });

  test('preserves ampersands in legitimate text', () => {
    expect(sanitizeString('Tom & Jerry')).toBe('Tom & Jerry');
  });

  test('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });
});

describe('security: sanitizeObject recursively sanitizes nested structures', () => {
  test('sanitizes string values at the top level', () => {
    const out = sanitizeObject({ name: '<script>x</script>John', age: 30 });
    expect(out.name).toBe('John');
    expect(out.age).toBe(30);
  });

  test('recurses into nested objects', () => {
    const out = sanitizeObject({
      outer: { inner: '<iframe></iframe>safe' },
    });
    expect(out.outer.inner).toBe('safe');
  });

  test('recurses into arrays of strings and objects', () => {
    const out = sanitizeObject({
      list: ['<script>a</script>', { nested: '<object></object>b' }],
    });
    // sanitizeString strips the entire <script>...</script> block including
    // its text content (that content is executable code, not display text).
    expect(out.list[0]).toBe('');
    // The <object> tag is also stripped wholesale, leaving the trailing 'b'.
    expect((out.list[1] as { nested: string }).nested).toBe('b');
  });

  test('passes through numbers, booleans, null', () => {
    const out = sanitizeObject({ n: 42, b: true, z: null });
    expect(out.n).toBe(42);
    expect(out.b).toBe(true);
    expect(out.z).toBeNull();
  });
});

describe('security: redactPII masks sensitive data', () => {
  test('redacts 13-digit SA ID numbers', () => {
    expect(redactPII('ID 8801235111088')).toBe('ID [REDACTED_ID]');
  });

  test('redacts South African phone numbers (+27 and 0 prefixes)', () => {
    expect(redactPII('Call +27821234567')).toBe('Call [REDACTED_PHONE]');
    expect(redactPII('Call 0821234567')).toBe('Call [REDACTED_PHONE]');
  });

  test('redacts credit-card-like 16-digit sequences', () => {
    expect(redactPII('4111 1111 1111 1111')).toBe('[REDACTED_CARD]');
  });

  test('masks email addresses (keeps first char + domain)', () => {
    expect(redactPII('john.doe@example.com')).toBe('j***@example.com');
  });

  test('leaves non-PII text untouched', () => {
    expect(redactPII('Hello World')).toBe('Hello World');
  });
});

describe('security: checkHighRisk flags dangerous keywords', () => {
  test('detects "murder"', () => {
    const r = checkHighRisk('Client charged with murder');
    expect(r.isHighRisk).toBe(true);
    expect(r.keywords).toContain('murder');
  });

  test('detects multiple keywords', () => {
    const r = checkHighRisk('terrorism and bomb threats');
    expect(r.isHighRisk).toBe(true);
    expect(r.keywords.length).toBeGreaterThanOrEqual(2);
  });

  test('is case-insensitive', () => {
    expect(checkHighRisk('MURDER').isHighRisk).toBe(true);
    expect(checkHighRisk('Murder').isHighRisk).toBe(true);
  });

  test('returns clean for ordinary text', () => {
    const r = checkHighRisk('I need help with a labour dispute');
    expect(r.isHighRisk).toBe(false);
    expect(r.keywords).toEqual([]);
  });
});

describe('security: isValidEmail', () => {
  test('accepts standard emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('john.doe+filter@sub.example.co.za')).toBe(true);
  });
  test('rejects malformed emails', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@example')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('security: isValidSAPhone', () => {
  test('accepts +27 format', () => {
    expect(isValidSAPhone('+27821234567')).toBe(true);
  });
  test('accepts 0-prefix format', () => {
    expect(isValidSAPhone('0821234567')).toBe(true);
  });
  test('strips whitespace before validating', () => {
    expect(isValidSAPhone('082 123 4567')).toBe(true);
  });
  test('rejects too-short / too-long numbers', () => {
    expect(isValidSAPhone('082123456')).toBe(false);
    expect(isValidSAPhone('08212345678')).toBe(false);
  });
  test('rejects non-SA international numbers', () => {
    expect(isValidSAPhone('+15551234567')).toBe(false);
  });
});

describe('security: isValidSAIdNumber (Luhn checksum)', () => {
  test('accepts a known-valid 13-digit ID', () => {
    // 8801235111088 is a commonly-cited valid test ID number
    expect(isValidSAIdNumber('8801235111088')).toBe(true);
  });
  test('rejects wrong-length strings', () => {
    expect(isValidSAIdNumber('123')).toBe(false);
    expect(isValidSAIdNumber('12345678901234')).toBe(false);
  });
  test('rejects non-numeric strings', () => {
    expect(isValidSAIdNumber('88a1235111088')).toBe(false);
  });
  test('rejects an ID that fails the Luhn check', () => {
    // Flip the last digit of a valid ID — Luhn should fail
    expect(isValidSAIdNumber('8801235111089')).toBe(false);
  });
});

describe('security: sanitizeFilename', () => {
  test('replaces non-alphanumeric chars (spaces, parens) with underscores', () => {
    // '(' and ')' are not in [a-zA-Z0-9._-] so they become '_' — this means
    // 'file (1)' becomes 'file__1_' (space→_, (→_, )→_).
    expect(sanitizeFilename('my file (1).txt')).toBe('my_file__1_.txt');
  });
  test('collapses consecutive dots (path traversal defence)', () => {
    // Each '..' collapses to '.', slashes become '_' — so '../../etc/passwd'
    // becomes '._._etc_passwd' (NOT fully stripped — this sanitizer does NOT
    // remove leading path separators, it only sanitizes characters).
    expect(sanitizeFilename('../../etc/passwd')).toBe('._._etc_passwd');
    expect(sanitizeFilename('a....b')).toBe('a.b');
  });
  test('truncates to 255 characters', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeFilename(long).length).toBe(255);
  });
  test('preserves dots, dashes, underscores', () => {
    expect(sanitizeFilename('report_2025-01.pdf')).toBe('report_2025-01.pdf');
  });
});

describe('security: encrypt / decrypt round-trip', () => {
  test('decrypt(encrypt(x)) === x for any string', () => {
    const inputs = [
      'hello world',
      'PII: 8801235111088, +27821234567',
      '{"json":"payload","n":42}',
      '',
      'Unicode: 日本語 emoji 🚀',
    ];
    for (const input of inputs) {
      const encrypted = encrypt(input);
      expect(encrypted).not.toBe(input);
      expect(encrypted.split(':')).toHaveLength(3); // iv:tag:ciphertext
      expect(decrypt(encrypted)).toBe(input);
    }
  });

  test('encryption is non-deterministic (random IV)', () => {
    const a = encrypt('same input');
    const b = encrypt('same input');
    expect(a).not.toBe(b); // different IVs → different ciphertexts
    expect(decrypt(a)).toBe('same input');
    expect(decrypt(b)).toBe('same input');
  });

  test('a tampered ciphertext fails to decrypt (throws)', () => {
    const encrypted = encrypt('secret');
    const [iv, tag, ct] = encrypted.split(':');
    // Flip one hex char in the ciphertext
    const tamperedCt = ct.slice(0, -1) + (ct.slice(-1) === 'a' ? 'b' : 'a');
    const tampered = `${iv}:${tag}:${tamperedCt}`;
    expect(() => decrypt(tampered)).toThrow();
  });
});

describe('security: RateLimiter', () => {
  let limiter: RateLimiter;
  beforeEach(() => {
    limiter = new RateLimiter(3, 60_000); // 3 per minute for test speed
  });

  test('allows up to maxRequests then blocks the next', async () => {
    expect((await limiter.check('k1')).allowed).toBe(true); // 1
    expect((await limiter.check('k1')).allowed).toBe(true); // 2
    expect((await limiter.check('k1')).allowed).toBe(true); // 3
    const blocked = await limiter.check('k1'); // 4 → blocked
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  test('tracks keys independently', async () => {
    expect((await limiter.check('a')).allowed).toBe(true);
    expect((await limiter.check('b')).allowed).toBe(true);
    expect((await limiter.check('a')).allowed).toBe(true);
    expect((await limiter.check('b')).allowed).toBe(true);
    expect((await limiter.check('a')).allowed).toBe(true);
    expect((await limiter.check('a')).allowed).toBe(false); // a exceeded
    expect((await limiter.check('b')).allowed).toBe(true); // b still ok
  });

  test('reset() clears the counter for a key', async () => {
    expect((await limiter.check('k')).allowed).toBe(true);
    expect((await limiter.check('k')).allowed).toBe(true);
    expect((await limiter.check('k')).allowed).toBe(true);
    expect((await limiter.check('k')).allowed).toBe(false);
    limiter.reset('k');
    expect((await limiter.check('k')).allowed).toBe(true);
  });

  test('remaining decreases with each call', async () => {
    const r1 = await limiter.check('rem');
    expect(r1.remaining).toBe(2);
    const r2 = await limiter.check('rem');
    expect(r2.remaining).toBe(1);
    const r3 = await limiter.check('rem');
    expect(r3.remaining).toBe(0);
    const r4 = await limiter.check('rem');
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });
});
