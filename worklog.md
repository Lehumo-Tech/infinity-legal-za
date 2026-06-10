---
Task ID: 1
Agent: Main Agent
Task: Migrate from Prisma/Neon to Supabase for Auth and Database, integrate AI APIs via z-ai-web-dev-sdk

Work Log:
- Installed @supabase/supabase-js and @supabase/ssr packages
- Created Supabase client infrastructure: src/lib/supabase/server.ts, browser.ts, middleware.ts, types.ts
- Created comprehensive SQL migration at supabase/migrations/001_initial_schema.sql with all 20+ tables, 15+ enums, RLS policies, triggers, and seed data
- Rewrote src/lib/db.ts to export Supabase admin client instead of Prisma
- Rewrote src/lib/auth.ts to use Supabase Auth for JWT verification while preserving RBAC system
- Rewrote src/lib/middleware.ts (now proxy.ts only for Next.js 16) with async requireAuth for Supabase
- Rewrote src/lib/audit.ts to use Supabase queries instead of Prisma
- Rewrote src/lib/security.ts to use Supabase for rate limiting instead of Prisma
- Rewrote ALL API routes (auth, cases, leads, tasks, documents, consultations, notifications, etc.) from Prisma to Supabase
- Rewrote auth routes (login, signup, forgot-password, reset-password) to use Supabase Auth
- Updated proxy.ts to include Supabase session refresh via updateSession()
- Updated next.config.ts to include Supabase domains in CSP connect-src
- Updated .env and .env.example with Supabase configuration variables
- Removed middleware.ts (kept only proxy.ts for Next.js 16 convention)
- Removed legacy files: pocketbase.ts, pb-client.ts, audit-pb.ts, db-queries.ts, db/ folder
- Updated LLM providers to make z-ai-web-dev-sdk the PRIMARY provider with fallbacks
- Created new AI API routes using z-ai-web-dev-sdk:
  - /api/ai/tts - Text to Speech
  - /api/ai/asr - Speech to Text (ASR)
  - /api/ai/vlm - Vision Language Model (image analysis)
  - /api/ai/image-gen - Image Generation
  - /api/ai/web-search - Web Search
- All lint checks pass cleanly
- Dev server starts and serves pages with 200 OK

Stage Summary:
- Complete migration from Prisma/Neon PostgreSQL to Supabase (auth + database)
- All 25+ API routes rewritten from Prisma to Supabase client
- z-ai-web-dev-sdk integrated as primary LLM provider and for TTS/ASR/VLM/ImageGen/WebSearch
- Application compiles and runs without errors
- User needs to create a Supabase project and set environment variables
- Contact details already updated in LandingPage.tsx footer (from previous session)
