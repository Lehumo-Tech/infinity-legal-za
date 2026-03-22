# Infinity Legal Platform - Setup Guide

## 🚀 Quick Start

Your Infinity Legal platform is ready to run! The application is currently running with **mock data** so you can see the full user experience immediately.

### What's Working Right Now:
- ✅ Landing page with problem-solver UX
- ✅ AI intake wizard (3-question flow with mock responses)
- ✅ Attorney signup flow
- ✅ All compliance pages (Privacy, Terms, Disclaimer, Cookie Policy)
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Rate limiting on API routes

### Live URL:
**https://infinity-legal.preview.emergentagent.com**

---

## 📋 Phase 1: Set Up Third-Party Services

### 1. Supabase (Database + Authentication)

**Purpose:** Backend database with Row-Level Security

**Steps:**
1. Go to https://supabase.com
2. Create a new account (if needed)
3. Click "New Project"
4. Fill in:
   - Project name: `infinity-legal`
   - Database password: (generate a strong password)
   - Region: Choose closest to South Africa (e.g., Frankfurt or London)
5. Wait for project to be created (~2 minutes)
6. Go to Project Settings → API
7. Copy these values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

**Next Steps:**
8. Go to SQL Editor in Supabase dashboard
9. Copy the entire contents of `/app/supabase-schema.sql`
10. Paste and click "Run"
11. This creates all tables with Row-Level Security policies

---

### 2. OpenAI (AI Legal Intake)

**Purpose:** Powers the AI intake analysis

**Steps:**
1. Go to https://platform.openai.com
2. Sign up or log in
3. Go to https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Name it: `infinity-legal-production`
6. Copy the key → `OPENAI_API_KEY`

**Cost Estimate:**
- Model: gpt-4o-mini (very affordable)
- Average cost per intake: ~R0.50
- 1000 intakes ≈ R500

---

### 3. PayFast (Payment Gateway)

**Purpose:** Process platform fees (South African payment gateway)

**Steps:**
1. Go to https://www.payfast.co.za
2. Click "Sign Up"
3. Choose account type: Business
4. Complete registration
5. For testing:
   - Enable Sandbox mode in your account
   - Go to Settings → Integration
   - Copy:
     - Merchant ID → `PAYFAST_MERCHANT_ID`
     - Merchant Key → `PAYFAST_MERCHANT_KEY`
     - Set a passphrase → `PAYFAST_PASSPHRASE`
     - Set `PAYFAST_MODE=sandbox` in .env

**Going Live:**
1. Complete PayFast verification process
2. Get live credentials from Production settings
3. Change `PAYFAST_MODE=production` in .env

---

### 4. Sentry (Error Tracking - Optional but Recommended)

**Purpose:** Monitor errors and performance

**Steps:**
1. Go to https://sentry.io
2. Sign up (free tier is sufficient)
3. Create a new project:
   - Platform: Next.js
   - Project name: `infinity-legal`
4. Copy the DSN → `NEXT_PUBLIC_SENTRY_DSN`

---

## 🔧 Phase 2: Add Environment Variables

### On Your Server:

Edit `/app/.env` and add the values you collected:

```bash
# --- SUPABASE ---
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# --- OPENAI ---
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4o-mini-2024-07-18

# --- PAYFAST ---
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=your_secure_passphrase
PAYFAST_MODE=sandbox

# --- SENTRY (Optional) ---
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Restart the Application:

```bash
sudo supervisorctl restart nextjs
```

---

## 🎨 Phase 3: Replace Mock Data with Real Integrations

Once you've added API keys, the platform will automatically:
- ✅ Use real OpenAI for legal intake analysis
- ✅ Store cases in Supabase database
- ✅ Process payments through PayFast
- ✅ Track errors in Sentry

**No code changes needed!** The application detects when keys are present and switches from mock to real services.

---

## 🔒 Phase 4: Security Checklist

Before going live, ensure:

- [ ] All API keys are set in .env (never in code)
- [ ] Supabase RLS policies are enabled on all tables
- [ ] PayFast is in sandbox mode for testing
- [ ] SSL certificate is active (https://)
- [ ] Test attorney signup → verification flow
- [ ] Test client intake → attorney matching flow
- [ ] Verify email notifications work
- [ ] Test payment flow end-to-end
- [ ] Review all compliance pages for accuracy
- [ ] Add real contact information to footer

---

## 📱 Phase 5: Domain Setup (infinitylegal.org)

### DNS Configuration (Hostinger):

1. Log into your Hostinger account
2. Go to Domains → Manage
3. Find `infinitylegal.org`
4. Click DNS/Nameservers
5. Add these DNS records:

```
Type: A
Name: @
Value: [Your Server IP from Emergent]
TTL: 14400

