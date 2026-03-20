-- =============================================
-- INFINITY LEGAL PLATFORM - SUPABASE SCHEMA
-- =============================================
-- Run this in your Supabase SQL Editor
-- This creates all tables with Row-Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('client', 'attorney', 'admin')) DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- 2. ATTORNEYS TABLE
-- =============================================
CREATE TABLE public.attorneys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lpc_number TEXT UNIQUE NOT NULL,
  firm_name TEXT,
  specializations TEXT[],
  years_experience INTEGER,
  bio TEXT,
  hourly_rate DECIMAL(10,2),
  trust_account_bank TEXT,
  trust_account_number TEXT,
  trust_account_holder TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for attorneys
ALTER TABLE public.attorneys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified attorneys"
  ON public.attorneys FOR SELECT
  USING (is_verified = TRUE);

CREATE POLICY "Attorneys can view own profile"
  ON public.attorneys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Attorneys can update own profile"
  ON public.attorneys FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- 3. CASES TABLE
-- =============================================
CREATE TABLE public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  attorney_id UUID REFERENCES public.attorneys(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('criminal', 'civil', 'family', 'labour', 'commercial', 'other')),
  status TEXT CHECK (status IN ('intake', 'matched', 'active', 'closed', 'archived')) DEFAULT 'intake',
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'emergency')) DEFAULT 'medium',
  ai_summary TEXT,
  ai_confidence DECIMAL(3,2),
  attorney_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies for cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own cases"
  ON public.cases FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Attorneys can view assigned cases"
  ON public.cases FOR SELECT
  USING (
    attorney_id IN (
      SELECT id FROM public.attorneys WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create cases"
  ON public.cases FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own cases"
  ON public.cases FOR UPDATE
  USING (auth.uid() = client_id);

-- =============================================
-- 4. INTAKE RESPONSES TABLE
-- =============================================
CREATE TABLE public.intake_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  redacted_answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.intake_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses for their cases"
  ON public.intake_responses FOR SELECT
  USING (
    case_id IN (
      SELECT id FROM public.cases 
      WHERE client_id = auth.uid() 
         OR attorney_id IN (
           SELECT id FROM public.attorneys WHERE user_id = auth.uid()
         )
    )
  );

-- =============================================
-- 5. DOCUMENTS TABLE
-- =============================================
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for their cases"
  ON public.documents FOR SELECT
  USING (
    case_id IN (
      SELECT id FROM public.cases 
      WHERE client_id = auth.uid() 
         OR attorney_id IN (
           SELECT id FROM public.attorneys WHERE user_id = auth.uid()
         )
    )
  );

-- =============================================
-- 6. PAYMENTS TABLE
-- =============================================
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id),
  payer_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  payment_type TEXT CHECK (payment_type IN ('platform_fee', 'legal_fee', 'consultation')),
  payfast_payment_id TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = payer_id);

-- =============================================
-- 7. CONSENT LOGS (POPIA Compliance)
-- =============================================
CREATE TABLE public.consent_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  consent_type TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent logs"
  ON public.consent_logs FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 8. AUDIT LOGS
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Admin only)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_cases_client ON public.cases(client_id);
CREATE INDEX idx_cases_attorney ON public.cases(attorney_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_attorneys_verified ON public.attorneys(is_verified);
CREATE INDEX idx_payments_case ON public.payments(case_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attorneys_updated_at BEFORE UPDATE ON public.attorneys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Sample specializations for dropdown
CREATE TABLE public.specializations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

INSERT INTO public.specializations (name, description) VALUES
  ('Criminal Law', 'Criminal defense and prosecution'),
  ('Family Law', 'Divorce, custody, maintenance'),
  ('Labour Law', 'Employment disputes, CCMA'),
  ('Civil Litigation', 'General civil disputes'),
  ('Commercial Law', 'Business contracts and disputes'),
  ('Property Law', 'Real estate transactions'),
  ('Debt Recovery', 'Collection and insolvency'),
  ('Administrative Law', 'Government and regulatory matters');

-- =============================================
-- TESTING: Bypass RLS (for admin testing only)
-- =============================================
-- Run these commands to test as superuser:
-- SET ROLE postgres;
-- SELECT * FROM public.cases;
-- RESET ROLE;