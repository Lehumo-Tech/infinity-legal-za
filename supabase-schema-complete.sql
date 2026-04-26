-- ============================================================
-- INFINITY LEGAL - COMPLETE DATABASE SCHEMA
-- For Supabase FREE tier (500MB storage, unlimited API calls)
-- Run this in Supabase SQL Editor after creating project
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================== PROFILES =====================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'attorney', 'admin')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== ATTORNEYS =====================
CREATE TABLE attorneys (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  lpc_number TEXT UNIQUE,
  status TEXT DEFAULT 'unverified' CHECK (status IN ('unverified', 'verified', 'suspended')),
  specializations TEXT[] DEFAULT '{}',
  years_experience INTEGER,
  location TEXT,
  bio TEXT,
  trust_account_bank TEXT,
  trust_account_number TEXT,
  trust_account_branch TEXT,
  calcom_username TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== CASES =====================
CREATE TABLE cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  attorney_id UUID REFERENCES attorneys(id),
  category TEXT NOT NULL,
  subcategory TEXT,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed')),
  intake_data JSONB,
  ai_analysis JSONB,
  cost_estimate JSONB,
  next_steps TEXT[],
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== MESSAGES =====================
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== DOCUMENTS =====================
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== CONSENT LOGS (POPIA) =====================
CREATE TABLE consent_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  consent_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== AUDIT LOGS =====================
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== ERROR LOGS =====================
CREATE TABLE error_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  message TEXT,
  stack TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== METRICS =====================
CREATE TABLE metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  value NUMERIC,
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== HEALTH CHECK =====================
CREATE TABLE health_check (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_ping TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== ROW LEVEL SECURITY =====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorneys ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read own profile, admins can read all
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Attorneys: Public can read verified attorneys
CREATE POLICY "Public read verified attorneys" ON attorneys
  FOR SELECT USING (status = 'verified');

CREATE POLICY "Attorneys can update own profile" ON attorneys
  FOR UPDATE USING (id = auth.uid());

-- Cases: Clients see own cases, attorneys see assigned cases
CREATE POLICY "Clients read own cases" ON cases
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Attorneys read assigned cases" ON cases
  FOR SELECT USING (attorney_id = auth.uid());

CREATE POLICY "Clients create cases" ON cases
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- Messages: Participants can read case messages
CREATE POLICY "Read case messages" ON messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM cases WHERE id = messages.case_id
    AND (client_id = auth.uid() OR attorney_id = auth.uid())
  ));

CREATE POLICY "Send case messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Documents: Case participants can access
CREATE POLICY "Access case documents" ON documents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM cases WHERE id = documents.case_id
    AND (client_id = auth.uid() OR attorney_id = auth.uid())
  ));

-- Consent logs: Users can read own
CREATE POLICY "Read own consent logs" ON consent_logs
  FOR SELECT USING (user_id = auth.uid());

-- Audit logs: Admin only
CREATE POLICY "Admin read audit logs" ON audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ===================== FUNCTIONS =====================
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cases_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===================== INDEXES =====================
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_cases_attorney ON cases(attorney_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_urgency ON cases(urgency);
CREATE INDEX idx_messages_case ON messages(case_id);
CREATE INDEX idx_documents_case ON documents(case_id);
CREATE INDEX idx_error_logs_created ON error_logs(created_at);
CREATE INDEX idx_metrics_name ON metrics(name, created_at);
