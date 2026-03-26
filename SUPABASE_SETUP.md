# 🚀 Supabase Setup Instructions

## Step 1: Run the Database Schema

You need to create all the tables in your Supabase database.

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: **Infinity Legal**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `/app/supabase-schema-v2.sql`
6. Paste it into the SQL editor
7. Click **Run** (or press Ctrl+Enter)

**Expected Result:**
- ✅ 13 tables created
- ✅ All RLS policies applied
- ✅ Indexes created
- ✅ Functions and triggers set up

## Step 2: Verify Tables Were Created

1. In Supabase dashboard, click **Table Editor**
2. You should see these tables:
   - profiles
   - attorneys
   - pricing_plans (with 4 default plans)
   - user_subscriptions
   - cases
   - documents
   - tasks
   - consultation_bookings
   - attorney_earnings
   - messages
   - transactions
   - intake_responses
   - consent_logs

## Step 3: Check Pricing Plans

1. In Table Editor, click **pricing_plans**
2. You should see 4 rows:
   - Free (R0)
   - Starter (R99)
   - Family Protect (R199)
   - Premium (R349)

## Step 4: Test RLS Policies

RLS (Row Level Security) is critical for data security.

**To test:**
1. Go to SQL Editor
2. Run this query:
```sql
-- This should work (viewing active pricing plans)
SELECT * FROM pricing_plans WHERE is_active = TRUE;

-- This should return empty (no authenticated user)
SELECT * FROM cases;
```

## Step 5: Enable Authentication

1. Click **Authentication** in the left sidebar
2. Click **Providers**
3. Enable **Email** provider (should be enabled by default)
4. Optional: Configure email templates for password reset, etc.

## Step 6: Test the Connection

Once the schema is created, test the platform:

1. Go to: https://legal-intake-staging-1.preview.emergentagent.com/pricing
2. Click on any paid plan (Starter, Family Protect, or Premium)
3. Accept the terms
4. Click "Pay with PayFast"
5. Check your browser console - should see API call to `/api/payment/create-subscription`

## Common Issues

**Issue: "relation does not exist"**
- Solution: The schema wasn't run. Go back to Step 1.

**Issue: "permission denied"**
- Solution: RLS policies are working! This is expected for unauthenticated requests.

**Issue: "null value in column"**
- Solution: Check that all required columns have default values or are being provided.

## Next: Configure Authentication

After the database is set up, we'll integrate Supabase Auth so users can:
- Sign up
- Log in
- Access their cases
- Book consultations

---

**Status: Ready for Schema Setup**

Let me know once you've run the SQL schema and I'll continue with the authentication integration!
