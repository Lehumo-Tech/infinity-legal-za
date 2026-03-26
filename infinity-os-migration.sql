-- =============================================
-- INFINITY OS — Role-Aware Migration Script
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Extend profiles table with new role support
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('client', 'attorney', 'admin', 'legal_officer', 'paralegal', 'intake_agent', 'it_admin', 'managing_partner'));

-- Add new columns to profiles
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN department TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN bar_number TEXT UNIQUE;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN supervisor_id UUID REFERENCES public.profiles(id);
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN hire_date DATE;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. Extend cases table
DO $$ BEGIN
  ALTER TABLE public.cases ADD COLUMN lead_attorney_id UUID REFERENCES public.profiles(id);
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.cases ADD COLUMN support_paralegal_id UUID REFERENCES public.profiles(id);
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.cases ADD COLUMN lead_id UUID;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Extend documents table with workflow
DO $$ BEGIN
  ALTER TABLE public.documents ADD COLUMN workflow_status TEXT DEFAULT 'draft' 
    CHECK (workflow_status IN ('draft', 'review', 'approved', 'rejected', 'signed'));
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.documents ADD COLUMN locked_by_role TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.documents ADD COLUMN approved_by UUID REFERENCES public.profiles(id);
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.documents ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.documents ADD COLUMN signed_by UUID REFERENCES public.profiles(id);
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.documents ADD COLUMN signed_at TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.documents ADD COLUMN prepared_by_paralegal UUID REFERENCES public.profiles(id);
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.documents ADD COLUMN supervising_officer UUID REFERENCES public.profiles(id);
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Create LEADS table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- Source info
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT CHECK (source IN ('call', 'web', 'referral', 'walk_in', 'ai_intake')) DEFAULT 'web',
  -- Qualification
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost')) DEFAULT 'new',
  case_type TEXT,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'emergency')) DEFAULT 'medium',
  description TEXT,
  qualification_notes TEXT,
  -- Assignment
  intake_agent_id UUID REFERENCES public.profiles(id),
  assigned_paralegal_id UUID REFERENCES public.profiles(id),
  assigned_officer_id UUID REFERENCES public.profiles(id),
  -- Conversion
  converted_case_id UUID REFERENCES public.cases(id),
  -- SLA tracking
  qualified_at TIMESTAMP WITH TIME ZONE,
  assigned_to_paralegal_at TIMESTAMP WITH TIME ZONE,
  assigned_to_officer_at TIMESTAMP WITH TIME ZONE,
  paralegal_sla_deadline TIMESTAMP WITH TIME ZONE,
  officer_sla_deadline TIMESTAMP WITH TIME ZONE,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS: Allow service role full access (our API uses admin client)
CREATE POLICY "Service role full access on leads" ON public.leads
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Create PRIVILEGED_NOTES table (Officer-only access)
CREATE TABLE IF NOT EXISTS public.privileged_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  is_strategy BOOLEAN DEFAULT FALSE,
  is_confidential BOOLEAN DEFAULT TRUE,
  -- Only officers and managing partners can view
  visibility TEXT CHECK (visibility IN ('officer_only', 'managing_partner_only')) DEFAULT 'officer_only',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.privileged_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on privileged_notes" ON public.privileged_notes
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Create AUDIT_LOGS table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on audit_logs" ON public.audit_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_intake_agent ON public.leads(intake_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_paralegal ON public.leads(assigned_paralegal_id);
CREATE INDEX IF NOT EXISTS idx_leads_officer ON public.leads(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_privileged_notes_case ON public.privileged_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_lead_attorney ON public.cases(lead_attorney_id);
CREATE INDEX IF NOT EXISTS idx_cases_paralegal ON public.cases(support_paralegal_id);
CREATE INDEX IF NOT EXISTS idx_documents_workflow ON public.documents(workflow_status);

-- 8. Update triggers
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privileged_notes_updated_at BEFORE UPDATE ON public.privileged_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Update existing RLS policies for profiles to allow staff to view other staff
CREATE POLICY "Staff can view other staff profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('legal_officer', 'paralegal', 'intake_agent', 'admin', 'it_admin', 'managing_partner', 'attorney')
    )
  );
