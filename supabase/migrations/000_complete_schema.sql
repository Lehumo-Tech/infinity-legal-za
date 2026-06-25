-- =============================================================================
-- INFINITY LEGAL — COMPLETE IDEMPOTENT SCHEMA
-- Uses TEXT + CHECK constraints instead of PostgreSQL enums to avoid
-- "unsafe use of new value" and "type already exists" errors.
-- Safe to re-run in Supabase SQL Editor any number of times.
-- ORDER: Tables -> Functions -> Triggers -> Indexes -> RLS -> Views -> Seed
-- =============================================================================

-- ===========================================================================
-- 1. TABLES (in dependency order)
-- ===========================================================================

-- Core: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client','attorney','paralegal','admin','managing_director','systems_admin')),
  id_number       TEXT,
  company         TEXT,
  address         JSONB DEFAULT '{}',
  preferences     JSONB DEFAULT '{}',
  popi_consent    BOOLEAN DEFAULT FALSE,
  email_verified  BOOLEAN DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attorneys
CREATE TABLE IF NOT EXISTS public.attorneys (
  id                  UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  practice_number     TEXT UNIQUE,
  specialization     TEXT[],
  bar_admission_date DATE,
  hourly_rate         DECIMAL(10,2) DEFAULT 0,
  bio                 TEXT,
  available           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cases
CREATE TABLE IF NOT EXISTS public.cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_ref        TEXT UNIQUE DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  case_type       TEXT NOT NULL DEFAULT 'other' CHECK (case_type IN ('civil','criminal','family','corporate','property','labour','immigration','intellectual_property','tax','personal_injury','debt_recovery','other')),
  status          TEXT NOT NULL DEFAULT 'intake' CHECK (status IN ('intake','review','active','on_hold','closed','archived')),
  client_id       UUID NOT NULL REFERENCES public.profiles(id),
  attorney_id     UUID REFERENCES public.attorneys(id),
  opposing_party  TEXT,
  court_name      TEXT,
  case_number     TEXT,
  jurisdiction    TEXT,
  estimated_value DECIMAL(12,2),
  retainer_amount DECIMAL(12,2),
  contingency_fee DECIMAL(5,2),
  next_deadline   TIMESTAMPTZ,
  notes           TEXT,
  tags            TEXT[] DEFAULT '{}',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  company             TEXT,
  source              TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website','referral','social_media','google_ads','walk_in','phone','email','partner','event','other')),
  status              TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','consultation_scheduled','retained','lost','nurturing')),
  case_type           TEXT CHECK (case_type IN ('civil','criminal','family','corporate','property','labour','immigration','intellectual_property','tax','personal_injury','debt_recovery','other')),
  description         TEXT,
  estimated_value     DECIMAL(12,2),
  lead_score          INT DEFAULT 0,
  assigned_to         UUID REFERENCES public.profiles(id),
  converted_client_id UUID REFERENCES public.profiles(id),
  converted_case_id   UUID REFERENCES public.cases(id),
  notes               TEXT,
  tags                TEXT[] DEFAULT '{}',
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT,
  last_contacted_at   TIMESTAMPTZ,
  next_follow_up      TIMESTAMPTZ,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Intake submissions
CREATE TABLE IF NOT EXISTS public.intake_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID REFERENCES public.profiles(id),
  case_id           UUID REFERENCES public.cases(id),
  lead_id           UUID REFERENCES public.leads(id),
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected','additional_info_needed')),
  case_type         TEXT NOT NULL CHECK (case_type IN ('civil','criminal','family','corporate','property','labour','immigration','intellectual_property','tax','personal_injury','debt_recovery','other')),
  case_description  TEXT NOT NULL,
  opposing_party    TEXT,
  estimated_value   DECIMAL(12,2),
  urgency           TEXT,
  timeline          TEXT,
  desired_outcome   TEXT,
  previous_legal_help TEXT,
  documents_ready   BOOLEAN DEFAULT FALSE,
  personal_info     JSONB DEFAULT '{}',
  case_details      JSONB DEFAULT '{}',
  financial_info    JSONB DEFAULT '{}',
  ai_extracted_data JSONB DEFAULT '{}',
  ai_confidence     DECIMAL(5,2) DEFAULT 0,
  review_notes      TEXT,
  reviewed_by       UUID REFERENCES public.profiles(id),
  reviewed_at       TIMESTAMPTZ,
  submitted_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI intake sessions
CREATE TABLE IF NOT EXISTS public.ai_intake_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID REFERENCES public.profiles(id),
  intake_submission_id  UUID REFERENCES public.intake_submissions(id),
  session_token         TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected','additional_info_needed')),
  conversation_history  JSONB DEFAULT '[]',
  extracted_entities    JSONB DEFAULT '{}',
  current_step          TEXT DEFAULT 'greeting',
  steps_completed       TEXT[] DEFAULT '{}',
  steps_remaining       TEXT[] DEFAULT '{"personal_info","case_description","opposing_party","documents","timeline","financial","consent"}',
  ai_model_used         TEXT,
  total_tokens          INT DEFAULT 0,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI analyses
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           UUID REFERENCES public.cases(id),
  intake_id         UUID REFERENCES public.intake_submissions(id),
  analysis_type     TEXT NOT NULL CHECK (analysis_type IN ('merit_assessment','risk_analysis','cost_estimate','timeline_prediction','document_review','legal_research','strategy_recommendation')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  input_data        JSONB DEFAULT '{}',
  result            JSONB DEFAULT '{}',
  summary           TEXT,
  recommendations   JSONB DEFAULT '[]',
  risk_flags        JSONB DEFAULT '[]',
  confidence_score  DECIMAL(5,2),
  ai_model_used     TEXT,
  tokens_used       INT DEFAULT 0,
  processing_time_ms INT,
  error_message     TEXT,
  requested_by      UUID REFERENCES public.profiles(id),
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI analysis queue
CREATE TABLE IF NOT EXISTS public.ai_analysis_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id   UUID REFERENCES public.ai_analyses(id),
  priority      TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  retry_count   INT DEFAULT 0,
  max_retries   INT DEFAULT 3,
  scheduled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             UUID REFERENCES public.cases(id),
  uploaded_by         UUID NOT NULL REFERENCES public.profiles(id),
  document_type       TEXT NOT NULL DEFAULT 'other' CHECK (document_type IN ('id_document','contract','court_filing','correspondence','evidence','financial','medical','police_report','affidavit','other')),
  status              TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploading','uploaded','reviewing','approved','rejected','archived')),
  file_name           TEXT NOT NULL,
  file_path           TEXT NOT NULL,
  file_size           BIGINT DEFAULT 0,
  mime_type           TEXT,
  description         TEXT,
  tags                TEXT[] DEFAULT '{}',
  version             INT DEFAULT 1,
  parent_document_id  UUID REFERENCES public.documents(id),
  ai_extracted_text   TEXT,
  ai_summary          TEXT,
  is_confidential     BOOLEAN DEFAULT TRUE,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID REFERENCES public.cases(id),
  assigned_to   UUID NOT NULL REFERENCES public.profiles(id),
  created_by    UUID NOT NULL REFERENCES public.profiles(id),
  title         TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  priority      TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date      TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           UUID REFERENCES public.cases(id),
  sender_id         UUID NOT NULL REFERENCES public.profiles(id),
  recipient_id      UUID REFERENCES public.profiles(id),
  message_type      TEXT NOT NULL DEFAULT 'direct' CHECK (message_type IN ('system','direct','group','notification')),
  subject           TEXT,
  content           TEXT NOT NULL,
  is_read           BOOLEAN DEFAULT FALSE,
  parent_message_id UUID REFERENCES public.messages(id),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case timeline
CREATE TABLE IF NOT EXISTS public.case_timeline (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           UUID NOT NULL REFERENCES public.cases(id),
  event_type        TEXT NOT NULL,
  event_description TEXT NOT NULL,
  performed_by      UUID REFERENCES public.profiles(id),
  metadata          JSONB DEFAULT '{}',
  is_system_event   BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Privileged notes
CREATE TABLE IF NOT EXISTS public.privileged_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID NOT NULL REFERENCES public.cases(id),
  author_id     UUID NOT NULL REFERENCES public.profiles(id),
  content       TEXT NOT NULL,
  is_privileged BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consultations
CREATE TABLE IF NOT EXISTS public.consultations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             UUID REFERENCES public.cases(id),
  client_id           UUID NOT NULL REFERENCES public.profiles(id),
  attorney_id         UUID REFERENCES public.attorneys(id),
  status              TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    INT DEFAULT 60,
  meeting_type        TEXT DEFAULT 'in_person',
  meeting_link        TEXT,
  location            TEXT,
  notes               TEXT,
  follow_up_required  BOOLEAN DEFAULT FALSE,
  fee                 DECIMAL(10,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consent logs
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id),
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms_of_service','privacy_policy','popi_act','marketing','data_processing')),
  granted      BOOLEAN NOT NULL,
  ip_address   TEXT,
  user_agent   TEXT,
  version      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info',
  link       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pricing plans
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  description    TEXT,
  price_monthly  DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_annual   DECIMAL(10,2),
  currency       TEXT DEFAULT 'ZAR',
  features       JSONB DEFAULT '[]',
  is_popular     BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  sort_order     INT DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id),
  plan_id               UUID NOT NULL REFERENCES public.pricing_plans(id),
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled','expired','trial')),
  current_period_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT FALSE,
  trial_ends_at         TIMESTAMPTZ,
  payfast_token         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment records
CREATE TABLE IF NOT EXISTS public.payment_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id     UUID REFERENCES public.user_subscriptions(id),
  case_id             UUID REFERENCES public.cases(id),
  user_id             UUID NOT NULL REFERENCES public.profiles(id),
  amount              DECIMAL(12,2) NOT NULL,
  currency            TEXT DEFAULT 'ZAR',
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded','partially_refunded')),
  payfast_payment_id  TEXT,
  payfast_token       TEXT,
  payment_method      TEXT DEFAULT 'payfast',
  description         TEXT,
  metadata            JSONB DEFAULT '{}',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles(id),
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   UUID,
  details       JSONB DEFAULT '{}',
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API analytics
CREATE TABLE IF NOT EXISTS public.api_analytics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint         TEXT NOT NULL,
  method           TEXT NOT NULL,
  status_code      INT,
  response_time_ms INT,
  user_id          UUID REFERENCES public.profiles(id),
  ip_address       TEXT,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Error logs
CREATE TABLE IF NOT EXISTS public.error_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type   TEXT NOT NULL,
  message      TEXT NOT NULL,
  stack_trace  TEXT,
  user_id      UUID REFERENCES public.profiles(id),
  request_path TEXT,
  metadata     JSONB DEFAULT '{}',
  resolved     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate limit logs
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier    TEXT NOT NULL,
  endpoint      TEXT,
  request_count INT DEFAULT 1,
  blocked       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backup records
CREATE TABLE IF NOT EXISTS public.backup_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type     TEXT NOT NULL DEFAULT 'incremental',
  status          TEXT NOT NULL DEFAULT 'pending',
  file_path       TEXT,
  file_size_bytes BIGINT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workbench configs
CREATE TABLE IF NOT EXISTS public.workbench_configs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  layout            TEXT NOT NULL DEFAULT 'grid' CHECK (layout IN ('grid','list','compact')),
  widgets           JSONB DEFAULT '[]',
  sidebar_collapsed BOOLEAN DEFAULT FALSE,
  theme             TEXT DEFAULT 'system',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workbench widgets
CREATE TABLE IF NOT EXISTS public.workbench_widgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('case_summary','task_list','upcoming_deadlines','recent_documents','billing_overview','lead_pipeline','ai_insights','quick_actions','notifications','calendar')),
  title       TEXT,
  position_x  INT NOT NULL DEFAULT 0,
  position_y  INT NOT NULL DEFAULT 0,
  width       INT NOT NULL DEFAULT 1,
  height      INT NOT NULL DEFAULT 1,
  is_visible  BOOLEAN DEFAULT TRUE,
  config      JSONB DEFAULT '{}',
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workbench quick actions
CREATE TABLE IF NOT EXISTS public.workbench_quick_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  label       TEXT NOT NULL,
  icon        TEXT,
  target_url  TEXT,
  config      JSONB DEFAULT '{}',
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workbench pinned items
CREATE TABLE IF NOT EXISTS public.workbench_pinned_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL,
  item_id     UUID NOT NULL,
  label       TEXT,
  metadata    JSONB DEFAULT '{}',
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workbench recent activity
CREATE TABLE IF NOT EXISTS public.workbench_recent_activity (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   UUID,
  description   TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead pipeline stages
CREATE TABLE IF NOT EXISTS public.lead_pipeline_stages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  description    TEXT,
  sort_order     INT NOT NULL DEFAULT 0,
  color          TEXT,
  is_default     BOOLEAN DEFAULT FALSE,
  auto_assign_to UUID REFERENCES public.profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead pipeline transitions
CREATE TABLE IF NOT EXISTS public.lead_pipeline_transitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_stage  TEXT,
  to_stage    TEXT NOT NULL,
  changed_by  UUID REFERENCES public.profiles(id),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead communications
CREATE TABLE IF NOT EXISTS public.lead_communications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id        UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type           TEXT NOT NULL DEFAULT 'note',
  direction      TEXT DEFAULT 'outbound',
  subject        TEXT,
  content        TEXT NOT NULL,
  contacted_by   UUID REFERENCES public.profiles(id),
  follow_up_date TIMESTAMPTZ,
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead automation rules
CREATE TABLE IF NOT EXISTS public.lead_automation_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  trigger_event     TEXT NOT NULL,
  conditions        JSONB DEFAULT '{}',
  actions           JSONB DEFAULT '[]',
  is_active         BOOLEAN DEFAULT TRUE,
  created_by        UUID REFERENCES public.profiles(id),
  last_triggered_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead form submissions
CREATE TABLE IF NOT EXISTS public.lead_form_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_slug     TEXT NOT NULL,
  lead_id       UUID REFERENCES public.leads(id),
  form_data     JSONB NOT NULL DEFAULT '{}',
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  ip_address    TEXT,
  user_agent    TEXT,
  is_processed  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin sessions
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id),
  token       TEXT UNIQUE NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin activity logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id),
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  details       JSONB DEFAULT '{}',
  ip_address    TEXT,
  severity      TEXT DEFAULT 'info',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM dashboard widgets
