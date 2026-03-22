-- =============================================
-- INFINITY LEGAL PLATFORM - COMPLETE SCHEMA V2
-- =============================================
-- Run this in your Supabase SQL Editor
-- This creates all tables with Row-Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
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
  working_hours JSONB, -- {monday: {start: "09:00", end: "17:00"}, ...}
  blocked_dates DATE[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
-- 3. PRICING PLANS TABLE
-- =============================================
CREATE TABLE public.pricing_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price_zar DECIMAL(10,2) NOT NULL,
  consultation_credits INTEGER DEFAULT 0,
  storage_gb DECIMAL(5,2) DEFAULT 0,
  features JSONB, -- Array of features
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing plans"
  ON public.pricing_plans FOR SELECT
  USING (is_active = TRUE);

-- Insert default plans
INSERT INTO public.pricing_plans (name, price_zar, consultation_credits, storage_gb, features, sort_order) VALUES
('Free', 0, 0, 0, '["AI legal information", "Legal templates", "Attorney directory", "Community support"]'::jsonb, 1),
('Starter', 99, 1, 0.5, '["1 consultation credit/month", "Case tracking", "500MB storage", "Email support", "Document uploads"]'::jsonb, 2),
('Family Protect', 199, 3, 1, '["3 consultation credits/month", "Document drafting assistance", "1GB storage", "Priority support", "Family member access"]'::jsonb, 3),
('Premium', 349, 999, 2, '["Unlimited consultations (fair use)", "Emergency access", "2GB storage", "24/7 priority support", "Document review", "Court date reminders"]'::jsonb, 4);

-- =============================================
-- 4. USER SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE public.user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.pricing_plans(id),
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')) DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 month',
  credits_remaining INTEGER DEFAULT 0,
  payfast_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 5. CASES TABLE
-- =============================================
CREATE TABLE public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  attorney_id UUID REFERENCES public.attorneys(id),
  case_type TEXT CHECK (case_type IN ('criminal', 'civil', 'family', 'labour', 'commercial', 'property', 'debt', 'administrative', 'other')),
  case_subtype TEXT,
  status TEXT CHECK (status IN ('intake', 'matched', 'active', 'pending', 'closed', 'archived')) DEFAULT 'intake',
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'emergency')) DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  summary_encrypted TEXT, -- Encrypted with client-side key
  court_date DATE,
  court_location TEXT,
  notes_encrypted TEXT, -- Encrypted with client-side key
  ai_summary TEXT,
  ai_confidence DECIMAL(3,2),
  attorney_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

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

CREATE POLICY "Attorneys can update assigned cases"
  ON public.cases FOR UPDATE
  USING (
    attorney_id IN (
      SELECT id FROM public.attorneys WHERE user_id = auth.uid()
    )
  );

-- Auto-generate case number
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.case_number := 'INF-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('case_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1000;

CREATE TRIGGER set_case_number
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL)
  EXECUTE FUNCTION generate_case_number();

-- =============================================
-- 6. DOCUMENTS TABLE
-- =============================================
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes INTEGER,
  document_category TEXT CHECK (document_category IN ('contract', 'evidence', 'correspondence', 'court_filing', 'identification', 'other')),
  is_confidential BOOLEAN DEFAULT TRUE,
  is_ai_processed BOOLEAN DEFAULT FALSE,
  ai_processing_notes TEXT,
  attorney_approved BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES public.documents(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE POLICY "Users can upload documents for their cases"
  ON public.documents FOR INSERT
  WITH CHECK (
    case_id IN (
      SELECT id FROM public.cases 
      WHERE client_id = auth.uid() 
         OR attorney_id IN (
           SELECT id FROM public.attorneys WHERE user_id = auth.uid()
         )
    )
  );

-- =============================================
-- 7. TASKS TABLE
-- =============================================
CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = assigned_to OR auth.uid() = created_by);

CREATE POLICY "Users can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update assigned tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- =============================================
-- 8. CONSULTATION BOOKINGS TABLE
-- =============================================
CREATE TABLE public.consultation_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id),
  attorney_id UUID REFERENCES public.attorneys(id),
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  duration_minutes INTEGER CHECK (duration_minutes IN (30, 60)),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  consultation_type TEXT CHECK (consultation_type IN ('credit', 'direct_payment')),
  direct_payment_amount DECIMAL(10,2),
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.consultation_bookings FOR SELECT
  USING (
    auth.uid() = client_id OR 
    attorney_id IN (SELECT id FROM public.attorneys WHERE user_id = auth.uid())
  );

-- =============================================
-- 9. ATTORNEY EARNINGS TABLE
-- =============================================
CREATE TABLE public.attorney_earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  attorney_id UUID REFERENCES public.attorneys(id),
  consultation_id UUID REFERENCES public.consultation_bookings(id),
  amount_zar DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('credit', 'direct_eft', 'cash')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  platform_commission_zar DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.attorney_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attorneys can view own earnings"
  ON public.attorney_earnings FOR SELECT
  USING (
    attorney_id IN (SELECT id FROM public.attorneys WHERE user_id = auth.uid())
  );

-- =============================================
-- 10. MESSAGES TABLE
-- =============================================
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  recipient_id UUID REFERENCES public.profiles(id),
  content_encrypted TEXT NOT NULL, -- Encrypted with client-side key
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- =============================================
-- 11. TRANSACTIONS TABLE
-- =============================================
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  type TEXT CHECK (type IN ('subscription', 'consultation', 'refund')),
  payfast_transaction_id TEXT,
  payfast_signature TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 12. INTAKE RESPONSES TABLE
-- =============================================
CREATE TABLE public.intake_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  redacted_answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
-- 13. CONSENT LOGS (POPIA Compliance)
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

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent logs"
  ON public.consent_logs FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_cases_client ON public.cases(client_id);
CREATE INDEX idx_cases_attorney ON public.cases(attorney_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_court_date ON public.cases(court_date);
CREATE INDEX idx_documents_case ON public.documents(case_id);
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_bookings_attorney ON public.consultation_bookings(attorney_id);
CREATE INDEX idx_bookings_date ON public.consultation_bookings(booking_date);

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

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS BYPASS TEST SCRIPT
-- =============================================
-- Run as superuser to test RLS policies:
-- SET ROLE postgres;
-- SELECT * FROM public.cases;
-- RESET ROLE;
