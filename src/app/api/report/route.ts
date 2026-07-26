/**
 * GET /api/report — Infinity Legal ZA Client Functionality Report
 * Returns a professionally formatted HTML page with print styles
 * Publicly accessible (linked from login page for client preview)
 */

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Note: This endpoint is intentionally public so clients can preview the report
  // from the login page without authentication
  const generatedDate = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Infinity Legal ZA — Client Functionality Report</title>
  <style>
    /* ============ BASE RESET & TYPOGRAPHY ============ */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --navy: #0c1e3c;
      --navy-light: #162d54;
      --gold: #c9a84c;
      --gold-light: #e0c878;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-500: #6b7280;
      --gray-700: #374151;
      --gray-900: #111827;
      --white: #ffffff;
    }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: var(--gray-900);
      background: var(--white);
      line-height: 1.6;
      font-size: 14px;
    }

    /* ============ COVER PAGE ============ */
    .cover {
      min-height: 100vh;
      background: linear-gradient(160deg, var(--navy) 0%, var(--navy-light) 100%);
      color: var(--white);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 4rem 2rem;
      position: relative;
      overflow: hidden;
    }
    .cover::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 80%;
      height: 200%;
      background: radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .cover-logo {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
      color: var(--gold);
    }
    .cover-subtitle {
      font-size: 1.15rem;
      font-weight: 300;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      opacity: 0.85;
      margin-bottom: 3rem;
    }
    .cover-title {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      line-height: 1.2;
    }
    .cover-date {
      font-size: 1rem;
      opacity: 0.7;
      margin-bottom: 1rem;
    }
    .cover-badge {
      display: inline-block;
      padding: 0.4rem 1.5rem;
      border: 1px solid var(--gold);
      border-radius: 999px;
      font-size: 0.8rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--gold);
      margin-top: 2rem;
    }
    .cover-footer {
      position: absolute;
      bottom: 2rem;
      font-size: 0.75rem;
      opacity: 0.5;
    }

    /* ============ REPORT BODY ============ */
    .report-body {
      max-width: 960px;
      margin: 0 auto;
      padding: 3rem 2rem;
    }

    /* ============ TABLE OF CONTENTS ============ */
    .toc {
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 2rem 2.5rem;
      margin-bottom: 3rem;
    }
    .toc h2 {
      font-size: 1.25rem;
      color: var(--navy);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--gold);
    }
    .toc ol {
      list-style: none;
      counter-reset: toc-counter;
    }
    .toc ol li {
      counter-increment: toc-counter;
      padding: 0.35rem 0;
      border-bottom: 1px dotted var(--gray-200);
    }
    .toc ol li::before {
      content: counter(toc-counter, decimal-leading-zero) ".";
      color: var(--gold);
      font-weight: 700;
      margin-right: 0.75rem;
      min-width: 2rem;
      display: inline-block;
    }
    .toc ol li a {
      color: var(--navy);
      text-decoration: none;
    }
    .toc ol li a:hover {
      text-decoration: underline;
      color: var(--navy-light);
    }

    /* ============ SECTIONS ============ */
    .section {
      margin-bottom: 3rem;
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid var(--gold);
    }
    .section-number {
      background: var(--navy);
      color: var(--gold);
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .section-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--navy);
    }
    .section p {
      margin-bottom: 0.75rem;
      color: var(--gray-700);
    }
    .section ul, .section ol {
      margin: 0.75rem 0 0.75rem 1.5rem;
      color: var(--gray-700);
    }
    .section li {
      margin-bottom: 0.35rem;
    }

    /* ============ TABLES ============ */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0 1.5rem;
      font-size: 0.82rem;
    }
    thead th {
      background: var(--navy);
      color: var(--white);
      padding: 0.6rem 0.75rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.78rem;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    thead th:first-child { border-radius: 6px 0 0 0; }
    thead th:last-child { border-radius: 0 6px 0 0; }
    tbody td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--gray-200);
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: var(--gray-50); }
    tbody tr:hover { background: #f0f4ff; }

    /* ============ BADGES / CHIPS ============ */
    .badge {
      display: inline-block;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .badge-gold { background: #fef3c7; color: #92400e; }
    .badge-navy { background: #dbeafe; color: #1e3a5f; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-purple { background: #ede9fe; color: #5b21b6; }
    .badge-gray { background: var(--gray-200); color: var(--gray-700); }

    /* ============ CALLOUT BOXES ============ */
    .callout {
      border-left: 4px solid var(--gold);
      background: var(--gray-50);
      padding: 1rem 1.25rem;
      border-radius: 0 6px 6px 0;
      margin: 1rem 0;
    }
    .callout-info {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }
    .callout-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }
    .callout-success {
      border-left-color: #10b981;
      background: #ecfdf5;
    }
    .callout strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    /* ============ FEATURE CARDS ============ */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }
    .card {
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 1.25rem;
      transition: box-shadow 0.2s;
    }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .card-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .card h4 {
      font-size: 0.95rem;
      color: var(--navy);
      margin-bottom: 0.35rem;
    }
    .card p {
      font-size: 0.8rem;
      color: var(--gray-500);
      margin-bottom: 0;
    }

    /* ============ PERMISSION MATRIX ============ */
    .perm-matrix { overflow-x: auto; }
    .perm-matrix table { min-width: 900px; }
    .perm-check { color: #10b981; font-weight: bold; }
    .perm-cross { color: #ef4444; }

    /* ============ FLOW DIAGRAM ============ */
    .flow {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-wrap: wrap;
      margin: 0.75rem 0;
    }
    .flow-step {
      background: var(--navy);
      color: var(--gold);
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .flow-arrow {
      color: var(--gray-500);
      font-size: 1.2rem;
    }

    /* ============ SCHEMA SECTION ============ */
    .schema-model {
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
    }
    .schema-model h4 {
      font-size: 0.95rem;
      color: var(--navy);
      margin-bottom: 0.5rem;
    }
    .schema-model code {
      background: #e0e7ff;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      font-size: 0.78rem;
    }
    .schema-fields {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.25rem 1rem;
      font-size: 0.82rem;
      color: var(--gray-700);
    }

    /* ============ FOOTER ============ */
    .report-footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 2px solid var(--gray-200);
      text-align: center;
      color: var(--gray-500);
      font-size: 0.78rem;
    }

    /* ============ PRINT STYLES ============ */
    @media print {
      body { font-size: 11px; }
      .cover {
        min-height: auto;
        padding: 3rem 2rem;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .report-body { padding: 2rem 1rem; }
      .section { page-break-inside: avoid; margin-bottom: 2rem; }
      .card-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
      .card { box-shadow: none; border: 1px solid #ddd; }
      table { font-size: 9px; }
      thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .toc { break-after: page; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- ======================= COVER PAGE ======================= -->
  <div class="cover">
    <img src="/logo_legal.png" alt="Infinity Legal SA" style="width:140px;margin-bottom:1rem;" />
    <div class="cover-logo">INFINITY LEGAL</div>
    <div class="cover-subtitle">South Africa</div>
    <div class="cover-title">Client Functionality Report</div>
    <div class="cover-date">Generated: ${generatedDate}</div>
    <div class="cover-badge">Confidential &mdash; For Authorised Recipients Only</div>
    <div class="cover-footer">&copy; ${new Date().getFullYear()} Infinity Legal ZA &middot; Technology Division</div>
  </div>

  <!-- ======================= REPORT BODY ======================= -->
  <div class="report-body">

    <!-- TABLE OF CONTENTS -->
    <div class="toc">
      <h2>Table of Contents</h2>
      <ol>
        <li><a href="#executive-summary">Executive Summary</a></li>
        <li><a href="#architecture">System Architecture</a></li>
        <li><a href="#security">Security Features</a></li>
        <li><a href="#authentication">Authentication System</a></li>
        <li><a href="#portals">Portal Views</a></li>
        <li><a href="#rbac">Role-Based Access Control</a></li>
        <li><a href="#api">API Endpoints</a></li>
        <li><a href="#database">Database Schema</a></li>
        <li><a href="#popia">POPIA Compliance</a></li>
        <li><a href="#deployment">Deployment Information</a></li>
      </ol>
    </div>

    <!-- ==================== 1. EXECUTIVE SUMMARY ==================== -->
    <div class="section" id="executive-summary">
      <div class="section-header">
        <span class="section-number">1</span>
        <h2 class="section-title">Executive Summary</h2>
      </div>
      <p>
        Infinity Legal ZA is a comprehensive, cloud-native legal practice management platform designed for
        South African law firms. Built on modern web technologies, the platform provides end-to-end
        management of cases, leads, documents, consultations, tasks, and staff &mdash; all within a
        secure, POPIA-compliant framework.
      </p>
      <p>
        The system implements a granular Role-Based Access Control (RBAC) model with 16 distinct roles,
        ensuring that sensitive legal data is only accessible to authorised personnel. From the Managing
        Director to the Receptionist, every user interacts with a tailored portal view that surfaces
        the tools and data relevant to their responsibilities.
      </p>
      <div class="callout callout-success">
        <strong>Key Highlights</strong>
        <ul style="margin:0.25rem 0 0 1.25rem">
          <li>Full case lifecycle management (intake &rarr; archive) across 11 case types</li>
          <li>Lead pipeline with scoring, qualification, and conversion tracking</li>
          <li>Document workflow engine (draft &rarr; review &rarr; approved &rarr; signed &rarr; filed &rarr; archived)</li>
          <li>JWT authentication with 24-hour expiry and 90-day password rotation</li>
          <li>AES-256-GCM encryption for data at rest and comprehensive audit logging</li>
          <li>POPIA-compliant consent management and PII redaction</li>
          <li>Subscription billing with three pricing tiers (Civil, Labour, Extensive)</li>
        </ul>
      </div>
    </div>

    <!-- ==================== 2. ARCHITECTURE ==================== -->
    <div class="section" id="architecture">
      <div class="section-header">
        <span class="section-number">2</span>
        <h2 class="section-title">System Architecture</h2>
      </div>
      <p>
        Infinity Legal ZA is built on a modern, server-rendered architecture using Next.js 16 with
        the App Router pattern. The entire application is written in TypeScript 5, providing
        end-to-end type safety.
      </p>

      <table>
        <thead>
          <tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>Framework</td><td>Next.js 16 (App Router)</td><td>Server-side rendering, API routes, middleware</td></tr>
          <tr><td>Language</td><td>TypeScript 5</td><td>Type-safe development across the entire stack</td></tr>
          <tr><td>Database</td><td>PostgreSQL via Prisma ORM</td><td>Relational data with type-safe queries and migrations</td></tr>
          <tr><td>Styling</td><td>Tailwind CSS 4 + shadcn/ui</td><td>Utility-first CSS with pre-built accessible components</td></tr>
          <tr><td>Authentication</td><td>Custom JWT (HS256)</td><td>Stateless authentication with 24-hour token expiry</td></tr>
          <tr><td>Encryption</td><td>AES-256-GCM</td><td>At-rest encryption for sensitive data fields</td></tr>
          <tr><td>Deployment</td><td>Vercel (Edge + Serverless)</td><td>Zero-config deployment with global CDN</td></tr>
          <tr><td>Version Control</td><td>GitHub</td><td>Source code management and CI/CD integration</td></tr>
        </tbody>
      </table>

      <div class="callout callout-info">
        <strong>Architecture Decision: PostgreSQL</strong>
        PostgreSQL was chosen for its robust feature set, excellent concurrency support, and
        compatibility with Vercel's serverless platform. Managed via Vercel Postgres (Neon)
        with automatic backups and point-in-time recovery.
      </div>
    </div>

    <!-- ==================== 3. SECURITY FEATURES ==================== -->
    <div class="section" id="security">
      <div class="section-header">
        <span class="section-number">3</span>
        <h2 class="section-title">Security Features</h2>
      </div>
      <p>
        Security is a foundational pillar of the Infinity Legal ZA platform. The system implements
        defence-in-depth with multiple security layers protecting client data, legal advisor work-product,
        and firm operations.
      </p>

      <div class="card-grid">
        <div class="card">
          <div class="card-icon">&#128737;</div>
          <h4>RBAC with 16 Roles</h4>
          <p>Granular role-based access control ensuring least-privilege access across all system functions.</p>
        </div>
        <div class="card">
          <div class="card-icon">&#128274;</div>
          <h4>AES-256-GCM Encryption</h4>
          <p>Sensitive data encrypted at rest using AES-256 in GCM mode with unique IVs and authentication tags.</p>
        </div>
        <div class="card">
          <div class="card-icon">&#128272;</div>
          <h4>JWT Auth (24h Expiry)</h4>
          <p>Stateless JWT tokens with HMAC-SHA256 signatures, 24-hour expiry, and timing-safe comparison.</p>
        </div>
        <div class="card">
          <div class="card-icon">&#128197;</div>
          <h4>Password Policies</h4>
          <p>90-day mandatory rotation, complexity requirements (8+ chars, upper/lower/digit/special), HMAC-SHA512 hashing.</p>
        </div>
        <div class="card">
          <div class="card-icon">&#128203;</div>
          <h4>Audit Logging</h4>
          <p>Comprehensive audit trail recording user actions, resource access, IP addresses, and user agents.</p>
        </div>
        <div class="card">
          <div class="card-icon">&#128736;</div>
          <h4>CSP Headers</h4>
          <p>Strict Content Security Policy, HSTS (2-year), X-Frame-Options, X-Content-Type-Options, and Permissions-Policy.</p>
        </div>
        <div class="card">
          <div class="card-icon">&#9201;</div>
          <h4>Rate Limiting</h4>
          <p>Multi-tier rate limiting: 60 req/min (API), 5 req/5min (auth), 3 req/hr (signup), 10 req/min (uploads).</p>
        </div>
        <div class="card">
          <div class="card-icon">&#128765;</div>
          <h4>POPIA Compliance</h4>
          <p>Consent logging, PII redaction, data processing records, and automated SA ID/phone/email masking.</p>
        </div>
      </div>

      <h3 style="color:var(--navy); margin:1.5rem 0 0.75rem; font-size:1rem;">Security Headers Applied Globally</h3>
      <table>
        <thead><tr><th>Header</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Content-Security-Policy</td><td>default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' …</td></tr>
          <tr><td>Strict-Transport-Security</td><td>max-age=63072000; includeSubDomains; preload</td></tr>
          <tr><td>X-Frame-Options</td><td>SAMEORIGIN</td></tr>
          <tr><td>X-Content-Type-Options</td><td>nosniff</td></tr>
          <tr><td>X-XSS-Protection</td><td>1; mode=block</td></tr>
          <tr><td>Referrer-Policy</td><td>strict-origin-when-cross-origin</td></tr>
          <tr><td>Permissions-Policy</td><td>camera=(), microphone=(), geolocation=(), payment=(), usb=() …</td></tr>
          <tr><td>Cross-Origin-Opener-Policy</td><td>same-origin</td></tr>
          <tr><td>Cross-Origin-Resource-Policy</td><td>same-origin</td></tr>
          <tr><td>Cross-Origin-Embedder-Policy</td><td>credentialless</td></tr>
        </tbody>
      </table>

      <h3 style="color:var(--navy); margin:1.5rem 0 0.75rem; font-size:1rem;">Rate Limiter Configuration</h3>
      <table>
        <thead><tr><th>Limiter</th><th>Max Requests</th><th>Window</th></tr></thead>
        <tbody>
          <tr><td>API (General)</td><td>60</td><td>1 minute</td></tr>
          <tr><td>Authentication</td><td>5</td><td>5 minutes</td></tr>
          <tr><td>Signup</td><td>3</td><td>1 hour</td></tr>
          <tr><td>Upload</td><td>10</td><td>1 minute</td></tr>
          <tr><td>Search</td><td>20</td><td>1 minute</td></tr>
        </tbody>
      </table>

      <h3 style="color:var(--navy); margin:1.5rem 0 0.75rem; font-size:1rem;">Input Sanitization</h3>
      <p>
        All user input is processed through a multi-layer sanitization pipeline that strips XSS payloads
        (script, iframe, object, embed tags), neutralises event handlers (on* attributes), removes
        javascript:/vbscript:/data:text/html URIs, and HTML-entity encodes special characters.
      </p>
    </div>

    <!-- ==================== 4. AUTHENTICATION SYSTEM ==================== -->
    <div class="section" id="authentication">
      <div class="section-header">
        <span class="section-number">4</span>
        <h2 class="section-title">Authentication System</h2>
      </div>
      <p>
        The platform uses a stateless JWT-based authentication system with robust password management
        and session controls.
      </p>

      <h3 style="color:var(--navy); margin:1rem 0 0.5rem; font-size:1rem;">Login &amp; Signup Flow</h3>
      <table>
        <thead><tr><th>Endpoint</th><th>Method</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>/api/auth/login</code></td><td>POST</td><td>Authenticate with email + password; returns JWT token</td></tr>
          <tr><td><code>/api/auth/signup</code></td><td>POST</td><td>Register new user with role assignment and password validation</td></tr>
        </tbody>
      </table>

      <h3 style="color:var(--navy); margin:1rem 0 0.5rem; font-size:1rem;">JWT Token Specification</h3>
      <table>
        <thead><tr><th>Property</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Algorithm</td><td>HMAC-SHA256 (HS256)</td></tr>
          <tr><td>Expiry</td><td>24 hours (86400 seconds)</td></tr>
          <tr><td>Token Format</td><td>Standard JWT: header.payload.signature (Base64URL encoded)</td></tr>
          <tr><td>Signature Verification</td><td>Timing-safe comparison to prevent timing attacks</td></tr>
          <tr><td>Payload Fields</td><td>userId, email, role, department, iat, exp</td></tr>
        </tbody>
      </table>

      <h3 style="color:var(--navy); margin:1rem 0 0.5rem; font-size:1rem;">Password Policy</h3>
      <table>
        <thead><tr><th>Requirement</th><th>Enforcement</th></tr></thead>
        <tbody>
          <tr><td>Minimum Length</td><td>8 characters</td></tr>
          <tr><td>Uppercase Letter</td><td>Required</td></tr>
          <tr><td>Lowercase Letter</td><td>Required</td></tr>
          <tr><td>Numeric Digit</td><td>Required</td></tr>
          <tr><td>Special Character</td><td>Required (!@#$%^&amp;* etc.)</td></tr>
          <tr><td>Hashing Algorithm</td><td>HMAC-SHA512 with 32-byte random salt, 100 000 iterations</td></tr>
          <tr><td>Expiry Period</td><td>90 days (mandatory rotation)</td></tr>
          <tr><td>Expiry Check</td><td>Automatic on login &mdash; expired passwords force reset</td></tr>
        </tbody>
      </table>

      <h3 style="color:var(--navy); margin:1rem 0 0.5rem; font-size:1rem;">Session Management</h3>
      <table>
        <thead><tr><th>Feature</th><th>Detail</th></tr></thead>
        <tbody>
          <tr><td>Session Timeout</td><td>30 minutes of inactivity</td></tr>
          <tr><td>Token Storage</td><td>Client-side (Bearer token in Authorization header)</td></tr>
          <tr><td>Refresh Mechanism</td><td>7-day refresh window available</td></tr>
          <tr><td>Concurrent Sessions</td><td>Not restricted (stateless JWT)</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== 5. PORTAL VIEWS ==================== -->
    <div class="section" id="portals">
      <div class="section-header">
        <span class="section-number">5</span>
        <h2 class="section-title">Portal Views</h2>
      </div>
      <p>
        The platform provides six primary portal views plus three supplementary views, each tailored to
        specific user responsibilities and access levels.
      </p>

      <!-- 5.1 Workbench -->
      <div class="card" style="margin-bottom:1.25rem;">
        <h4 style="color:var(--navy); margin-bottom:0.5rem;">5.1 &nbsp; Workbench (Central Hub)</h4>
        <p style="font-size:0.85rem; color:var(--gray-700); margin-bottom:0.5rem;">
          The Workbench is the primary landing page for authenticated users, providing an at-a-glance overview of the firm's operations.
        </p>
        <ul style="margin-left:1.25rem; font-size:0.82rem; color:var(--gray-700);">
          <li><strong>Key Statistics:</strong> Total cases, active cases, pending cases, closed cases, total leads, new leads, total documents, pending tasks, overdue tasks, total clients, total legal advisors, total revenue</li>
          <li><strong>Quick Actions:</strong> Create new case, add lead, schedule consultation, upload document, create task</li>
          <li><strong>Case Distribution Charts:</strong> Cases by type (11 categories), cases by status (7 statuses), leads by source (7 sources)</li>
          <li><strong>Recent Activity:</strong> Latest 5 cases and 5 leads with client/legal advisor details</li>
        </ul>
      </div>

      <!-- 5.2 Cases Management -->
      <div class="card" style="margin-bottom:1.25rem;">
        <h4 style="color:var(--navy); margin-bottom:0.5rem;">5.2 &nbsp; Cases Management</h4>
        <p style="font-size:0.85rem; color:var(--gray-700); margin-bottom:0.5rem;">
          Full CRUD operations for legal case management with advanced filtering and organisation.
        </p>
        <ul style="margin-left:1.25rem; font-size:0.82rem; color:var(--gray-700);">
          <li><strong>CRUD Operations:</strong> Create, read, update, and delete cases with full validation</li>
          <li><strong>Pagination:</strong> Configurable page size (default 20, max 100) with page navigation</li>
          <li><strong>Search:</strong> Full-text search across case title, description, and matter number</li>
          <li><strong>Type Filtering:</strong> Filter by 11 case types (family law, criminal defence, civil litigation, conveyancing, estate planning, corporate/commercial, debt collection, immigration, labour law, personal injury, other)</li>
          <li><strong>Status Workflow:</strong> intake &rarr; pending_review &rarr; active &rarr; on_hold &rarr; settled &rarr; closed &rarr; archived</li>
          <li><strong>Urgency Levels:</strong> low, medium, high, critical</li>
          <li><strong>Assignments:</strong> Lead legal advisor, support paralegal, client association</li>
          <li><strong>High-Risk Detection:</strong> Automated flagging for cases involving serious crimes</li>
        </ul>
      </div>

      <!-- 5.3 Leads Pipeline -->
      <div class="card" style="margin-bottom:1.25rem;">
        <h4 style="color:var(--navy); margin-bottom:0.5rem;">5.3 &nbsp; Leads Pipeline</h4>
        <p style="font-size:0.85rem; color:var(--gray-700); margin-bottom:0.5rem;">
          End-to-end lead tracking from initial contact through to conversion.
        </p>
        <ul style="margin-left:1.25rem; font-size:0.82rem; color:var(--gray-700);">
          <li><strong>Lead Tracking:</strong> Capture name, email, phone, source, description, estimated value</li>
          <li><strong>Qualification:</strong> Lead scoring (1-100), qualification notes, SLA deadlines</li>
          <li><strong>Conversion:</strong> Convert qualified leads to active cases with single click</li>
          <li><strong>Status Pipeline:</strong> new &rarr; contacted &rarr; qualified &rarr; consultation_scheduled &rarr; retained / lost / disqualified</li>
          <li><strong>Source Tracking:</strong> website, referral, walk-in, social media, advertisement, cold call, other</li>
          <li><strong>Assignment:</strong> Paralegal and officer assignment with automatic workload tracking</li>
        </ul>
      </div>

      <!-- 5.4 Document Management -->
      <div class="card" style="margin-bottom:1.25rem;">
        <h4 style="color:var(--navy); margin-bottom:0.5rem;">5.4 &nbsp; Document Management</h4>
        <p style="font-size:0.85rem; color:var(--gray-700); margin-bottom:0.5rem;">
          Comprehensive document lifecycle management with workflow controls and versioning.
        </p>
        <ul style="margin-left:1.25rem; font-size:0.82rem; color:var(--gray-700);">
          <li><strong>Upload:</strong> Multi-format document upload with case association and metadata</li>
          <li><strong>Document Types:</strong> contract, pleading, correspondence, court filing, affidavit, opinion, memo, invoice, consent form, ID document, other</li>
          <li><strong>Workflow States:</strong></li>
        </ul>
        <div class="flow" style="margin-left:1.25rem;">
          <span class="flow-step">Draft</span>
          <span class="flow-arrow">&rarr;</span>
          <span class="flow-step">Review</span>
          <span class="flow-arrow">&rarr;</span>
          <span class="flow-step">Approved</span>
          <span class="flow-arrow">&rarr;</span>
          <span class="flow-step">Signed</span>
          <span class="flow-arrow">&rarr;</span>
          <span class="flow-step">Filed</span>
          <span class="flow-arrow">&rarr;</span>
          <span class="flow-step">Archived</span>
        </div>
        <ul style="margin-left:1.25rem; font-size:0.82rem; color:var(--gray-700);">
          <li><strong>Version Control:</strong> Automatic version incrementing on each modification</li>
          <li><strong>Lock/Unlock:</strong> Document locking to prevent concurrent edits with user tracking</li>
          <li><strong>Approval Chain:</strong> Preparer, approver, signer, and supervising officer tracking</li>
        </ul>
      </div>

      <!-- 5.5 Consultations -->
      <div class="card" style="margin-bottom:1.25rem;">
        <h4 style="color:var(--navy); margin-bottom:0.5rem;">5.5 &nbsp; Consultations</h4>
        <p style="font-size:0.85rem; color:var(--gray-700); margin-bottom:0.5rem;">
          Scheduling and management of client-legal advisor consultations across multiple meeting formats.
        </p>
        <ul style="margin-left:1.25rem; font-size:0.82rem; color:var(--gray-700);">
          <li><strong>Scheduling:</strong> Date, time, and duration (default 60 min) with case association</li>
          <li><strong>Meeting Types:</strong> In-person, Video Call, Phone Call</li>
          <li><strong>Status Tracking:</strong> scheduled &rarr; confirmed &rarr; completed / cancelled / no_show</li>
          <li><strong>Notes:</strong> Consultation notes with legal advisor-only visibility</li>
        </ul>
      </div>

      <!-- 5.6 Tasks Management -->
      <div class="card" style="margin-bottom:1.25rem;">
        <h4 style="color:var(--navy); margin-bottom:0.5rem;">5.6 &nbsp; Tasks Management</h4>
        <p style="font-size:0.85rem; color:var(--gray-700); margin-bottom:0.5rem;">
          Task assignment and tracking with priority levels and deadline management.
        </p>
        <ul style="margin-left:1.25rem; font-size:0.82rem; color:var(--gray-700);">
          <li><strong>Priority Levels:</strong> low, medium, high, urgent</li>
          <li><strong>Status Tracking:</strong> pending &rarr; in_progress &rarr; completed / overdue / cancelled</li>
          <li><strong>Assignments:</strong> Task creator and assignee with automatic user association</li>
          <li><strong>Case Linking:</strong> Tasks optionally linked to cases for contextual tracking</li>
          <li><strong>Deadlines:</strong> Due date tracking with automatic overdue detection</li>
        </ul>
      </div>

      <!-- 5.7 Staff Portal -->
      <div class="card" style="margin-bottom:1.25rem;">
        <h4 style="color:var(--navy); margin-bottom:0.5rem;">5.7 &nbsp; Staff Portal</h4>
        <p style="font-size:0.85rem; color:var(--gray-700); margin-bottom:0.5rem;">
          Organisation structure and staff management with hierarchical supervisor relationships.
        </p>
        <ul style="margin-left:1.25rem; font-size:0.82rem; color:var(--gray-700);">
          <li><strong>Staff Directory:</strong> Full listing with role, department, bar number, and hire date</li>
          <li><strong>Org Structure:</strong> Supervisor/supervisee hierarchy traversal</li>
          <li><strong>Legal Advisor Profiles:</strong> LPC number, specializations, hourly rate, availability status, verification</li>
          <li><strong>Department Filter:</strong> 12 departments (management, litigation, conveyancing, family law, corporate, criminal law, estate planning, consulting, HR, finance, IT, administration)</li>
          <li><strong>Availability Status:</strong> available, busy, on_leave, unavailable</li>
        </ul>
      </div>

      <!-- 5.8 Analytics Dashboard -->
      <div class="card" style="margin-bottom:1.25rem;">
        <h4 style="color:var(--navy); margin-bottom:0.5rem;">5.8 &nbsp; Analytics Dashboard</h4>
        <p style="font-size:0.85rem; color:var(--gray-700); margin-bottom:0.5rem;">
          Business intelligence and operational analytics for firm leadership.
        </p>
        <ul style="margin-left:1.25rem; font-size:0.82rem; color:var(--gray-700);">
          <li><strong>Revenue Tracking:</strong> Total estimated case values, revenue aggregation</li>
          <li><strong>Case Statistics:</strong> Distribution by type, status, and urgency</li>
          <li><strong>Firm Health:</strong> API call volumes, error rates, response times</li>
          <li><strong>Time Periods:</strong> 7-day, 30-day, 90-day, and 1-year analysis windows</li>
          <li><strong>Top Endpoints:</strong> Most-used API endpoints with call counts</li>
          <li><strong>Error Breakdown:</strong> Errors by type (runtime, API, database, auth, validation, network)</li>
          <li><strong>Access Control:</strong> Restricted to roles with <code>VIEW_ANALYTICS</code> permission</li>
        </ul>
      </div>

      <!-- 5.9 Pricing Plans -->
      <div class="card" style="margin-bottom:1.25rem;">
        <h4 style="color:var(--navy); margin-bottom:0.5rem;">5.9 &nbsp; Pricing Plans</h4>
        <p style="font-size:0.85rem; color:var(--gray-700); margin-bottom:0.5rem;">
          Subscription-based pricing model with three tiers tailored for different practice needs.
        </p>
        <table>
          <thead><tr><th>Plan</th><th>Monthly (ZAR)</th><th>Focus Area</th></tr></thead>
          <tbody>
            <tr><td><strong>Civil</strong></td><td>R99/mo</td><td>Civil litigation, conveyancing, corporate matters</td></tr>
            <tr><td><strong>Labour</strong></td><td>R99/mo</td><td>Labour law, CCMA matters, employment disputes</td></tr>
            <tr><td><strong>Extensive</strong></td><td>R139/mo</td><td>Full-spectrum practice covering all case types</td></tr>
          </tbody>
        </table>
        <p style="font-size:0.82rem; color:var(--gray-500);">
          Each plan includes configurable case limits, document limits, and feature sets. Annual pricing is available with savings.
          Subscription statuses include: active, past_due, cancelled, expired, and trialing.
        </p>
      </div>
    </div>

    <!-- ==================== 6. RBAC ==================== -->
    <div class="section" id="rbac">
      <div class="section-header">
        <span class="section-number">6</span>
        <h2 class="section-title">Role-Based Access Control</h2>
      </div>
      <p>
        The platform implements a comprehensive RBAC system with 16 distinct roles organised in a
        hierarchical tier system. Higher-tier roles inherently have more permissions. The system
        supports 30 individual permissions across 6 categories.
      </p>

      <h3 style="color:var(--navy); margin:1rem 0 0.5rem; font-size:1rem;">Role Hierarchy</h3>
      <table>
        <thead><tr><th>Role</th><th>Tier</th><th>Department</th><th>Permission Count</th></tr></thead>
        <tbody>
          <tr><td>Managing Director</td><td>100</td><td>Management</td><td>30 (All)</td></tr>
          <tr><td>Senior Partner</td><td>95</td><td>Management</td><td>23</td></tr>
          <tr><td>Systems Admin</td><td>90</td><td>IT</td><td>9</td></tr>
          <tr><td>Supervising Officer</td><td>80</td><td>Management</td><td>17</td></tr>
          <tr><td>Legal Officer</td><td>75</td><td>Litigation</td><td>15</td></tr>
          <tr><td>Associate</td><td>70</td><td>Litigation</td><td>9</td></tr>
          <tr><td>Senior Consultant</td><td>65</td><td>Consulting</td><td>7</td></tr>
          <tr><td>HR Manager</td><td>60</td><td>HR</td><td>5</td></tr>
          <tr><td>Finance Manager</td><td>60</td><td>Finance</td><td>4</td></tr>
          <tr><td>Consultant</td><td>55</td><td>Consulting</td><td>4</td></tr>
          <tr><td>Paralegal</td><td>50</td><td>Litigation</td><td>6</td></tr>
          <tr><td>Candidate Legal Advisor</td><td>45</td><td>Litigation</td><td>5</td></tr>
          <tr><td>Office Administrator</td><td>40</td><td>Administration</td><td>3</td></tr>
          <tr><td>Receptionist</td><td>30</td><td>Administration</td><td>2</td></tr>
          <tr><td>Client</td><td>10</td><td>&mdash;</td><td>3</td></tr>
          <tr><td>Guest</td><td>5</td><td>&mdash;</td><td>0</td></tr>
        </tbody>
      </table>

      <h3 style="color:var(--navy); margin:1.5rem 0 0.5rem; font-size:1rem;">Permission Categories (30 Total)</h3>
      <table>
        <thead><tr><th>Category</th><th>Permissions</th></tr></thead>
        <tbody>
          <tr>
            <td><span class="badge badge-navy">Cases (8)</span></td>
            <td>view_all_cases, view_own_cases, create_case, edit_case, delete_case, assign_case, close_case, archive_case</td>
          </tr>
          <tr>
            <td><span class="badge badge-gold">Documents (6)</span></td>
            <td>view_documents, upload_document, approve_document, sign_document, delete_document</td>
          </tr>
          <tr>
            <td><span class="badge badge-green">Leads (5)</span></td>
            <td>view_leads, create_lead, edit_lead, convert_lead, delete_lead</td>
          </tr>
          <tr>
            <td><span class="badge badge-purple">Tasks (4)</span></td>
            <td>view_tasks, create_task, edit_task, delete_task</td>
          </tr>
          <tr>
            <td><span class="badge badge-red">User Mgmt (5)</span></td>
            <td>manage_users, view_users, create_user, edit_user, deactivate_user</td>
          </tr>
          <tr>
            <td><span class="badge badge-gray">Admin (7)</span></td>
            <td>view_privileged_notes, create_privileged_note, view_audit_logs, view_analytics, manage_system, view_billing, manage_subscriptions, run_backups</td>
          </tr>
        </tbody>
      </table>

      <h3 style="color:var(--navy); margin:1.5rem 0 0.5rem; font-size:1rem;">Role Groups</h3>
      <table>
        <thead><tr><th>Group</th><th>Roles</th></tr></thead>
        <tbody>
          <tr><td>Legal Staff</td><td>Associate, Paralegal, Candidate Legal Advisor</td></tr>
          <tr><td>Officers</td><td>Legal Officer, Supervising Officer</td></tr>
          <tr><td>Directors</td><td>Managing Director, Senior Partner</td></tr>
          <tr><td>Portal Staff</td><td>Associate, Paralegal, Legal Officer, Supervising Officer, Candidate Legal Advisor</td></tr>
          <tr><td>Admin Staff</td><td>Managing Director, Senior Partner, Systems Admin</td></tr>
          <tr><td>All Staff</td><td>14 roles (excluding Client and Guest)</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== 7. API ENDPOINTS ==================== -->
    <div class="section" id="api">
      <div class="section-header">
        <span class="section-number">7</span>
        <h2 class="section-title">API Endpoints</h2>
      </div>
      <p>
        The platform exposes a comprehensive REST API through Next.js API routes. All endpoints
        require authentication (Bearer token) unless noted. Endpoints enforce RBAC permissions
        and rate limiting as appropriate.
      </p>

      <table>
        <thead><tr><th>Endpoint</th><th>Method</th><th>Description</th><th>Auth</th></tr></thead>
        <tbody>
          <tr><td><code>/api/health</code></td><td>GET</td><td>System health check and database connectivity</td><td>No</td></tr>
          <tr><td><code>/api/auth/login</code></td><td>POST</td><td>Authenticate user, return JWT token</td><td>No</td></tr>
          <tr><td><code>/api/auth/signup</code></td><td>POST</td><td>Register new user account</td><td>No</td></tr>
          <tr><td><code>/api/dashboard</code></td><td>GET</td><td>Dashboard statistics, charts, and recent activity</td><td>Yes</td></tr>
          <tr><td><code>/api/cases</code></td><td>GET</td><td>List cases with pagination, search, and type filtering</td><td>Yes</td></tr>
          <tr><td><code>/api/cases</code></td><td>POST</td><td>Create a new case</td><td>Yes</td></tr>
          <tr><td><code>/api/leads</code></td><td>GET</td><td>List leads with pagination and filtering</td><td>Yes</td></tr>
          <tr><td><code>/api/leads</code></td><td>POST</td><td>Create a new lead</td><td>Yes</td></tr>
          <tr><td><code>/api/documents</code></td><td>GET</td><td>List documents with filtering</td><td>Yes</td></tr>
          <tr><td><code>/api/documents</code></td><td>POST</td><td>Upload a new document</td><td>Yes</td></tr>
          <tr><td><code>/api/tasks</code></td><td>GET</td><td>List tasks with pagination and priority filtering</td><td>Yes</td></tr>
          <tr><td><code>/api/tasks</code></td><td>POST</td><td>Create a new task</td><td>Yes</td></tr>
          <tr><td><code>/api/consultations</code></td><td>GET</td><td>List consultations with status filtering</td><td>Yes</td></tr>
          <tr><td><code>/api/consultations</code></td><td>POST</td><td>Schedule a new consultation</td><td>Yes</td></tr>
          <tr><td><code>/api/staff</code></td><td>GET</td><td>Staff directory with department and role filtering</td><td>Yes</td></tr>
          <tr><td><code>/api/analytics</code></td><td>GET</td><td>Analytics data with time-period filtering</td><td>Yes + Permission</td></tr>
          <tr><td><code>/api/notifications</code></td><td>GET</td><td>User notifications with read/unread filtering</td><td>Yes</td></tr>
          <tr><td><code>/api/notifications</code></td><td>PATCH</td><td>Mark notifications as read</td><td>Yes</td></tr>
          <tr><td><code>/api/backup</code></td><td>POST</td><td>Trigger database backup</td><td>Yes + Admin</td></tr>
          <tr><td><code>/api/backup</code></td><td>GET</td><td>List backup records</td><td>Yes + Admin</td></tr>
          <tr><td><code>/api/report</code></td><td>GET</td><td>Generate this client functionality report</td><td>No</td></tr>
        </tbody>
      </table>

      <div class="callout callout-info">
        <strong>Common Query Parameters</strong>
        <ul style="margin:0.25rem 0 0 1.25rem; font-size:0.82rem;">
          <li><code>page</code> &mdash; Page number (default: 1)</li>
          <li><code>perPage</code> &mdash; Items per page (default: 20, max: 100)</li>
          <li><code>search</code> &mdash; Full-text search query</li>
          <li><code>status</code> &mdash; Filter by status enum</li>
          <li><code>type</code> &mdash; Filter by type/category</li>
          <li><code>priority</code> &mdash; Filter by priority level</li>
        </ul>
      </div>
    </div>

    <!-- ==================== 8. DATABASE SCHEMA ==================== -->
    <div class="section" id="database">
      <div class="section-header">
        <span class="section-number">8</span>
        <h2 class="section-title">Database Schema</h2>
      </div>
      <p>
        The database is implemented in PostgreSQL via Prisma ORM with 22 models, 18 enums, and comprehensive
        indexing for query performance. All models use CUID identifiers and automatic timestamps.
      </p>

      <div class="schema-model">
        <h4>User</h4>
        <div class="schema-fields">
          <span><code>id</code> String (CUID, PK)</span>
          <span><code>email</code> String (unique)</span>
          <span><code>password</code> String</span>
          <span><code>full_name</code> String?</span>
          <span><code>phone</code> String?</span>
          <span><code>role</code> UserRole</span>
          <span><code>department</code> Department?</span>
          <span><code>bar_number</code> String?</span>
          <span><code>hire_date</code> DateTime?</span>
          <span><code>is_active</code> Boolean</span>
          <span><code>password_expires_at</code> DateTime?</span>
          <span><code>last_password_change</code> DateTime?</span>
          <span><code>supervisor_id</code> String? (FK → User)</span>
          <span><code>email_verified</code> Boolean</span>
        </div>
      </div>

      <div class="schema-model">
        <h4>Case</h4>
        <div class="schema-fields">
          <span><code>id</code> String (CUID, PK)</span>
          <span><code>matter_number</code> String (unique)</span>
          <span><code>title</code> String</span>
          <span><code>description</code> String?</span>
          <span><code>case_type</code> CaseType</span>
          <span><code>urgency</code> CaseUrgency</span>
          <span><code>status</code> CaseStatus</span>
          <span><code>client_id</code> String (FK → User)</span>
          <span><code>lead_attorney_id</code> String? (FK → User)</span>
          <span><code>support_paralegal_id</code> String? (FK → User)</span>
          <span><code>estimated_value</code> Float?</span>
          <span><code>is_high_risk</code> Boolean</span>
          <span><code>court_date</code> DateTime?</span>
          <span><code>next_action</code> String?</span>
          <span><code>ai_analysis</code> String?</span>
        </div>
      </div>

      <div class="schema-model">
        <h4>Lead</h4>
        <div class="schema-fields">
          <span><code>id</code> String (CUID, PK)</span>
          <span><code>name</code> String</span>
          <span><code>email</code> String</span>
          <span><code>phone</code> String?</span>
          <span><code>source</code> LeadSource</span>
          <span><code>status</code> LeadStatus</span>
          <span><code>case_type</code> CaseType?</span>
          <span><code>lead_score</code> Int?</span>
          <span><code>estimated_value</code> Float?</span>
          <span><code>assigned_paralegal_id</code> String? (FK)</span>
          <span><code>assigned_officer_id</code> String? (FK)</span>
          <span><code>sla_deadline</code> DateTime?</span>
          <span><code>converted_case_id</code> String?</span>
        </div>
      </div>

      <div class="schema-model">
        <h4>Document</h4>
        <div class="schema-fields">
          <span><code>id</code> String (CUID, PK)</span>
          <span><code>title</code> String</span>
          <span><code>case_id</code> String (FK → Case)</span>
          <span><code>document_type</code> DocumentType</span>
          <span><code>workflow_status</code> WorkflowStatus</span>
          <span><code>version</code> Int</span>
          <span><code>file_url</code> String?</span>
          <span><code>is_locked</code> Boolean</span>
          <span><code>prepared_by</code> String? (FK → User)</span>
          <span><code>approved_by</code> String? (FK → User)</span>
          <span><code>signed_by</code> String? (FK → User)</span>
          <span><code>supervising_officer</code> String? (FK → User)</span>
        </div>
      </div>

      <div class="schema-model">
        <h4>Task</h4>
        <div class="schema-fields">
          <span><code>id</code> String (CUID, PK)</span>
          <span><code>title</code> String</span>
          <span><code>description</code> String?</span>
          <span><code>case_id</code> String? (FK → Case)</span>
          <span><code>assigned_to</code> String (FK → User)</span>
          <span><code>created_by</code> String (FK → User)</span>
          <span><code>priority</code> TaskPriority</span>
          <span><code>status</code> TaskStatus</span>
          <span><code>due_date</code> DateTime?</span>
          <span><code>completed_date</code> DateTime?</span>
        </div>
      </div>

      <div class="schema-model">
        <h4>Consultation</h4>
        <div class="schema-fields">
          <span><code>id</code> String (CUID, PK)</span>
          <span><code>client_id</code> String (FK → User)</span>
          <span><code>attorney_id</code> String (FK → User)</span>
          <span><code>case_id</code> String? (FK → Case)</span>
          <span><code>scheduled_date</code> DateTime</span>
          <span><code>scheduled_time</code> String</span>
          <span><code>duration_minutes</code> Int</span>
          <span><code>status</code> ConsultationStatus</span>
          <span><code>meeting_type</code> MeetingType</span>
          <span><code>notes</code> String?</span>
        </div>
      </div>

      <div class="schema-model">
        <h4>AuditLog</h4>
        <div class="schema-fields">
          <span><code>id</code> String (CUID, PK)</span>
          <span><code>user_id</code> String? (FK → User)</span>
          <span><code>action</code> String</span>
          <span><code>resource_type</code> String</span>
          <span><code>resource_id</code> String?</span>
          <span><code>details</code> String?</span>
          <span><code>ip_address</code> String?</span>
          <span><code>user_agent</code> String?</span>
        </div>
      </div>

      <div class="schema-model">
        <h4>ConsentLog</h4>
        <div class="schema-fields">
          <span><code>id</code> String (CUID, PK)</span>
          <span><code>user_id</code> String? (FK → User)</span>
          <span><code>consent_type</code> ConsentType</span>
          <span><code>purpose</code> String</span>
          <span><code>granted</code> Boolean</span>
          <span><code>ip_address</code> String?</span>
          <span><code>user_agent</code> String?</span>
        </div>
      </div>

      <div class="schema-model">
        <h4>PricingPlan / UserSubscription</h4>
        <div class="schema-fields">
          <span><code>PricingPlan.id</code> String (CUID, PK)</span>
          <span><code>PricingPlan.name</code> String</span>
          <span><code>PricingPlan.slug</code> String (unique)</span>
          <span><code>PricingPlan.price_monthly</code> Float</span>
          <span><code>PricingPlan.price_annual</code> Float?</span>
          <span><code>PricingPlan.features</code> String (JSON)</span>
          <span><code>UserSubscription.status</code> SubscriptionStatus</span>
          <span><code>UserSubscription.plan_id</code> String (FK → PricingPlan)</span>
        </div>
      </div>

      <div class="schema-model">
        <h4>Supporting Models</h4>
        <div class="schema-fields">
          <span><code>Profile</code> — User profile denormalization</span>
          <span><code>Message</code> — Case messages &amp; notes</span>
          <span><code>Notification</code> — User notifications</span>
          <span><code>CaseTimeline</code> — Case audit trail</span>
          <span><code>PrivilegedNote</code> — Legal advisor-client privilege notes</span>
          <span><code>Attorney</code> — Legal advisor-specific profile</span>
          <span><code>IntakeSubmission</code> — Client intake form data</span>
          <span><code>ApiAnalytic</code> — API call tracking</span>
          <span><code>ErrorLog</code> — Error tracking and resolution</span>
          <span><code>RateLimitLog</code> — Rate limit violation logging</span>
          <span><code>BackupRecord</code> — Database backup tracking</span>
          <span><code>LeadAssignment</code> — Lead assignment history</span>
        </div>
      </div>

      <h3 style="color:var(--navy); margin:1.5rem 0 0.5rem; font-size:1rem;">Enums (17 Total)</h3>
      <table>
        <thead><tr><th>Enum</th><th>Values</th></tr></thead>
        <tbody>
          <tr><td>UserRole</td><td>16 roles (see RBAC section)</td></tr>
          <tr><td>Department</td><td>12 departments</td></tr>
          <tr><td>CaseType</td><td>11 types</td></tr>
          <tr><td>CaseUrgency</td><td>low, medium, high, critical</td></tr>
          <tr><td>CaseStatus</td><td>7 statuses</td></tr>
          <tr><td>LeadSource</td><td>7 sources</td></tr>
          <tr><td>LeadStatus</td><td>7 statuses</td></tr>
          <tr><td>DocumentType</td><td>11 types</td></tr>
          <tr><td>WorkflowStatus</td><td>6 statuses</td></tr>
          <tr><td>TaskPriority</td><td>low, medium, high, urgent</td></tr>
          <tr><td>TaskStatus</td><td>5 statuses</td></tr>
          <tr><td>MessageType</td><td>message, note, system, alert</td></tr>
          <tr><td>ConsentType</td><td>5 types (see POPIA section)</td></tr>
          <tr><td>NotificationType</td><td>8 types</td></tr>
          <tr><td>ConsultationStatus</td><td>5 statuses</td></tr>
          <tr><td>MeetingType</td><td>in_person, video_call, phone_call</td></tr>
          <tr><td>SubscriptionStatus</td><td>5 statuses</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== 9. POPIA COMPLIANCE ==================== -->
    <div class="section" id="popia">
      <div class="section-header">
        <span class="section-number">9</span>
        <h2 class="section-title">POPIA Compliance</h2>
      </div>
      <p>
        The Protection of Personal Information Act (POPIA) is South Africa's comprehensive data
        protection legislation. Infinity Legal ZA implements the following measures to ensure
        compliance with POPIA requirements.
      </p>

      <h3 style="color:var(--navy); margin:1rem 0 0.5rem; font-size:1rem;">Consent Management</h3>
      <p>
        The platform maintains a detailed ConsentLog model that records every consent action:
      </p>
      <table>
        <thead><tr><th>Consent Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data_processing</code></td><td>Consent for general data processing activities</td></tr>
          <tr><td><code>marketing</code></td><td>Consent for marketing communications</td></tr>
          <tr><td><code>third_party_sharing</code></td><td>Consent for sharing data with third parties</td></tr>
          <tr><td><code>automated_decision</code></td><td>Consent for automated decision-making processes</td></tr>
          <tr><td><code>popia_general</code></td><td>General POPIA consent acknowledgement</td></tr>
        </tbody>
      </table>
      <p>
        Each consent record includes: user_id, consent_type, purpose, granted (boolean),
        ip_address, user_agent, and timestamp. This creates an immutable audit trail of all
        consent actions.
      </p>

      <h3 style="color:var(--navy); margin:1rem 0 0.5rem; font-size:1rem;">Data Protection Measures</h3>
      <table>
        <thead><tr><th>Measure</th><th>Implementation</th></tr></thead>
        <tbody>
          <tr><td>Encryption at Rest</td><td>AES-256-GCM encryption for sensitive data fields</td></tr>
          <tr><td>Encryption in Transit</td><td>HSTS with 2-year max-age, HTTPS enforced</td></tr>
          <tr><td>PII Redaction</td><td>Automated redaction of SA ID numbers (13-digit), phone numbers, email addresses, and credit card numbers</td></tr>
          <tr><td>Access Controls</td><td>16-role RBAC with 30 permissions ensuring data is only accessible to authorised personnel</td></tr>
          <tr><td>Audit Trail</td><td>Complete logging of data access, modifications, and consent changes</td></tr>
          <tr><td>Session Security</td><td>30-minute inactivity timeout, JWT with 24-hour expiry</td></tr>
          <tr><td>Input Sanitization</td><td>XSS payload stripping and HTML entity encoding for all user inputs</td></tr>
          <tr><td>Intake Consent</td><td>Client intake forms require explicit consent and POPIA acknowledgement</td></tr>
          <tr><td>Privileged Notes</td><td>Three-tier visibility controls (officer_only, managing_partner_only, attorney_client) protecting legal advisor-client privilege</td></tr>
          <tr><td>High-Risk Detection</td><td>Automated flagging of cases involving serious crimes for enhanced data protection</td></tr>
        </tbody>
      </table>

      <div class="callout callout-warning">
        <strong>POPIA Compliance Note</strong>
        While the platform implements robust technical controls for POPIA compliance, firms should also
        establish organisational measures including an Information Officer designation, data processing
        agreements with third parties, and regular POPIA impact assessments.
      </div>
    </div>

    <!-- ==================== 10. DEPLOYMENT ==================== -->
    <div class="section" id="deployment">
      <div class="section-header">
        <span class="section-number">10</span>
        <h2 class="section-title">Deployment Information</h2>
      </div>

      <table>
        <thead><tr><th>Item</th><th>Detail</th></tr></thead>
        <tbody>
          <tr><td>Source Repository</td><td>GitHub &mdash; Infinity Legal ZA</td></tr>
          <tr><td>Deployment Platform</td><td>Vercel (Edge Network + Serverless Functions)</td></tr>
          <tr><td>Runtime</td><td>Node.js (Vercel Serverless)</td></tr>
          <tr><td>Database Hosting</td><td>Vercel Postgres (Neon) — managed PostgreSQL with auto-backups</td></tr>
          <tr><td>CDN</td><td>Vercel Edge Network (global)</td></tr>
          <tr><td>SSL/TLS</td><td>Automatic HTTPS with HSTS preload</td></tr>
          <tr><td>CI/CD</td><td>Automatic deployment on push to main branch</td></tr>
          <tr><td>Environment Variables</td><td>JWT_SECRET, ENCRYPTION_KEY, DATABASE_URL (managed via Vercel)</td></tr>
          <tr><td>Backup Strategy</td><td>On-demand via API + scheduled automated backups (BackupRecord tracked)</td></tr>
        </tbody>
      </table>

      <div class="callout callout-success">
        <strong>Scalability Path</strong>
        The PostgreSQL database supports concurrent connections and scales automatically
        with Vercel's serverless architecture. Managed backups are provided by the database
        provider (Neon) with point-in-time recovery.
      </div>
    </div>

    <!-- ======================= FOOTER ======================= -->
    <div class="report-footer">
      <p>
        <strong>&#9878; Infinity Legal ZA</strong> &mdash; Client Functionality Report<br />
        Generated ${generatedDate} &middot; Confidential &mdash; For Authorised Recipients Only<br />
        &copy; ${new Date().getFullYear()} Infinity Legal ZA &middot; Technology Division
      </p>
    </div>

  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