CREATE TABLE IF NOT EXISTS public.crm_dashboard_widgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_key   TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  widget_type  TEXT NOT NULL DEFAULT 'stat',
  config       JSONB DEFAULT '{}',
  data_source  TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM reports
CREATE TABLE IF NOT EXISTS public.crm_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  report_type    TEXT NOT NULL CHECK (report_type IN ('leads_summary','revenue','case_metrics','client_acquisition','attorney_performance','ai_usage','conversion_funnel')),
  description    TEXT,
  parameters     JSONB DEFAULT '{}',
  result_data    JSONB DEFAULT '{}',
  generated_by   UUID REFERENCES public.profiles(id),
  is_scheduled   BOOLEAN DEFAULT FALSE,
  schedule_cron  TEXT,
  format         TEXT DEFAULT 'json',
  status         TEXT DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM notifications
CREATE TABLE IF NOT EXISTS public.crm_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id),
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  priority   TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  link       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM system settings
CREATE TABLE IF NOT EXISTS public.crm_system_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description   TEXT,
  is_public     BOOLEAN DEFAULT FALSE,
  updated_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM contact messages
CREATE TABLE IF NOT EXISTS public.crm_contact_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT,
  subject        TEXT,
  message        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read','replied','archived')),
  assigned_to    UUID REFERENCES public.profiles(id),
  replied_at     TIMESTAMPTZ,
  reply_content  TEXT,
  lead_id        UUID REFERENCES public.leads(id),
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM user notes
CREATE TABLE IF NOT EXISTS public.crm_user_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id),
  author_id    UUID NOT NULL REFERENCES public.profiles(id),
  content      TEXT NOT NULL,
  is_pinned    BOOLEAN DEFAULT FALSE,
  is_internal  BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM subscription events
