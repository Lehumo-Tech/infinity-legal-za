-- ============================================
-- Infinity Legal ZA - Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS (as PostgreSQL enums)
-- ============================================

CREATE TYPE public.user_role AS ENUM (
  'managing_director', 'senior_partner', 'associate', 'paralegal',
  'legal_officer', 'supervising_officer', 'senior_consultant', 'consultant',
  'candidate_attorney', 'hr_manager', 'finance_manager', 'office_administrator',
  'systems_admin', 'receptionist', 'client', 'guest'
);

CREATE TYPE public.case_type AS ENUM (
  'family_law', 'criminal_defence', 'civil_litigation', 'conveyancing',
  'estate_planning', 'corporate_commercial', 'debt_collection',
  'immigration', 'labour_law', 'personal_injury', 'other'
);

CREATE TYPE public.case_urgency AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.case_status AS ENUM ('intake', 'pending_review', 'active', 'on_hold', 'settled', 'closed', 'archived');
CREATE TYPE public.lead_source AS ENUM ('website', 'referral', 'walk_in', 'social_media', 'advertisement', 'cold_call', 'other');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'disqualified');
CREATE TYPE public.document_type AS ENUM ('contract', 'pleading', 'correspondence', 'court_filing', 'affidavit', 'opinion', 'memo', 'invoice', 'consent_form', 'id_document', 'other');
CREATE TYPE public.workflow_status AS ENUM ('draft', 'review', 'approved', 'signed', 'filed', 'archived');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');
CREATE TYPE public.message_type AS ENUM ('message', 'note', 'system', 'alert');
CREATE TYPE public.consent_type AS ENUM ('data_processing', 'marketing', 'third_party_sharing', 'automated_decision', 'popia_general');
CREATE TYPE public.notification_type AS ENUM ('case_update', 'task_assigned', 'document_review', 'message', 'system', 'deadline', 'lead_assigned', 'consultation');
CREATE TYPE public.consultation_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.meeting_type AS ENUM ('in_person', 'video_call', 'phone_call');
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'expired', 'trialing');
CREATE TYPE public.attorney_availability AS ENUM ('available', 'busy', 'on_leave', 'unavailable');
CREATE TYPE public.privileged_note_visibility AS ENUM ('officer_only', 'managing_partner_only', 'attorney_client');
CREATE TYPE public.error_type AS ENUM ('runtime', 'api', 'database', 'auth', 'validation', 'network', 'unknown');
CREATE TYPE public.backup_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- ============================================
-- PROFILES TABLE (extends Supabase Auth users)
-- ============================================

CREATE TABLE public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role public.user_role DEFAULT 'client' NOT NULL,
  department TEXT,
  bar_number TEXT,
  hire_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_department ON public.profiles(department);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- CASES TABLE
-- ============================================

CREATE TABLE public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  matter_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  case_type public.case_type NOT NULL,
  urgency public.case_urgency NOT NULL,
  status public.case_status DEFAULT 'intake' NOT NULL,
  client_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  lead_attorney_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  support_paralegal_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  lead_id UUID,
  court_date TIMESTAMPTZ,
  filing_date TIMESTAMPTZ,
  closing_date TIMESTAMPTZ,
  estimated_value FLOAT,
  ai_analysis TEXT,
  is_high_risk BOOLEAN DEFAULT false NOT NULL,
  next_action TEXT,
  next_action_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_case_type ON public.cases(case_type);
CREATE INDEX idx_cases_client_id ON public.cases(client_id);
CREATE INDEX idx_cases_lead_attorney_id ON public.cases(lead_attorney_id);
CREATE INDEX idx_cases_urgency ON public.cases(urgency);
CREATE INDEX idx_cases_created_at ON public.cases(created_at);
CREATE INDEX idx_cases_court_date ON public.cases(court_date);

CREATE TRIGGER set_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- LEADS TABLE
-- ============================================

CREATE TABLE public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  source public.lead_source NOT NULL,
  status public.lead_status DEFAULT 'new' NOT NULL,
  case_type public.case_type,
  description TEXT,
  assigned_paralegal_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  assigned_officer_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  lead_score INT,
  qualification_notes TEXT,
  estimated_value FLOAT,
  first_contact_date TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  converted_case_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_assigned_paralegal ON public.leads(assigned_paralegal_id);
CREATE INDEX idx_leads_sla_deadline ON public.leads(sla_deadline);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- DOCUMENTS TABLE
-- ============================================

CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  document_type public.document_type NOT NULL,
  workflow_status public.workflow_status DEFAULT 'draft' NOT NULL,
  version INT DEFAULT 1 NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size INT,
  prepared_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  signed_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  supervising_officer UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  is_locked BOOLEAN DEFAULT false NOT NULL,
  locked_by UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_documents_case_id ON public.documents(case_id);
CREATE INDEX idx_documents_document_type ON public.documents(document_type);
CREATE INDEX idx_documents_workflow_status ON public.documents(workflow_status);
CREATE INDEX idx_documents_prepared_by ON public.documents(prepared_by);
CREATE INDEX idx_documents_created_at ON public.documents(created_at);

CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- INTAKE SUBMISSIONS TABLE
-- ============================================

CREATE TABLE public.intake_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reference_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  id_number TEXT,
  case_type public.case_type NOT NULL,
  description TEXT NOT NULL,
  opposing_party TEXT,
  urgency public.case_urgency,
  has_documents BOOLEAN DEFAULT false NOT NULL,
  consent_given BOOLEAN NOT NULL,
  popia_consent BOOLEAN NOT NULL,
  ai_analysis TEXT,
  converted_case_id UUID,
  status TEXT DEFAULT 'submitted' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_intake_email ON public.intake_submissions(email);
CREATE INDEX idx_intake_status ON public.intake_submissions(status);
CREATE INDEX idx_intake_case_type ON public.intake_submissions(case_type);
CREATE INDEX idx_intake_reference_id ON public.intake_submissions(reference_id);
CREATE INDEX idx_intake_created_at ON public.intake_submissions(created_at);

CREATE TRIGGER set_intake_submissions_updated_at
  BEFORE UPDATE ON public.intake_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- TASKS TABLE
-- ============================================

CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  priority public.task_priority NOT NULL,
  status public.task_status DEFAULT 'pending' NOT NULL,
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_case_id ON public.tasks(case_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  message_type public.message_type DEFAULT 'message' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_case_id ON public.messages(case_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

CREATE TRIGGER set_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================

CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================
-- CONSENT LOGS TABLE
-- ============================================

CREATE TABLE public.consent_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  consent_type public.consent_type NOT NULL,
  purpose TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_consent_logs_user_id ON public.consent_logs(user_id);
CREATE INDEX idx_consent_logs_consent_type ON public.consent_logs(consent_type);
CREATE INDEX idx_consent_logs_created_at ON public.consent_logs(created_at);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  link TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- CONSULTATIONS TABLE
-- ============================================

CREATE TABLE public.consultations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  attorney_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  scheduled_time TEXT NOT NULL,
  duration_minutes INT DEFAULT 60 NOT NULL,
  status public.consultation_status DEFAULT 'scheduled' NOT NULL,
  notes TEXT,
  meeting_type public.meeting_type DEFAULT 'in_person' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_consultations_client_id ON public.consultations(client_id);
CREATE INDEX idx_consultations_attorney_id ON public.consultations(attorney_id);
CREATE INDEX idx_consultations_scheduled_date ON public.consultations(scheduled_date);
CREATE INDEX idx_consultations_status ON public.consultations(status);

CREATE TRIGGER set_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- PRICING PLANS TABLE
-- ============================================

CREATE TABLE public.pricing_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly FLOAT NOT NULL,
  price_annual FLOAT,
  currency TEXT DEFAULT 'ZAR' NOT NULL,
  features TEXT NOT NULL,
  max_cases INT,
  max_documents INT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  sort_order INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_pricing_plans_slug ON public.pricing_plans(slug);
CREATE INDEX idx_pricing_plans_is_active ON public.pricing_plans(is_active);

CREATE TRIGGER set_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- USER SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE public.user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.pricing_plans(id) ON DELETE RESTRICT NOT NULL,
  status public.subscription_status DEFAULT 'active' NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

CREATE TRIGGER set_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- PAYMENT RECORDS TABLE
-- ============================================

CREATE TABLE public.payment_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  m_payment_id TEXT UNIQUE NOT NULL,
  pf_payment_id TEXT,
  amount_gross FLOAT NOT NULL,
  amount_fee FLOAT,
  amount_net FLOAT,
  payment_status TEXT DEFAULT 'pending' NOT NULL,
  item_name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  payfast_data TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_payment_records_user_id ON public.payment_records(user_id);
CREATE INDEX idx_payment_records_m_payment_id ON public.payment_records(m_payment_id);
CREATE INDEX idx_payment_records_payment_status ON public.payment_records(payment_status);
CREATE INDEX idx_payment_records_created_at ON public.payment_records(created_at);

CREATE TRIGGER set_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- CASE TIMELINE TABLE
-- ============================================

CREATE TABLE public.case_timeline (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  description TEXT,
  previous_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_case_timeline_case_id ON public.case_timeline(case_id);
CREATE INDEX idx_case_timeline_created_at ON public.case_timeline(created_at);

-- ============================================
-- PRIVILEGED NOTES TABLE
-- ============================================

CREATE TABLE public.privileged_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  visibility public.privileged_note_visibility DEFAULT 'officer_only' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_privileged_notes_case_id ON public.privileged_notes(case_id);
CREATE INDEX idx_privileged_notes_author_id ON public.privileged_notes(author_id);
CREATE INDEX idx_privileged_notes_visibility ON public.privileged_notes(visibility);

CREATE TRIGGER set_privileged_notes_updated_at
  BEFORE UPDATE ON public.privileged_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- API ANALYTICS TABLE
-- ============================================

CREATE TABLE public.api_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT NOT NULL,
  response_time_ms INT,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_api_analytics_endpoint ON public.api_analytics(endpoint);
CREATE INDEX idx_api_analytics_status_code ON public.api_analytics(status_code);
CREATE INDEX idx_api_analytics_created_at ON public.api_analytics(created_at);
CREATE INDEX idx_api_analytics_user_id ON public.api_analytics(user_id);

-- ============================================
-- ERROR LOGS TABLE
-- ============================================

CREATE TABLE public.error_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  error_type public.error_type NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  url TEXT,
  user_id UUID,
  metadata TEXT,
  resolved BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);

CREATE TRIGGER set_error_logs_updated_at
  BEFORE UPDATE ON public.error_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ATTORNEYS TABLE
-- ============================================

CREATE TABLE public.attorneys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE NOT NULL,
  lpc_number TEXT,
  firm_name TEXT,
  specializations TEXT,
  years_experience INT,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  hourly_rate FLOAT,
  bio TEXT,
  availability_status public.attorney_availability DEFAULT 'available' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_attorneys_lpc_number ON public.attorneys(lpc_number);
CREATE INDEX idx_attorneys_is_verified ON public.attorneys(is_verified);
CREATE INDEX idx_attorneys_availability_status ON public.attorneys(availability_status);

CREATE TRIGGER set_attorneys_updated_at
  BEFORE UPDATE ON public.attorneys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- RATE LIMIT LOGS TABLE
-- ============================================

CREATE TABLE public.rate_limit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INT DEFAULT 1 NOT NULL,
  window_start TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(ip, endpoint)
);

CREATE INDEX idx_rate_limit_logs_ip ON public.rate_limit_logs(ip);
CREATE INDEX idx_rate_limit_logs_endpoint ON public.rate_limit_logs(endpoint);
CREATE INDEX idx_rate_limit_logs_window_start ON public.rate_limit_logs(window_start);

-- ============================================
-- BACKUP RECORDS TABLE
-- ============================================

CREATE TABLE public.backup_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename TEXT NOT NULL,
  size_bytes INT,
  backup_type TEXT DEFAULT 'scheduled' NOT NULL,
  status public.backup_status DEFAULT 'pending' NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_backup_records_status ON public.backup_records(status);
CREATE INDEX idx_backup_records_backup_type ON public.backup_records(backup_type);
CREATE INDEX idx_backup_records_started_at ON public.backup_records(started_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privileged_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attorneys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_records ENABLE ROW LEVEL SECURITY;

-- Public read for pricing plans (no auth needed)
CREATE POLICY "Pricing plans are publicly readable"
  ON public.pricing_plans FOR SELECT
  USING (is_active = true);

-- Intake submissions: allow anonymous insert
CREATE POLICY "Anyone can submit intake"
  ON public.intake_submissions FOR INSERT
  WITH CHECK (true);

-- Rate limit logs: allow service role full access
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- General policy: users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role has full access to all tables
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cases"
  ON public.cases FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on leads"
  ON public.leads FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on documents"
  ON public.documents FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on intake_submissions"
  ON public.intake_submissions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on tasks"
  ON public.tasks FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on messages"
  ON public.messages FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on audit_logs"
  ON public.audit_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on consent_logs"
  ON public.consent_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on notifications"
  ON public.notifications FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on consultations"
  ON public.consultations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on user_subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on payment_records"
  ON public.payment_records FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on case_timeline"
  ON public.case_timeline FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on privileged_notes"
  ON public.privileged_notes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on api_analytics"
  ON public.api_analytics FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on error_logs"
  ON public.error_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on attorneys"
  ON public.attorneys FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on backup_records"
  ON public.backup_records FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SEED: PRICING PLANS
-- ============================================

INSERT INTO public.pricing_plans (name, slug, price_monthly, price_annual, features, max_cases, max_documents, is_active, sort_order) VALUES
  ('Civil Legal Plan', 'civil-legal', 99.00, 990.00, '["Civil litigation support","Debt collection assistance","Consumer protection claims","Conveyancing queries","AI-powered case analysis","Secure document storage","Email support"]', 5, 25, true, 1),
  ('Labour Legal Plan', 'labour-legal', 99.00, 990.00, '["CCMA representation","Unfair dismissal claims","Workplace dispute resolution","Employment contract review","AI-powered case analysis","Secure document storage","Email support"]', 5, 25, true, 2),
  ('Extensive Legal Plan', 'extensive-legal', 139.00, 1390.00, '["All Civil Legal Plan features","All Labour Legal Plan features","Family law & divorce","Criminal defence consultation","Corporate & commercial law","Estate planning & wills","Priority support","Unlimited AI analysis","Dedicated attorney"]', 999, 999, true, 3);

-- ============================================
-- SEED: ADMIN PROFILE (will be linked after first signup)
-- ============================================

-- Note: The admin user will be created via Supabase Auth signup,
-- then their profile will be updated to managing_director role via service role.

-- ============================================
-- FUNCTION: Auto-create profile on user signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