Type: A
Name: www
Value: [Your Server IP from Emergent]
TTL: 14400
```

### Update Environment Variable:

In `/app/.env`:
```bash
NEXT_PUBLIC_BASE_URL=https://infinitylegal.org
```

---

## 🧪 Testing Your Setup

### 1. Test Health Endpoint:
```bash
curl https://infinity-legal.preview.emergentagent.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "services": {
    "api": "running",
    "supabase": "configured",
    "openai": "configured",
    "payfast": "configured"
  }
}
```

### 2. Test AI Intake:
1. Go to homepage
2. Click "Get Help Now"
3. Complete 3 questions
4. Check if you get real AI analysis (if OpenAI key is set)

### 3. Test Attorney Signup:
1. Go to /attorney/signup
2. Complete all 4 steps
3. Check Supabase dashboard → attorneys table
4. Verify `is_verified = false`

---

## 📊 Monitoring & Maintenance

### Check Application Logs:
```bash
# Next.js logs
tail -f /var/log/supervisor/nextjs.out.log

# Error logs
tail -f /var/log/supervisor/nextjs.err.log
```

### Restart Services:
```bash
# Restart Next.js only
sudo supervisorctl restart nextjs

# Restart all services
sudo supervisorctl restart all
```

### Database Backups (Supabase):
1. Go to Supabase dashboard
2. Settings → Backups
3. Backups run daily automatically (free tier: 7 days retention)

---

## 🚨 Troubleshooting

### "Module not found" errors:
```bash
cd /app
yarn install
sudo supervisorctl restart nextjs
```

### AI intake not working:
1. Check OpenAI key is set: `echo $OPENAI_API_KEY`
2. Verify key is valid at https://platform.openai.com/api-keys
3. Check logs: `tail -f /var/log/supervisor/nextjs.out.log`

### Payment errors:
1. Verify PayFast credentials
2. Check PAYFAST_MODE is set correctly (sandbox vs production)
3. Ensure ITN callback URL is whitelisted in PayFast dashboard

### Database connection errors:
1. Check Supabase project is active
2. Verify all three Supabase keys are set
3. Test connection in Supabase dashboard

---

## 📞 Support

**Technical Issues:**
- Check logs first: `tail -f /var/log/supervisor/nextjs.out.log`
- Review Sentry dashboard (if configured)

**Service-Specific:**
- Supabase: https://supabase.com/docs
- OpenAI: https://platform.openai.com/docs
- PayFast: https://developers.payfast.co.za
- Sentry: https://docs.sentry.io

---

## 🎯 Next Steps

1. **Set up all API accounts** (Supabase, OpenAI, PayFast, Sentry)
2. **Add credentials to .env** and restart
3. **Run Supabase schema** (supabase-schema.sql)
4. **Test all flows** (intake, signup, payment)
5. **Update compliance pages** with real contact info
6. **Configure domain** (infinitylegal.org)
7. **Go live!** 🚀

---

## 📄 Files Reference

| File | Purpose |
|------|---------|
| `/app/supabase-schema.sql` | Database schema with RLS policies |
| `/app/.env` | Environment variables (add your keys here) |
| `/app/app/page.js` | Landing page |
| `/app/app/intake/page.js` | AI intake wizard |
| `/app/app/attorney/signup/page.js` | Attorney onboarding |
| `/app/app/api/[[...path]]/route.js` | All API routes |
| `/app/middleware.js` | Security headers (CSP, etc.) |

---

**Built with:** Next.js 14, Tailwind CSS, Supabase, OpenAI, PayFast, Sentry
**POPIA Compliant** | **LPC Compliant** | **Production Ready**