CREATE TABLE IF NOT EXISTS public.crm_subscription_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID REFERENCES public.user_subscriptions(id),
  user_id          UUID NOT NULL REFERENCES public.profiles(id),
  event_type       TEXT NOT NULL,
  description      TEXT,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Legal articles (publicly readable, admin-managed)
CREATE TABLE IF NOT EXISTS public.legal_articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  content         TEXT NOT NULL,
  summary         TEXT,
  category        TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('civil_litigation','labour_law','criminal_defence','family_law','corporate_commercial','property_conveyancing','estate_planning','debt_recovery','consumer_rights','popia_compliance','immigration','general')),
  tags            TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  author_id       UUID REFERENCES public.profiles(id),
  reading_time_min INT DEFAULT 5,
  is_published    BOOLEAN DEFAULT FALSE,
  is_featured     BOOLEAN DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  sort_order      INT DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================================================
-- 2. FUNCTIONS
-- ===========================================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin','managing_director','systems_admin')
  );
$$;

-- Check if current user is attorney
CREATE OR REPLACE FUNCTION public.is_attorney()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('attorney','admin','managing_director','systems_admin')
  );
$$;

-- Check if current user is client
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'client'
  );
$$;

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Lead score calculation
CREATE OR REPLACE FUNCTION public.calculate_lead_score(lead_row public.leads)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  score INT := 0;
BEGIN
  IF lead_row.source = 'referral' THEN score := score + 30;
  ELSIF lead_row.source = 'google_ads' THEN score := score + 20;
  ELSIF lead_row.source = 'website' THEN score := score + 15;
  ELSIF lead_row.source = 'walk_in' THEN score := score + 25;
  ELSE score := score + 10;
  END IF;

  IF lead_row.estimated_value IS NOT NULL THEN
    IF lead_row.estimated_value >= 100000 THEN score := score + 25;
    ELSIF lead_row.estimated_value >= 50000 THEN score := score + 20;
    ELSIF lead_row.estimated_value >= 10000 THEN score := score + 10;
    END IF;
  END IF;

  IF lead_row.case_type IN ('corporate','property') THEN score := score + 15;
  ELSIF lead_row.case_type = 'family' THEN score := score + 10;
  END IF;

  IF lead_row.status = 'qualified' THEN score := score + 15;
  ELSIF lead_row.status = 'consultation_scheduled' THEN score := score + 20;
  END IF;

  RETURN LEAST(score, 100);
END;
$$;

-- Lead score auto-update trigger function
CREATE OR REPLACE FUNCTION public.update_lead_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.lead_score := public.calculate_lead_score(NEW);
  RETURN NEW;
END;
$$;

-- Case status change logger
CREATE OR REPLACE FUNCTION public.log_case_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.case_timeline (case_id, event_type, event_description, performed_by, is_system_event)
    VALUES (NEW.id, 'status_change',
      'Case status changed from ' || OLD.status || ' to ' || NEW.status,
      auth.uid(), TRUE);
  END IF;
  RETURN NEW;
END;
$$;

-- Lead pipeline transition logger
CREATE OR REPLACE FUNCTION public.log_lead_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_pipeline_transitions (lead_id, from_stage, to_stage, changed_by, reason)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), 'Status updated');
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-notify admins on new lead
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.crm_notifications (user_id, type, title, message, priority)
  SELECT p.id, 'new_lead', 'New Lead Received',
    'New lead from ' || NEW.first_name || ' ' || NEW.last_name || ' (' || NEW.email || ')',
    'high'
  FROM public.profiles p
  WHERE p.role IN ('admin','managing_director','systems_admin');
  RETURN NEW;
END;
$$;

-- Auto-notify admins on contact message
CREATE OR REPLACE FUNCTION public.notify_contact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.crm_notifications (user_id, type, title, message, priority)
  SELECT p.id, 'contact_message', 'New Contact Message',
    'Message from ' || NEW.name || ': ' || LEFT(NEW.message, 80),
    'medium'
  FROM public.profiles p
  WHERE p.role IN ('admin','managing_director','systems_admin');
  RETURN NEW;
END;
$$;

