# 🚀 Infinity Legal - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Phase 1: Third-Party Services Setup

- [ ] **Supabase Account Created**
  - [ ] Project created: `infinity-legal`
  - [ ] Copied `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] Copied `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] Copied `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] Ran `supabase-schema.sql` in SQL Editor
  - [ ] Verified all 8 tables created
  - [ ] Tested RLS policies work

- [ ] **OpenAI Account Setup**
  - [ ] Account created/verified
  - [ ] API key generated
  - [ ] Copied `OPENAI_API_KEY`
  - [ ] Tested API key works (simple curl test)
  - [ ] Set billing limits (recommended: $10/month initially)

- [ ] **PayFast Account Setup**
  - [ ] Business account created
  - [ ] Sandbox mode enabled for testing
  - [ ] Copied `PAYFAST_MERCHANT_ID`
  - [ ] Copied `PAYFAST_MERCHANT_KEY`
  - [ ] Set `PAYFAST_PASSPHRASE`
  - [ ] ITN callback URL configured
  - [ ] Test payment completed in sandbox

- [ ] **Sentry Setup (Optional)**
  - [ ] Account created
  - [ ] Next.js project created
  - [ ] Copied `NEXT_PUBLIC_SENTRY_DSN`
  - [ ] Tested error tracking works

---

### ✅ Phase 2: Environment Configuration

- [ ] **Environment Variables Set**
  ```bash
  # Verify all keys are in /app/.env
  cat /app/.env | grep -v "^#" | grep "="
  ```
  - [ ] All Supabase keys present
  - [ ] OpenAI key present
  - [ ] PayFast credentials present
  - [ ] Sentry DSN present (if using)

- [ ] **Application Restarted**
  ```bash
  sudo supervisorctl restart nextjs
  ```

- [ ] **Health Check Passed**
  ```bash
  curl https://infinity-legal-sa-1.preview.emergentagent.com/api/health
  ```
  Expected: All services show "configured"

---

### ✅ Phase 3: Integration Testing

- [ ] **AI Intake Flow**
  - [ ] Navigate to `/intake`
  - [ ] Complete 3 questions
  - [ ] Verify real OpenAI response (not mock)
  - [ ] Check case saved in Supabase `cases` table
  - [ ] Verify PII was redacted in `intake_responses` table

- [ ] **Attorney Signup**
  - [ ] Complete signup flow
  - [ ] Verify record in Supabase `attorneys` table
  - [ ] Confirm `is_verified = false`
  - [ ] Test LPC number validation (7 digits required)

- [ ] **Database Queries**
  ```sql
  -- In Supabase SQL Editor
  SELECT COUNT(*) FROM cases;
  SELECT COUNT(*) FROM attorneys WHERE is_verified = false;
  SELECT * FROM consent_logs ORDER BY created_at DESC LIMIT 5;
  ```

- [ ] **Error Tracking**
  - [ ] Trigger a test error
  - [ ] Check Sentry dashboard for logged error
  - [ ] Verify stack trace is readable

---

### ✅ Phase 4: Security Verification

- [ ] **Security Headers Check**
  ```bash
  curl -I https://infinity-legal-sa-1.preview.emergentagent.com/
  ```
  - [ ] `Content-Security-Policy` present
  - [ ] `X-Frame-Options: DENY` present
  - [ ] `X-Content-Type-Options: nosniff` present
  - [ ] `Strict-Transport-Security` present (production only)

- [ ] **Rate Limiting Test**
  ```bash
  # Send 101 requests (should fail on 101st)
  for i in {1..101}; do
    curl -s https://infinity-legal-sa-1.preview.emergentagent.com/api/health
  done
  ```
  - [ ] 101st request returns 429 (Rate limit exceeded)

- [ ] **RLS Policy Test**
  - [ ] Create test user in Supabase Auth
  - [ ] Create test case for that user
  - [ ] Try to query other users' cases (should fail)
  - [ ] Verify user can only see own data

---

### ✅ Phase 5: Content & Compliance

- [ ] **Update Contact Information**
  - [ ] Replace `[Name]` in Privacy Policy with real Information Officer name
  - [ ] Replace `[Phone Number]` with real contact number
  - [ ] Replace `[Physical Address]` with registered business address
  - [ ] Update all `support@infinitylegal.org` emails (if different)

- [ ] **Legal Review**
  - [ ] Privacy Policy reviewed by legal counsel
  - [ ] Terms of Service reviewed
  - [ ] Disclaimer reviewed
  - [ ] POPIA compliance verified
  - [ ] LPC compliance verified

- [ ] **Test All Compliance Pages**
  - [ ] `/privacy` loads and is accurate
  - [ ] `/terms` loads and is accurate
  - [ ] `/disclaimer` loads and is accurate
  - [ ] `/cookie-policy` loads and is accurate
  - [ ] All internal links work
  - [ ] All external links open in new tabs

---

### ✅ Phase 6: Domain Configuration

- [ ] **DNS Setup (Hostinger)**
  - [ ] Logged into Hostinger
  - [ ] Navigated to `infinitylegal.org` DNS settings
  - [ ] Added A record: `@` → [Server IP]
  - [ ] Added A record: `www` → [Server IP]
  - [ ] TTL set to 14400 (4 hours)

- [ ] **Environment Update**
  ```bash
  # In /app/.env
  NEXT_PUBLIC_BASE_URL=https://infinitylegal.org
  ```
  - [ ] Updated .env file
  - [ ] Restarted application
  - [ ] Tested new domain (wait for DNS propagation)

- [ ] **SSL Certificate**
  - [ ] HTTPS enforced
  - [ ] Certificate valid and not expired
  - [ ] No mixed content warnings

---

### ✅ Phase 7: Performance & Monitoring

- [ ] **Performance Test**
  - [ ] Lighthouse score > 90
  - [ ] First Contentful Paint < 2s
  - [ ] Time to Interactive < 3s
  - [ ] All images optimized

- [ ] **Mobile Testing**
  - [ ] Test on iPhone (Safari)
  - [ ] Test on Android (Chrome)
  - [ ] All forms usable on mobile
  - [ ] Navigation works on small screens

- [ ] **Browser Testing**
  - [ ] Chrome (latest)
  - [ ] Safari (latest)
  - [ ] Firefox (latest)
  - [ ] Edge (latest)

---

### ✅ Phase 8: User Acceptance Testing

- [ ] **Client Flow**
  - [ ] Land on homepage
  - [ ] Click "Get Help Now"
  - [ ] Complete intake wizard
  - [ ] Receive AI analysis
  - [ ] Click "Find Attorney Now"
  - [ ] Browse attorney profiles
  - [ ] Contact an attorney

- [ ] **Attorney Flow**
  - [ ] Navigate to `/attorney/signup`
  - [ ] Complete 4-step signup
  - [ ] Receive "pending verification" message
  - [ ] (Admin) Manually verify attorney in Supabase
  - [ ] (Attorney) Receive verification email
  - [ ] (Attorney) Log in to dashboard

---

### ✅ Phase 9: Launch Preparation

- [ ] **Backup Strategy**
  - [ ] Supabase daily backups enabled (automatic)
  - [ ] Backup retention policy understood (7 days on free tier)
  - [ ] Manual backup taken before launch

- [ ] **Monitoring Setup**
  - [ ] Sentry alerts configured
  - [ ] Email notifications enabled
  - [ ] Slack/Discord webhook (optional)

- [ ] **Documentation**
  - [ ] README.md reviewed and accurate
  - [ ] SETUP_GUIDE.md complete
  - [ ] API documentation available
  - [ ] Runbooks for common issues

---

### ✅ Phase 10: Go Live

- [ ] **Final Checks**
  - [ ] All environment variables in production
  - [ ] PayFast in PRODUCTION mode (not sandbox)
  - [ ] Domain points to production server
  - [ ] SSL certificate valid

- [ ] **Smoke Test**
  - [ ] Visit infinitylegal.org
  - [ ] Complete one full intake flow
  - [ ] Create one attorney account
  - [ ] Check Supabase for data
  - [ ] Check Sentry for any errors

- [ ] **Launch**
  - [ ] Set `PAYFAST_MODE=production` in .env
  - [ ] Restart application
  - [ ] Monitor logs for 1 hour
  - [ ] Test payment with real card (small amount)
  - [ ] Announce launch 🎉

---

## Post-Launch Monitoring (First 24 Hours)

- [ ] **Hour 1-2**
  - [ ] Check error rate in Sentry
  - [ ] Verify AI responses are appropriate
  - [ ] Monitor Supabase usage

- [ ] **Hour 3-6**
  - [ ] Review user feedback
  - [ ] Check conversion rates (intake → attorney contact)
  - [ ] Monitor payment success rate

- [ ] **Hour 7-24**
  - [ ] Analyze traffic sources
  - [ ] Review most common legal categories
  - [ ] Check attorney response times

---

## Emergency Contacts

**Technical Issues:**
- Supabase Support: https://supabase.com/support
- OpenAI Support: https://help.openai.com
- PayFast Support: 0861 729 327
- Vercel Support: https://vercel.com/support

**Logs:**
```bash
# Application logs
tail -f /var/log/supervisor/nextjs.out.log

# Error logs
tail -f /var/log/supervisor/nextjs.err.log

# Restart service
sudo supervisorctl restart nextjs
```

---

## Rollback Plan

If critical issues arise:

1. **Immediate:**
   ```bash
   # Revert to safe state
   git revert [commit-hash]
   sudo supervisorctl restart nextjs
   ```

2. **Database:**
   - Restore from Supabase backup
   - Go to: Project → Settings → Backups

3. **Domain:**
   - Point DNS back to old server if needed
   - Wait for propagation (use /etc/hosts for testing)

---

**Status:** Ready for deployment after API keys are configured
**Next Action:** Complete Phase 1 (Third-Party Services Setup)