-- Helper to create updated_at triggers
CREATE OR REPLACE FUNCTION public.create_updated_at_trigger(tbl TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format(
    'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();',
    tbl, tbl
  );
END;
$$;

-- ===========================================================================
-- 3. TRIGGERS
-- ===========================================================================

-- Auto-create profile on auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
SELECT public.create_updated_at_trigger('profiles');
SELECT public.create_updated_at_trigger('attorneys');
SELECT public.create_updated_at_trigger('cases');
SELECT public.create_updated_at_trigger('leads');
SELECT public.create_updated_at_trigger('intake_submissions');
SELECT public.create_updated_at_trigger('ai_intake_sessions');
SELECT public.create_updated_at_trigger('ai_analyses');
SELECT public.create_updated_at_trigger('documents');
SELECT public.create_updated_at_trigger('tasks');
SELECT public.create_updated_at_trigger('privileged_notes');
SELECT public.create_updated_at_trigger('consultations');
SELECT public.create_updated_at_trigger('pricing_plans');
SELECT public.create_updated_at_trigger('user_subscriptions');
SELECT public.create_updated_at_trigger('workbench_configs');
SELECT public.create_updated_at_trigger('workbench_widgets');
SELECT public.create_updated_at_trigger('lead_automation_rules');
SELECT public.create_updated_at_trigger('crm_dashboard_widgets');
SELECT public.create_updated_at_trigger('crm_reports');
SELECT public.create_updated_at_trigger('crm_contact_messages');
SELECT public.create_updated_at_trigger('crm_user_notes');
SELECT public.create_updated_at_trigger('crm_system_settings');
SELECT public.create_updated_at_trigger('legal_articles');

-- Lead score auto-update
DROP TRIGGER IF EXISTS set_lead_score ON public.leads;
CREATE TRIGGER set_lead_score
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_score();

-- Case timeline auto-log
DROP TRIGGER IF EXISTS track_case_status ON public.cases;
CREATE TRIGGER track_case_status
  AFTER UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.log_case_status_change();

-- Lead pipeline transition logging
DROP TRIGGER IF EXISTS track_lead_status ON public.leads;
CREATE TRIGGER track_lead_status
  AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_transition();

-- Auto-notification on new lead
DROP TRIGGER IF EXISTS on_new_lead ON public.leads;
CREATE TRIGGER on_new_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead();

-- Auto-notification on contact message
DROP TRIGGER IF EXISTS on_contact_message ON public.crm_contact_messages;
CREATE TRIGGER on_contact_message
  AFTER INSERT ON public.crm_contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_contact_message();

-- ===========================================================================
-- 4. INDEXES
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_cases_client ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_attorney ON public.cases(attorney_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_type ON public.cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_ref ON public.cases(case_ref);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_intake_client ON public.intake_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_status ON public.intake_submissions(status);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_case ON public.ai_analyses(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_status ON public.ai_analyses(status);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON public.ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_intake_session_token ON public.ai_intake_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_ai_intake_client ON public.ai_intake_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON public.ai_analysis_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_documents_case ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_tasks_case ON public.tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_messages_case ON public.messages(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_timeline_case ON public.case_timeline(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payment_records(status);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_consultations_client ON public.consultations(client_id);
CREATE INDEX IF NOT EXISTS idx_consultations_attorney ON public.consultations(attorney_id);
CREATE INDEX IF NOT EXISTS idx_workbench_config_user ON public.workbench_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_workbench_widgets_user ON public.workbench_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_workbench_activity_user ON public.workbench_recent_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_comms_lead ON public.lead_communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_transitions_lead ON public.lead_pipeline_transitions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_forms_processed ON public.lead_form_submissions(is_processed);
CREATE INDEX IF NOT EXISTS idx_crm_activity_admin ON public.admin_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_notifications_user ON public.crm_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_contact_status ON public.crm_contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.legal_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.legal_articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON public.legal_articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.legal_articles(slug);

-- ===========================================================================
-- 5. ROW LEVEL SECURITY
-- ===========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attorneys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_intake_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privileged_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbench_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbench_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbench_quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbench_pinned_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbench_recent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_pipeline_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_articles ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Attorneys
DROP POLICY IF EXISTS "Anyone can view attorneys" ON public.attorneys;
CREATE POLICY "Anyone can view attorneys" ON public.attorneys FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admins manage attorneys" ON public.attorneys;
CREATE POLICY "Admins manage attorneys" ON public.attorneys FOR ALL USING (public.is_admin());

-- Cases
DROP POLICY IF EXISTS "Clients see own cases" ON public.cases;
CREATE POLICY "Clients see own cases" ON public.cases FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Attorneys see assigned cases" ON public.cases;
CREATE POLICY "Attorneys see assigned cases" ON public.cases FOR SELECT USING (EXISTS (SELECT 1 FROM public.attorneys WHERE id = attorney_id AND id = auth.uid()));
DROP POLICY IF EXISTS "Admins see all cases" ON public.cases;
CREATE POLICY "Admins see all cases" ON public.cases FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Clients create cases" ON public.cases;
CREATE POLICY "Clients create cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "Case members update cases" ON public.cases;
CREATE POLICY "Case members update cases" ON public.cases FOR UPDATE USING (auth.uid() = client_id OR EXISTS (SELECT 1 FROM public.attorneys WHERE id = attorney_id AND id = auth.uid()) OR public.is_admin());

-- Leads
DROP POLICY IF EXISTS "Admins manage leads" ON public.leads;
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL USING (public.is_admin() OR public.is_attorney());
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
CREATE POLICY "Anyone can submit leads" ON public.leads FOR INSERT WITH CHECK (TRUE);

-- Intake submissions
DROP POLICY IF EXISTS "Users see own intakes" ON public.intake_submissions;
CREATE POLICY "Users see own intakes" ON public.intake_submissions FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins see all intakes" ON public.intake_submissions;
CREATE POLICY "Admins see all intakes" ON public.intake_submissions FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Users create own intakes" ON public.intake_submissions;
CREATE POLICY "Users create own intakes" ON public.intake_submissions FOR INSERT WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins update intakes" ON public.intake_submissions;
CREATE POLICY "Admins update intakes" ON public.intake_submissions FOR UPDATE USING (public.is_admin() OR auth.uid() = client_id);

-- AI intake sessions
DROP POLICY IF EXISTS "Users see own AI sessions" ON public.ai_intake_sessions;
CREATE POLICY "Users see own AI sessions" ON public.ai_intake_sessions FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins see all AI sessions" ON public.ai_intake_sessions;
CREATE POLICY "Admins see all AI sessions" ON public.ai_intake_sessions FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Users create own AI sessions" ON public.ai_intake_sessions;
CREATE POLICY "Users create own AI sessions" ON public.ai_intake_sessions FOR INSERT WITH CHECK (auth.uid() = client_id OR client_id IS NULL);
DROP POLICY IF EXISTS "Users update own AI sessions" ON public.ai_intake_sessions;
CREATE POLICY "Users update own AI sessions" ON public.ai_intake_sessions FOR UPDATE USING (auth.uid() = client_id OR public.is_admin());

-- AI analyses
DROP POLICY IF EXISTS "Users see own case analyses" ON public.ai_analyses;
CREATE POLICY "Users see own case analyses" ON public.ai_analyses FOR SELECT USING (EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND client_id = auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage analyses" ON public.ai_analyses;
CREATE POLICY "Admins manage analyses" ON public.ai_analyses FOR ALL USING (public.is_admin());

-- AI analysis queue
DROP POLICY IF EXISTS "System processes queue" ON public.ai_analysis_queue;
CREATE POLICY "System processes queue" ON public.ai_analysis_queue FOR ALL USING (public.is_admin());

-- Documents
DROP POLICY IF EXISTS "Users see own case documents" ON public.documents;
CREATE POLICY "Users see own case documents" ON public.documents FOR SELECT USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND (client_id = auth.uid() OR public.is_admin() OR public.is_attorney())));
DROP POLICY IF EXISTS "Users upload documents" ON public.documents;
CREATE POLICY "Users upload documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
DROP POLICY IF EXISTS "Case members update documents" ON public.documents;
CREATE POLICY "Case members update documents" ON public.documents FOR UPDATE USING (uploaded_by = auth.uid() OR public.is_admin() OR public.is_attorney());

-- Tasks
DROP POLICY IF EXISTS "Users see own tasks" ON public.tasks;
CREATE POLICY "Users see own tasks" ON public.tasks FOR SELECT USING (auth.uid() = assigned_to OR auth.uid() = created_by OR public.is_admin());
DROP POLICY IF EXISTS "Users create tasks" ON public.tasks;
CREATE POLICY "Users create tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Users update assigned tasks" ON public.tasks;
CREATE POLICY "Users update assigned tasks" ON public.tasks FOR UPDATE USING (auth.uid() = assigned_to OR auth.uid() = created_by OR public.is_admin());

-- Messages
DROP POLICY IF EXISTS "Users see own messages" ON public.messages;
CREATE POLICY "Users see own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR public.is_admin());
DROP POLICY IF EXISTS "Users send messages" ON public.messages;
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Users update own messages" ON public.messages;
CREATE POLICY "Users update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Case timeline
DROP POLICY IF EXISTS "Case members see timeline" ON public.case_timeline;
CREATE POLICY "Case members see timeline" ON public.case_timeline FOR SELECT USING (EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND (client_id = auth.uid() OR public.is_admin() OR public.is_attorney())));
DROP POLICY IF EXISTS "System inserts timeline" ON public.case_timeline;
CREATE POLICY "System inserts timeline" ON public.case_timeline FOR INSERT WITH CHECK (TRUE);

-- Privileged notes
DROP POLICY IF EXISTS "Attorneys see privileged notes" ON public.privileged_notes;
CREATE POLICY "Attorneys see privileged notes" ON public.privileged_notes FOR SELECT USING (public.is_attorney() OR public.is_admin());
DROP POLICY IF EXISTS "Attorneys create privileged notes" ON public.privileged_notes;
CREATE POLICY "Attorneys create privileged notes" ON public.privileged_notes FOR INSERT WITH CHECK (public.is_attorney() OR public.is_admin());

-- Consultations
DROP POLICY IF EXISTS "Users see own consultations" ON public.consultations;
CREATE POLICY "Users see own consultations" ON public.consultations FOR SELECT USING (auth.uid() = client_id OR public.is_attorney() OR public.is_admin());
DROP POLICY IF EXISTS "Users book consultations" ON public.consultations;
CREATE POLICY "Users book consultations" ON public.consultations FOR INSERT WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "Attorneys update consultations" ON public.consultations;
CREATE POLICY "Attorneys update consultations" ON public.consultations FOR UPDATE USING (public.is_attorney() OR public.is_admin() OR auth.uid() = client_id);

-- Notifications
DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System creates notifications" ON public.notifications;
CREATE POLICY "System creates notifications" ON public.notifications FOR INSERT WITH CHECK (TRUE);

-- Pricing plans
DROP POLICY IF EXISTS "Anyone can view pricing" ON public.pricing_plans;
CREATE POLICY "Anyone can view pricing" ON public.pricing_plans FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins manage pricing" ON public.pricing_plans;
CREATE POLICY "Admins manage pricing" ON public.pricing_plans FOR ALL USING (public.is_admin());

-- User subscriptions
DROP POLICY IF EXISTS "Users see own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users see own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins manage subscriptions" ON public.user_subscriptions FOR ALL USING (public.is_admin());

-- Payment records
DROP POLICY IF EXISTS "Users see own payments" ON public.payment_records;
CREATE POLICY "Users see own payments" ON public.payment_records FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins see all payments" ON public.payment_records;
CREATE POLICY "Admins see all payments" ON public.payment_records FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System creates payments" ON public.payment_records;
CREATE POLICY "System creates payments" ON public.payment_records FOR INSERT WITH CHECK (TRUE);

-- Consent logs
DROP POLICY IF EXISTS "Users see own consents" ON public.consent_logs;
CREATE POLICY "Users see own consents" ON public.consent_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System logs consents" ON public.consent_logs;
CREATE POLICY "System logs consents" ON public.consent_logs FOR INSERT WITH CHECK (TRUE);

-- Audit logs
DROP POLICY IF EXISTS "Admins see audit logs" ON public.audit_logs;
CREATE POLICY "Admins see audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System creates audit logs" ON public.audit_logs;
CREATE POLICY "System creates audit logs" ON public.audit_logs FOR INSERT WITH CHECK (TRUE);

-- API analytics
DROP POLICY IF EXISTS "Admins see api analytics" ON public.api_analytics;
CREATE POLICY "Admins see api analytics" ON public.api_analytics FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System logs api analytics" ON public.api_analytics;
CREATE POLICY "System logs api analytics" ON public.api_analytics FOR INSERT WITH CHECK (TRUE);

-- Error logs
DROP POLICY IF EXISTS "Admins see error logs" ON public.error_logs;
CREATE POLICY "Admins see error logs" ON public.error_logs FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System logs errors" ON public.error_logs;
CREATE POLICY "System logs errors" ON public.error_logs FOR INSERT WITH CHECK (TRUE);

-- Workbench
DROP POLICY IF EXISTS "Users manage own workbench" ON public.workbench_configs;
CREATE POLICY "Users manage own workbench" ON public.workbench_configs FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own widgets" ON public.workbench_widgets;
CREATE POLICY "Users manage own widgets" ON public.workbench_widgets FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own quick actions" ON public.workbench_quick_actions;
CREATE POLICY "Users manage own quick actions" ON public.workbench_quick_actions FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own pinned items" ON public.workbench_pinned_items;
CREATE POLICY "Users manage own pinned items" ON public.workbench_pinned_items FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users see own activity" ON public.workbench_recent_activity;
CREATE POLICY "Users see own activity" ON public.workbench_recent_activity FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System logs activity" ON public.workbench_recent_activity;
CREATE POLICY "System logs activity" ON public.workbench_recent_activity FOR INSERT WITH CHECK (TRUE);

-- Lead pipeline
DROP POLICY IF EXISTS "Admins manage pipeline stages" ON public.lead_pipeline_stages;
CREATE POLICY "Admins manage pipeline stages" ON public.lead_pipeline_stages FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Staff see transitions" ON public.lead_pipeline_transitions;
CREATE POLICY "Staff see transitions" ON public.lead_pipeline_transitions FOR SELECT USING (public.is_admin() OR public.is_attorney());
DROP POLICY IF EXISTS "Staff manage lead comms" ON public.lead_communications;
CREATE POLICY "Staff manage lead comms" ON public.lead_communications FOR ALL USING (public.is_admin() OR public.is_attorney());
DROP POLICY IF EXISTS "Admins manage automation" ON public.lead_automation_rules;
CREATE POLICY "Admins manage automation" ON public.lead_automation_rules FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Anyone submits forms" ON public.lead_form_submissions;
CREATE POLICY "Anyone submits forms" ON public.lead_form_submissions FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Admins manage form submissions" ON public.lead_form_submissions;
CREATE POLICY "Admins manage form submissions" ON public.lead_form_submissions FOR SELECT USING (public.is_admin());

-- CRM admin
DROP POLICY IF EXISTS "Admins manage admin sessions" ON public.admin_sessions;
CREATE POLICY "Admins manage admin sessions" ON public.admin_sessions FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins see activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins see activity logs" ON public.admin_activity_logs FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage dashboard widgets" ON public.crm_dashboard_widgets;
CREATE POLICY "Admins manage dashboard widgets" ON public.crm_dashboard_widgets FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage reports" ON public.crm_reports;
CREATE POLICY "Admins manage reports" ON public.crm_reports FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Users see own CRM notifications" ON public.crm_notifications;
CREATE POLICY "Users see own CRM notifications" ON public.crm_notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins manage CRM notifications" ON public.crm_notifications;
CREATE POLICY "Admins manage CRM notifications" ON public.crm_notifications FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage settings" ON public.crm_system_settings;
CREATE POLICY "Admins manage settings" ON public.crm_system_settings FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage contact messages" ON public.crm_contact_messages;
CREATE POLICY "Admins manage contact messages" ON public.crm_contact_messages FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage user notes" ON public.crm_user_notes;
CREATE POLICY "Admins manage user notes" ON public.crm_user_notes FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins see subscription events" ON public.crm_subscription_events;
CREATE POLICY "Admins see subscription events" ON public.crm_subscription_events FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System logs subscription events" ON public.crm_subscription_events;
CREATE POLICY "System logs subscription events" ON public.crm_subscription_events FOR INSERT WITH CHECK (TRUE);

-- Rate limit and backup
DROP POLICY IF EXISTS "System manages rate limits" ON public.rate_limit_logs;
CREATE POLICY "System manages rate limits" ON public.rate_limit_logs FOR ALL USING (TRUE);
DROP POLICY IF EXISTS "Admins manage backups" ON public.backup_records;
CREATE POLICY "Admins manage backups" ON public.backup_records FOR ALL USING (public.is_admin());

-- Legal articles
DROP POLICY IF EXISTS "Published articles are publicly readable" ON public.legal_articles;
CREATE POLICY "Published articles are publicly readable" ON public.legal_articles FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "Admins manage articles" ON public.legal_articles;
CREATE POLICY "Admins manage articles" ON public.legal_articles FOR ALL USING (public.is_admin());

-- ===========================================================================
-- 6. VIEWS
-- ===========================================================================

CREATE OR REPLACE VIEW public.v_crm_dashboard AS
SELECT
  (SELECT count(*) FROM public.leads WHERE status = 'new') AS new_leads_count,
  (SELECT count(*) FROM public.leads WHERE status = 'qualified') AS qualified_leads_count,
  (SELECT count(*) FROM public.cases WHERE status = 'active') AS active_cases_count,
  (SELECT count(*) FROM public.cases WHERE status = 'intake') AS intake_cases_count,
  (SELECT count(*) FROM public.intake_submissions WHERE status = 'submitted') AS pending_intakes_count,
  (SELECT count(*) FROM public.consultations WHERE status = 'scheduled') AS scheduled_consultations_count,
  (SELECT COALESCE(sum(estimated_value), 0) FROM public.leads WHERE status IN ('new','contacted','qualified')) AS pipeline_value,
  (SELECT COALESCE(sum(retainer_amount), 0) FROM public.cases WHERE status = 'active') AS active_case_value,
  (SELECT count(*) FROM public.ai_analyses WHERE status = 'processing') AS ai_processing_count,
  (SELECT count(*) FROM public.crm_contact_messages WHERE status = 'unread') AS unread_messages_count;

CREATE OR REPLACE VIEW public.v_lead_pipeline AS
SELECT
  ls.name AS stage_name,
  ls.slug AS stage_slug,
  ls.sort_order,
  ls.color,
  count(l.id) AS lead_count,
  COALESCE(sum(l.estimated_value), 0) AS total_value
FROM public.lead_pipeline_stages ls
LEFT JOIN public.leads l ON l.status = ls.slug
GROUP BY ls.id, ls.name, ls.slug, ls.sort_order, ls.color
ORDER BY ls.sort_order;

CREATE OR REPLACE VIEW public.v_client_overview AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.role,
  p.created_at,
  count(DISTINCT c.id) AS total_cases,
  count(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_cases,
  count(DISTINCT us.id) AS total_subscriptions,
  COALESCE(sum(pr.amount), 0) AS total_payments
FROM public.profiles p
LEFT JOIN public.cases c ON c.client_id = p.id
LEFT JOIN public.user_subscriptions us ON us.user_id = p.id
LEFT JOIN public.payment_records pr ON pr.user_id = p.id AND pr.status = 'completed'
GROUP BY p.id;

CREATE OR REPLACE VIEW public.v_attorney_workload AS
SELECT
  a.id,
  p.full_name,
  a.practice_number,
  a.specialization,
  a.available,
  count(DISTINCT c.id) AS total_cases,
  count(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_cases,
  count(DISTINCT t.id) FILTER (WHERE t.status IN ('pending','in_progress')) AS pending_tasks
FROM public.attorneys a
JOIN public.profiles p ON p.id = a.id
LEFT JOIN public.cases c ON c.attorney_id = a.id
LEFT JOIN public.tasks t ON t.assigned_to = a.id
GROUP BY a.id, p.full_name, a.practice_number, a.specialization, a.available;

CREATE OR REPLACE VIEW public.v_ai_usage_stats AS
SELECT
  date_trunc('day', aa.created_at) AS day,
  aa.analysis_type,
  count(*) AS total_analyses,
  avg(aa.confidence_score) AS avg_confidence,
  sum(aa.tokens_used) AS total_tokens,
  avg(aa.processing_time_ms) AS avg_processing_time,
  count(*) FILTER (WHERE aa.status = 'failed') AS failed_count
FROM public.ai_analyses aa
GROUP BY date_trunc('day', aa.created_at), aa.analysis_type
ORDER BY day DESC;

-- ===========================================================================
-- 7. SEED DATA
-- ===========================================================================

-- Lead pipeline stages
INSERT INTO public.lead_pipeline_stages (name, slug, description, sort_order, color, is_default)
VALUES
  ('New', 'new', 'Freshly received leads', 1, '#3B82F6', TRUE),
  ('Contacted', 'contacted', 'Lead has been contacted', 2, '#F59E0B', FALSE),
  ('Qualified', 'qualified', 'Lead has been qualified', 3, '#10B981', FALSE),
  ('Consultation Scheduled', 'consultation_scheduled', 'Consultation booked', 4, '#8B5CF6', FALSE),
  ('Retained', 'retained', 'Lead has become a client', 5, '#059669', FALSE),
  ('Lost', 'lost', 'Lead was lost', 6, '#EF4444', FALSE),
  ('Nurturing', 'nurturing', 'Lead is being nurtured', 7, '#6B7280', FALSE)
ON CONFLICT (slug) DO NOTHING;

-- Pricing plans (correct pricing matching frontend: Civil R99, Labour R99, Extensive R139)
INSERT INTO public.pricing_plans (name, slug, description, price_monthly, price_annual, currency, features, is_popular, is_active, sort_order)
VALUES
  ('Civil Legal Plan', 'civil_legal_plan', 'For civil disputes and general legal matters.', 99, 999, 'ZAR',
    '["Unlimited civil consultations","Document review & drafting","Court representation","AI case analysis","Email support"]'::JSONB, FALSE, TRUE, 1),
  ('Labour Legal Plan', 'labour_legal_plan', 'For workplace and employment matters.', 99, 999, 'ZAR',
    '["Unlimited labour consultations","CCMA representation","Employment contract review","Dismissal advice","Priority support"]'::JSONB, TRUE, TRUE, 2),
  ('Extensive Plan', 'extensive_plan', 'Complete legal coverage across all practice areas.', 139, 1399, 'ZAR',
    '["All Civil & Labour features","Family law consultations","Criminal defence advice","Estate planning","24/7 priority support","Dedicated attorney"]'::JSONB, FALSE, TRUE, 3)
ON CONFLICT (slug) DO NOTHING;

-- CRM dashboard widgets
INSERT INTO public.crm_dashboard_widgets (widget_key, title, description, widget_type, config, data_source, sort_order)
VALUES
  ('leads_overview', 'Leads Overview', 'Total leads and conversion rates', 'stat', '{"metric":"lead_count"}'::JSONB, 'leads', 1),
  ('active_cases', 'Active Cases', 'Currently active case count', 'stat', '{"metric":"active_cases"}'::JSONB, 'cases', 2),
  ('revenue_summary', 'Revenue Summary', 'Monthly revenue breakdown', 'chart', '{"chart_type":"bar","period":"monthly"}'::JSONB, 'payments', 3),
  ('pipeline_funnel', 'Lead Pipeline', 'Conversion funnel visualization', 'chart', '{"chart_type":"funnel"}'::JSONB, 'leads', 4),
  ('recent_activity', 'Recent Activity', 'Latest system events', 'list', '{"limit":10}'::JSONB, 'audit_logs', 5),
  ('ai_usage', 'AI Usage', 'AI feature usage metrics', 'stat', '{"metric":"ai_analyses"}'::JSONB, 'ai_analyses', 6),
  ('upcoming_consultations', 'Upcoming Consultations', 'Scheduled consultations', 'list', '{"limit":5}'::JSONB, 'consultations', 7),
  ('unread_messages', 'Unread Messages', 'Contact form submissions', 'stat', '{"metric":"unread_messages"}'::JSONB, 'contact_messages', 8)
ON CONFLICT (widget_key) DO NOTHING;

-- CRM system settings
INSERT INTO public.crm_system_settings (setting_key, setting_value, description, is_public)
VALUES
  ('company_name', '"Infinity Legal"'::JSONB, 'Company display name', TRUE),
  ('company_tagline', '"Expert Legal Solutions for South Africa"'::JSONB, 'Company tagline', TRUE),
  ('currency', '"ZAR"'::JSONB, 'Default currency', TRUE),
  ('timezone', '"Africa/Johannesburg"'::JSONB, 'System timezone', TRUE),
  ('consultation_duration', '60'::JSONB, 'Default consultation duration in minutes', FALSE),
  ('lead_score_threshold', '50'::JSONB, 'Minimum score for hot lead classification', FALSE),
  ('ai_max_tokens', '4096'::JSONB, 'Maximum tokens per AI request', FALSE),
  ('payfast_merchant_id', '"10000100"'::JSONB, 'PayFast sandbox merchant ID', FALSE),
  ('payfast_merchant_key', '"46f0cd694581a"'::JSONB, 'PayFast sandbox merchant key', FALSE),
  ('payfast_sandbox', 'true'::JSONB, 'Use PayFast sandbox mode', FALSE),
  ('max_file_upload_mb', '25'::JSONB, 'Maximum file upload size in MB', TRUE),
  ('support_email', '"support@infinitylegal.org"'::JSONB, 'Support email address', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- Legal articles seed data
INSERT INTO public.legal_articles (slug, title, subtitle, content, summary, category, tags, is_published, is_featured, reading_time_min, published_at, sort_order)
VALUES
  ('understanding-your-rights-under-popia', 'Understanding Your Rights Under POPIA', 'A comprehensive guide to South Africa''s Protection of Personal Information Act', E'# Understanding Your Rights Under POPIA\n\nThe Protection of Personal Information Act (POPIA) is South Africa''s comprehensive data protection law that gives you rights over how your personal information is collected, used, stored, and shared.\n\n## What is POPIA?\n\nPOPIA (Act 4 of 2013) came into full effect on 1 July 2021. It regulates the processing of personal information by both public and private bodies in South Africa, inspired by international data protection frameworks.\n\n## Your 8 Rights Under POPIA\n\n### 1. Right to Access\nYou have the right to request access to your personal information held by any organisation. They must provide it within 30 days.\n\n### 2. Right to Correction\nIf your personal information is inaccurate, incomplete, or outdated, you can request that it be corrected or deleted.\n\n### 3. Right to Object\nYou can object to the processing of your personal information in certain circumstances, including for direct marketing purposes.\n\n### 4. Right to Withdraw Consent\nIf processing is based on your consent, you may withdraw that consent at any time.\n\n### 5. Right to Complain\nYou can lodge a complaint with the Information Regulator if you believe your personal information has been mishandled.\n\n### 6. Right to Not Have Your Data Processed\nYou can request that your personal information not be processed for purposes beyond what you consented to.\n\n### 7. Right to Not Be Subject to Automated Decisions\nYou have the right not to be subject to decisions based solely on automated processing that significantly affect you.\n\n### 8. Right to Data Portability\nIn certain circumstances, you can request your personal information in a structured, commonly used format.\n\n## What Does This Mean for You?\n\nOrganisations must:\n- Only collect information they genuinely need\n- Tell you why they need it and how they''ll use it\n- Keep it secure and up to date\n- Not keep it longer than necessary\n- Get your consent before processing (in most cases)\n\n## Filing a Complaint\n\nIf you believe your POPIA rights have been violated, you can:\n1. Contact the organisation directly\n2. Lodge a complaint with the Information Regulator\n3. Seek legal advice\n\nThe Information Regulator can be contacted at: inforeg@justice.gov.za\n\n*This article is for informational purposes only and does not constitute legal advice. Consult with an attorney for specific guidance.*',
  'A comprehensive guide to South Africa''s Protection of Personal Information Act — your 8 rights and how to exercise them.',
  'popia_compliance', ARRAY['POPIA','data protection','privacy rights','Information Regulator'], TRUE, TRUE, 6, now(), 1),

  ('what-to-do-if-you-are-unfairly-dismissed', 'What to Do If You Are Unfairly Dismissed', 'Your step-by-step guide to CCMA referrals and labour rights in South Africa', E'# What to Do If You Are Unfairly Dismissed\n\nUnfair dismissal is one of the most common labour disputes in South Africa. The Labour Relations Act (LRA) protects employees from being fired without fair reason and proper procedure.\n\n## What Counts as Unfair Dismissal?\n\nA dismissal may be unfair if:\n- There was no fair reason (substantive fairness)\n- Proper procedure was not followed (procedural fairness)\n- It was an automatically unfair dismissal\n\n### Automatically Unfair Dismissals\nThe LRA lists dismissals that are automatically unfair, including:\n- Participation in a protected strike\n- Pregnancy-related reasons\n- Refusal to accept a demand in collective bargaining\n- Discrimination based on race, gender, religion, etc.\n- Exercising a right under the LRA\n\n## The 30-Day Rule\n\n**Critical:** You only have **30 days** from the date of dismissal to refer a dispute to the CCMA. Missing this deadline can severely affect your case.\n\n## Step-by-Step: Filing a CCMA Referral\n\n### Step 1: Get Your Dismissal in Writing\nRequest a written notice of dismissal from your employer. They are legally required to provide this.\n\n### Step 2: Gather Evidence\nCollect:\n- Employment contract\n- Payslips\n- Written warnings (if any)\n- Communication about the dismissal\n- Witness contact details\n\n### Step 3: Refer to the CCMA\nComplete form LRA 7.11 (Referral of Dispute) and submit it to your nearest CCMA office within 30 days.\n\n### Step 4: Conciliation\nThe CCMA will schedule a conciliation meeting. A commissioner will try to help you and your employer reach a settlement.\n\n### Step 5: Arbitration\nIf conciliation fails, the matter goes to arbitration. A commissioner will hear evidence from both sides and make a binding decision.\n\n## Possible Outcomes\n\nIf the CCMA finds your dismissal was unfair, they may order:\n- **Reinstatement** — you get your job back\n- **Re-employment** — you get a similar job\n- **Compensation** — up to 12 months'' salary\n- **Severance pay** — if applicable\n\n## Getting Legal Help\n\nYou don''t need an attorney for CCMA proceedings, but legal representation can significantly improve your chances — especially at arbitration.\n\n*This article is for informational purposes only and does not constitute legal advice. For case-specific guidance, book a consultation with an Infinity Legal attorney.*',
  'Step-by-step guide to CCMA referrals and labour rights in South Africa — including the critical 30-day deadline.',
  'labour_law', ARRAY['unfair dismissal','CCMA','labour law','LRA','employment rights'], TRUE, TRUE, 8, now(), 2),

  ('your-consumer-rights-in-south-africa', 'Your Consumer Rights in South Africa', 'How the Consumer Protection Act shields you from unfair business practices', E'# Your Consumer Rights in South Africa\n\nThe Consumer Protection Act (CPA) of 2008 is one of the most powerful pieces of legislation protecting South African consumers. Understanding your rights can save you money and prevent exploitation.\n\n## Your 9 Fundamental Consumer Rights\n\n### 1. Right to Equality\nNo supplier may discriminate against you based on race, gender, age, or disability when providing goods or services.\n\n### 2. Right to Privacy\nYou have the right to:\n- Refuse unwanted direct marketing\n- Opt out of marketing communications\n- Not be required to buy something as a condition of buying something else\n\n### 3. Right to Choose\nYou can:\n- Cancel a fixed-term agreement with 20 business days'' notice\n- Return defective goods within 6 months\n- Cancel advance bookings with reasonable notice\n\n### 4. Right to Information\nSuppliers must provide:\n- Clear pricing in ZAR\n- Product labels in plain language\n- Full terms and conditions before you sign\n- Right to cancel cooling-off period (5 business days for direct marketing)\n\n### 5. Right to Fair Value\nYou''re entitled to:\n- Fair pricing\n- Honest advertising\n- Quality goods that last a reasonable time\n\n### 6. Right to Safety\nProducts must be safe and carry appropriate warnings. You can sue for harm caused by unsafe products.\n\n### 7. Right to Fair Contract Terms\nNo unfair, unreasonable, or unjust contract terms. One-sided clauses may be struck down.\n\n### 8. Right to Fair Marketing\n- No bait marketing\n- No negative option marketing (sending stuff you didn''t order and billing you)\n- No pyramid schemes\n\n### 9. Right to Accountability\nSuppliers are accountable for:\n- Honouring warranties\n- Providing after-sales service\n- Handling complaints promptly\n\n## Common Scenarios\n\n### Returning a Defective Product\nUnder the CPA, you can return defective goods within **6 months** for your choice of repair, replacement, or refund.\n\n### Cancelling a Gym Contract\nFixed-term agreements can be cancelled with **20 business days'' notice**. You may owe a reasonable cancellation penalty (typically 10-15% of remaining value).\n\n### Cooling-Off Period\nIf you bought something through direct marketing (phone call, door-to-door), you have **5 business days** to cancel without penalty.\n\n## Where to Complain\n\n1. The supplier directly\n2. National Consumer Commission (NCC): 012 394 2000\n3. Provincial Consumer Affairs offices\n4. Legal consultation for complex matters\n\n*This article is for informational purposes only and does not constitute legal advice. For case-specific guidance, book a consultation with an Infinity Legal attorney.*',
  'How the Consumer Protection Act shields you from unfair business practices — your 9 fundamental rights explained.',
  'consumer_rights', ARRAY['consumer rights','CPA','Consumer Protection Act','returns','cooling-off period'], TRUE, TRUE, 7, now(), 3),

  ('guide-to-south-african-divorce-law', 'Guide to South African Divorce Law', 'What you need to know about divorce proceedings, maintenance, and custody', E'# Guide to South African Divorce Law\n\nGoing through a divorce is one of life''s most stressful experiences. Understanding the legal process can help you make informed decisions and protect your interests.\n\n## Grounds for Divorce\n\nSouth African law recognises one ground for divorce: the **irretrievable breakdown** of the marriage. This can be demonstrated by:\n- Not living together for 12+ months\n- Adultery\n- Habitual criminality\n- Drug or alcohol addiction\n- Abuse or desertion\n\n## Types of Divorce\n\n### Uncontested Divorce\nBoth spouses agree on all terms — property division, maintenance, custody. This is faster and more affordable, typically taking 4-8 weeks.\n\n### Contested Divorce\nSpouses disagree on one or more issues. This can take months or even years, requiring court proceedings.\n\n## Key Issues in Divorce\n\n### Division of Assets\nThis depends on your marital regime:\n- **In community of property** — all assets and debts are split 50/50\n- **Out of community of property (without accrual)** — each keeps their own\n- **Out of community of property (with accrual)** — the estate that grew more shares the difference\n\n### Maintenance\n- **Spousal maintenance** — may be awarded based on need and ability to pay\n- **Child maintenance** — both parents must contribute proportionally to their income\n\n### Child Custody\nThe Children''s Act prioritises the **best interests of the child**:\n- Primary residence (where the child lives)\n- Contact (visitation rights)\n- Guardianship (decision-making)\n\n## The Process\n\n1. **Summons** — One spouse issues a divorce summons\n2. **Response** — The other spouse responds within 10-30 days\n3. **Discovery** — Both disclose financial information\n4. **Mediation** — Often required before trial\n5. **Trial** (if contested) — A judge decides disputed issues\n6. **Decree** — The court grants the divorce order\n\n## Getting Help\n\nDivorce involves significant financial and emotional stakes. A family law attorney can help protect your rights and your children''s welfare.\n\n*This article is for informational purposes only and does not constitute legal advice. For case-specific guidance, book a consultation with an Infinity Legal attorney.*',
  'What you need to know about divorce proceedings, asset division, maintenance, and child custody in South Africa.',
  'family_law', ARRAY['divorce','family law','custody','maintenance','marital regime'], TRUE, FALSE, 9, now(), 4),

  ('renters-rights-under-the-rental-housing-act', 'Your Rights as a Tenant in South Africa', 'Know what your landlord can and cannot do under the Rental Housing Act', E'# Your Rights as a Tenant in South Africa\n\nThe Rental Housing Act and the Consumer Protection Act provide strong protections for tenants in South Africa. Knowing your rights can prevent exploitation and unlawful eviction.\n\n## Key Tenant Rights\n\n### Right to a Written Lease\nYour landlord must provide a written lease agreement that clearly states:\n- Rent amount and due date\n- Deposit amount and conditions for refund\n- Lease duration and renewal terms\n- Responsibilities of both parties\n- House rules (if applicable)\n\n### Right to a Habitable Dwelling\nYour landlord must maintain the property in a habitable condition, including:\n- Working plumbing and sanitation\n- Structural integrity\n- Weatherproofing\n- Reasonable security measures\n\n### Right Against Unlawful Eviction\n**No one may be evicted without a court order.** The Prevention of Illegal Eviction Act (PIE) protects against:\n- Lockouts\n- Cutting utilities\n- Removing belongings\n- Intimidation or threats\n\n### Right to Privacy\nYour landlord may not:\n- Enter without reasonable notice (usually 24-48 hours)\n- Conduct unnecessary inspections\n- Interfere with your peaceful occupation\n\n### Right to Fair Deposit Handling\n- Deposit must be held in an interest-bearing account\n- Must be refunded within 7-21 days of moving out\n- Deductions must be itemised and justified\n- You are entitled to a joint inspection before and after occupation\n\n### Right to Fair Rent Increases\n- Rent increases must be reasonable\n- Must be stipulated in the lease or agreed upon\n- Cannot be used as a tool for harassment\n\n## Common Problems & Solutions\n\n### Landlord Won''t Fix Things\n1. Report in writing with a deadline\n2. If no response, you may arrange repairs and deduct from rent (with proper notice)\n3. Report to the Rental Housing Tribunal\n\n### Unlawful Eviction Threats\n1. Do not leave voluntarily without a court order\n2. Contact the Rental Housing Tribunal\n3. Seek urgent legal assistance\n\n### Deposit Not Returned\n1. Request in writing with bank details\n2. Lodge a complaint with the Rental Housing Tribunal\n3. Consider small claims court (claims under R15,000)\n\n## Useful Contacts\n\n- **Rental Housing Tribunal**: 0800 11 22 33\n- **Legal Aid South Africa**: 0800 110 110\n- **Infinity Legal**: 068 127 6038\n\n*This article is for informational purposes only and does not constitute legal advice. For case-specific guidance, book a consultation with an Infinity Legal attorney.*',
  'Know what your landlord can and cannot do under the Rental Housing Act — unlawful eviction, deposits, and repairs.',
  'civil_litigation', ARRAY['tenant rights','rental housing','eviction','deposit','landlord'], TRUE, FALSE, 7, now(), 5),

  ('debt-review-and-debt-counselling-explained', 'Debt Review and Debt Counselling Explained', 'How the National Credit Act protects over-indebted South Africans', E'# Debt Review and Debt Counselling Explained\n\nIf you''re struggling with debt, the National Credit Act (NCA) provides a powerful legal protection: **debt review**. This process can help you restructure your debts and protect you from legal action by creditors.\n\n## What is Debt Review?\n\nDebt review (also called debt counselling) is a formal legal process where a registered debt counsellor assesses your financial situation and negotiates with your creditors for:\n- Reduced monthly payments\n- Extended payment terms\n- Lower interest rates\n- Waived fees\n\n## Who Qualifies?\n\nYou may qualify for debt review if:\n- You are over-indebted (unable to meet all debt obligations on time)\n- You earn a regular income\n- You have not yet been placed under administration or declared bankrupt\n\n## The Process\n\n1. **Application** — Contact a registered debt counsellor\n2. **Assessment** — The counsellor reviews your income, expenses, and debts\n3. **Determination** — They determine if you are over-indebted\n4. **Proposal** — A repayment plan is sent to all creditors\n5. **Court Order** — If creditors don''t consent, the counsellor applies to court\n6. **Repayment** — You make one affordable monthly payment distributed to creditors\n\n## Important Protections\n\n- **No legal action** — Creditors cannot take legal action against you while under debt review\n- **No asset repossession** — Your home and car are protected\n- **No more harassment** — Creditors must communicate through your counsellor\n\n## What Debt Review Does NOT Cover\n\n- Monthly living expenses\n- New debt incurred after entering debt review\n- Debt where legal action has already commenced\n\n## Exiting Debt Review\n\nYou can exit by:\n- Paying off all debts\n- Proving you are no longer over-indebted\n- Applying to court to be declared no longer over-indebted\n\n## Getting Help\n\nIf you''re struggling with debt, don''t wait until creditors take legal action. Contact a registered debt counsellor or speak to an attorney about your options.\n\n*This article is for informational purposes only and does not constitute legal advice. For case-specific guidance, book a consultation with an Infinity Legal attorney.*',
  'How the National Credit Act protects over-indebted South Africans through debt review and counselling.',
  'debt_recovery', ARRAY['debt review','debt counselling','NCA','National Credit Act','over-indebted'], TRUE, FALSE, 6, now(), 6)

ON CONFLICT (slug) DO NOTHING;

-- ===========================================================================
-- 8. GRANTS
-- ===========================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- =============================================================================
-- DONE. No enums, no transaction issues. TEXT + CHECK constraints for all
-- constrained columns. Fully idempotent. Safe to re-run any number of times.
-- =============================================================================
