-- ============================================
-- Infinity Legal ZA - Admin CRM Schema
-- Migration 002: Admin panel, CRM dashboard, 
-- role-based access control
-- ============================================

-- ============================================
-- 1. ADD 'admin' TO user_role ENUM
-- ============================================

-- Add 'admin' role to the existing user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin' AFTER 'managing_director';

-- ============================================
-- 2. NEW ENUMS FOR CRM
-- ============================================

CREATE TYPE public.crm_widget_type AS ENUM (
  'signups_chart', 'revenue_chart', 'leads_funnel', 'cases_by_type',
  'subscriptions_status', 'recent_activity', 'quick_stats',
  'upcoming_consultations', 'pending_tasks', 'error_rate'
);

CREATE TYPE public.admin_action_category AS ENUM (
  'user_management', 'case_management', 'subscription_management',
  'content_management', 'system_configuration', 'report_generation',
  'financial_management', 'lead_management', 'document_management'
);

CREATE TYPE public.crm_report_type AS ENUM (
  'daily_summary', 'weekly_summary', 'monthly_summary',
  'revenue_report', 'user_growth', 'case_analytics',
  'subscription_analytics', 'lead_conversion', 'custom'
);

CREATE TYPE public.crm_report_status AS ENUM (
  'pending', 'generating', 'completed', 'failed'
);

-- ============================================
-- 3. ADMIN SESSIONS TABLE
-- ============================================
-- Tracks admin login sessions with device/IP info

CREATE TABLE public.admin_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  login_method TEXT DEFAULT 'credentials' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_admin_sessions_user_id ON public.admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_session_token ON public.admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_is_active ON public.admin_sessions(is_active);
CREATE INDEX idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);

-- ============================================
-- 4. ADMIN ACTIVITY LOGS TABLE
-- ============================================
-- Granular audit trail of all admin CRM actions

CREATE TABLE public.admin_activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL NOT NULL,
  action_category public.admin_action_category NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  description TEXT,
  previous_state TEXT,
  new_state TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_admin_activity_admin_user ON public.admin_activity_logs(admin_user_id);
CREATE INDEX idx_admin_activity_category ON public.admin_activity_logs(action_category);
CREATE INDEX idx_admin_activity_resource ON public.admin_activity_logs(resource_type, resource_id);
CREATE INDEX idx_admin_activity_action ON public.admin_activity_logs(action);
CREATE INDEX idx_admin_activity_created_at ON public.admin_activity_logs(created_at);

-- ============================================
-- 5. CRM DASHBOARD WIDGETS TABLE
-- ============================================
-- Per-admin customizable dashboard layout

CREATE TABLE public.crm_dashboard_widgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  widget_type public.crm_widget_type NOT NULL,
  title TEXT NOT NULL,
  position_x INT DEFAULT 0 NOT NULL,
  position_y INT DEFAULT 0 NOT NULL,
  width INT DEFAULT 1 NOT NULL,
  height INT DEFAULT 1 NOT NULL,
  config TEXT,
  is_visible BOOLEAN DEFAULT true NOT NULL,
  refresh_interval_seconds INT DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(admin_user_id, widget_type)
);

CREATE INDEX idx_crm_widgets_admin_user ON public.crm_dashboard_widgets(admin_user_id);
CREATE INDEX idx_crm_widgets_visible ON public.crm_dashboard_widgets(is_visible);

CREATE TRIGGER set_crm_dashboard_widgets_updated_at
  BEFORE UPDATE ON public.crm_dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. CRM REPORTS TABLE
-- ============================================
-- Generated and scheduled reports

CREATE TABLE public.crm_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requested_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL NOT NULL,
  report_type public.crm_report_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  status public.crm_report_status DEFAULT 'pending' NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size INT,
  parameters TEXT,
  is_scheduled BOOLEAN DEFAULT false NOT NULL,
  schedule_cron TEXT,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_crm_reports_requested_by ON public.crm_reports(requested_by);
CREATE INDEX idx_crm_reports_type ON public.crm_reports(report_type);
CREATE INDEX idx_crm_reports_status ON public.crm_reports(status);
CREATE INDEX idx_crm_reports_scheduled ON public.crm_reports(is_scheduled);
CREATE INDEX idx_crm_reports_created_at ON public.crm_reports(created_at);

CREATE TRIGGER set_crm_reports_updated_at
  BEFORE UPDATE ON public.crm_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 7. CRM NOTIFICATIONS TABLE
-- ============================================
-- Admin-specific notifications for CRM events

CREATE TABLE public.crm_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  related_resource_type TEXT,
  related_resource_id UUID,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_crm_notifications_admin_user ON public.crm_notifications(admin_user_id);
CREATE INDEX idx_crm_notifications_is_read ON public.crm_notifications(is_read);
CREATE INDEX idx_crm_notifications_type ON public.crm_notifications(type);
CREATE INDEX idx_crm_notifications_created_at ON public.crm_notifications(created_at);

-- ============================================
-- 8. CRM SYSTEM SETTINGS TABLE
-- ============================================
-- Key-value store for admin-configurable settings

CREATE TABLE public.crm_system_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT DEFAULT 'string' NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_crm_settings_key ON public.crm_system_settings(setting_key);

CREATE TRIGGER set_crm_system_settings_updated_at
  BEFORE UPDATE ON public.crm_system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 9. CRM CONTACT MESSAGES TABLE
-- ============================================
-- Stores messages submitted through the site contact form

CREATE TABLE public.crm_contact_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'website' NOT NULL,
  status TEXT DEFAULT 'new' NOT NULL,
  assigned_to UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  notes TEXT,
  is_archived BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_crm_contact_messages_status ON public.crm_contact_messages(status);
CREATE INDEX idx_crm_contact_messages_email ON public.crm_contact_messages(email);
CREATE INDEX idx_crm_contact_messages_assigned ON public.crm_contact_messages(assigned_to);
CREATE INDEX idx_crm_contact_messages_created_at ON public.crm_contact_messages(created_at);
CREATE INDEX idx_crm_contact_messages_is_archived ON public.crm_contact_messages(is_archived);

CREATE TRIGGER set_crm_contact_messages_updated_at
  BEFORE UPDATE ON public.crm_contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 10. CRM USER NOTES TABLE
-- ============================================
-- Admin notes attached to specific users/profiles

CREATE TABLE public.crm_user_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  target_user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  admin_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL NOT NULL,
  note TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_crm_user_notes_target ON public.crm_user_notes(target_user_id);
CREATE INDEX idx_crm_user_notes_admin ON public.crm_user_notes(admin_user_id);
CREATE INDEX idx_crm_user_notes_pinned ON public.crm_user_notes(is_pinned);

CREATE TRIGGER set_crm_user_notes_updated_at
  BEFORE UPDATE ON public.crm_user_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 11. CRM SUBSCRIPTION EVENTS TABLE
-- ============================================
-- Detailed subscription lifecycle tracking

CREATE TABLE public.crm_subscription_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  plan_id UUID REFERENCES public.pricing_plans(id) ON DELETE SET NULL,
  amount FLOAT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_crm_sub_events_subscription ON public.crm_subscription_events(subscription_id);
CREATE INDEX idx_crm_sub_events_user ON public.crm_subscription_events(user_id);
CREATE INDEX idx_crm_sub_events_type ON public.crm_subscription_events(event_type);
CREATE INDEX idx_crm_sub_events_created_at ON public.crm_subscription_events(created_at);

-- ============================================
-- 12. HELPER FUNCTION: is_admin()
-- ============================================
-- Returns true if the current authenticated user has an admin role

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'managing_director', 'systems_admin')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 13. HELPER FUNCTION: get_admin_role()
-- ============================================
-- Returns the admin role of the current user, or NULL

CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS public.user_role AS $$
DECLARE
  user_role public.user_role;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid()
  AND role IN ('admin', 'managing_director', 'systems_admin')
  AND is_active = true;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 14. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_subscription_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 15. RLS POLICIES - ADMIN-ONLY ACCESS
-- ============================================
-- Only users with admin/managing_director/systems_admin role can access CRM tables

-- Admin Sessions: only the admin themselves or any admin can view
CREATE POLICY "Admins can view own sessions"
  ON public.admin_sessions FOR SELECT
  USING (is_admin() AND (user_id = auth.uid() OR is_admin()));

CREATE POLICY "Admins can insert own sessions"
  ON public.admin_sessions FOR INSERT
  WITH CHECK (is_admin() AND user_id = auth.uid());

CREATE POLICY "Admins can update own sessions"
  ON public.admin_sessions FOR UPDATE
  USING (is_admin() AND user_id = auth.uid());

CREATE POLICY "Admins can delete own sessions"
  ON public.admin_sessions FOR DELETE
  USING (is_admin());

-- Admin Activity Logs: admin read-only (written via service role)
CREATE POLICY "Admins can view activity logs"
  ON public.admin_activity_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert activity logs"
  ON public.admin_activity_logs FOR INSERT
  WITH CHECK (is_admin());

-- CRM Dashboard Widgets: admins manage their own
CREATE POLICY "Admins can view own widgets"
  ON public.crm_dashboard_widgets FOR SELECT
  USING (is_admin() AND admin_user_id = auth.uid());

CREATE POLICY "Admins can insert own widgets"
  ON public.crm_dashboard_widgets FOR INSERT
  WITH CHECK (is_admin() AND admin_user_id = auth.uid());

CREATE POLICY "Admins can update own widgets"
  ON public.crm_dashboard_widgets FOR UPDATE
  USING (is_admin() AND admin_user_id = auth.uid());

CREATE POLICY "Admins can delete own widgets"
  ON public.crm_dashboard_widgets FOR DELETE
  USING (is_admin() AND admin_user_id = auth.uid());

-- CRM Reports: admins can manage all reports
CREATE POLICY "Admins can view reports"
  ON public.crm_reports FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can create reports"
  ON public.crm_reports FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update reports"
  ON public.crm_reports FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete reports"
  ON public.crm_reports FOR DELETE
  USING (is_admin());

-- CRM Notifications: admins see their own notifications
CREATE POLICY "Admins can view own notifications"
  ON public.crm_notifications FOR SELECT
  USING (is_admin() AND admin_user_id = auth.uid());

CREATE POLICY "Admins can insert own notifications"
  ON public.crm_notifications FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update own notifications"
  ON public.crm_notifications FOR UPDATE
  USING (is_admin() AND admin_user_id = auth.uid());

CREATE POLICY "Admins can delete own notifications"
  ON public.crm_notifications FOR DELETE
  USING (is_admin() AND admin_user_id = auth.uid());

-- CRM System Settings: admins can read/write all settings
CREATE POLICY "Admins can view settings"
  ON public.crm_system_settings FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert settings"
  ON public.crm_system_settings FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update settings"
  ON public.crm_system_settings FOR UPDATE
  USING (is_admin());

-- CRM Contact Messages: admins full access
CREATE POLICY "Admins can view contact messages"
  ON public.crm_contact_messages FOR SELECT
  USING (is_admin());

CREATE POLICY "Anyone can submit contact message"
  ON public.crm_contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update contact messages"
  ON public.crm_contact_messages FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete contact messages"
  ON public.crm_contact_messages FOR DELETE
  USING (is_admin());

-- CRM User Notes: admins full access
CREATE POLICY "Admins can view user notes"
  ON public.crm_user_notes FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert user notes"
  ON public.crm_user_notes FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update user notes"
  ON public.crm_user_notes FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete user notes"
  ON public.crm_user_notes FOR DELETE
  USING (is_admin());

-- CRM Subscription Events: admin read, service role write
CREATE POLICY "Admins can view subscription events"
  ON public.crm_subscription_events FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert subscription events"
  ON public.crm_subscription_events FOR INSERT
  WITH CHECK (is_admin());

-- ============================================
-- 16. ADMIN ACCESS TO EXISTING TABLES
-- ============================================
-- Grant admin users read access to ALL existing tables for CRM dashboard

-- Profiles: admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

-- Cases: admins can view all cases
CREATE POLICY "Admins can view all cases"
  ON public.cases FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update cases"
  ON public.cases FOR UPDATE
  USING (is_admin());

-- Leads: admins can view/manage all leads
CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (is_admin());

-- Documents: admins can view all documents
CREATE POLICY "Admins can view all documents"
  ON public.documents FOR SELECT
  USING (is_admin());

-- Intake: admins can view/update all intake submissions
CREATE POLICY "Admins can view all intake"
  ON public.intake_submissions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update intake"
  ON public.intake_submissions FOR UPDATE
  USING (is_admin());

-- Tasks: admins can view all tasks
CREATE POLICY "Admins can view all tasks"
  ON public.tasks FOR SELECT
  USING (is_admin());

-- Messages: admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (is_admin());

-- Audit Logs: admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (is_admin());

-- Notifications: admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (is_admin());

-- Consultations: admins can view/manage all consultations
CREATE POLICY "Admins can view all consultations"
  ON public.consultations FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update consultations"
  ON public.consultations FOR UPDATE
  USING (is_admin());

-- User Subscriptions: admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update subscriptions"
  ON public.user_subscriptions FOR UPDATE
  USING (is_admin());

-- Payment Records: admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payment_records FOR SELECT
  USING (is_admin());

-- Privileged Notes: admins can view all privileged notes
CREATE POLICY "Admins can view all privileged notes"
  ON public.privileged_notes FOR SELECT
  USING (is_admin());

-- API Analytics: admins can view analytics
CREATE POLICY "Admins can view api analytics"
  ON public.api_analytics FOR SELECT
  USING (is_admin());

-- Error Logs: admins can view and resolve errors
CREATE POLICY "Admins can view error logs"
  ON public.error_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update error logs"
  ON public.error_logs FOR UPDATE
  USING (is_admin());

-- Attorneys: admins can view/manage attorneys
CREATE POLICY "Admins can view all attorneys"
  ON public.attorneys FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update attorneys"
  ON public.attorneys FOR UPDATE
  USING (is_admin());

-- Pricing Plans: admins can manage plans
CREATE POLICY "Admins can manage pricing plans"
  ON public.pricing_plans FOR ALL
  USING (is_admin());

-- ============================================
-- 17. CRM DASHBOARD VIEWS
-- ============================================

-- View: User sign-up statistics
CREATE OR REPLACE VIEW public.crm_signup_stats AS
SELECT
  DATE(p.created_at) AS signup_date,
  COUNT(*) AS total_signups,
  COUNT(*) FILTER (WHERE p.role = 'client') AS client_signups,
  COUNT(*) FILTER (WHERE p.role = 'admin') AS admin_signups,
  COUNT(*) FILTER (WHERE p.role IN ('associate', 'paralegal', 'candidate_attorney')) AS staff_signups,
  COUNT(*) FILTER (WHERE p.is_active = true) AS active_users
FROM public.profiles p
GROUP BY DATE(p.created_at)
ORDER BY signup_date DESC;

-- View: Subscription revenue summary
CREATE OR REPLACE VIEW public.crm_revenue_summary AS
SELECT
  DATE(pr.created_at) AS payment_date,
  COUNT(*) AS total_payments,
  SUM(pr.amount_gross) AS gross_revenue,
  SUM(pr.amount_fee) AS total_fees,
  SUM(pr.amount_net) AS net_revenue,
  COUNT(*) FILTER (WHERE pr.payment_status = 'complete') AS completed_payments,
  COUNT(*) FILTER (WHERE pr.payment_status = 'pending') AS pending_payments,
  COUNT(*) FILTER (WHERE pr.payment_status = 'failed') AS failed_payments
FROM public.payment_records pr
GROUP BY DATE(pr.created_at)
ORDER BY payment_date DESC;

-- View: Lead conversion funnel
CREATE OR REPLACE VIEW public.crm_lead_funnel AS
SELECT
  l.status,
  COUNT(*) AS count,
  l.source,
  COUNT(*) FILTER (WHERE l.converted_case_id IS NOT NULL) AS converted_count
FROM public.leads l
GROUP BY l.status, l.source
ORDER BY count DESC;

-- View: Case pipeline overview
CREATE OR REPLACE VIEW public.crm_case_pipeline AS
SELECT
  c.status,
  c.case_type,
  COUNT(*) AS case_count,
  AVG(c.estimated_value) AS avg_value,
  SUM(c.estimated_value) AS total_value,
  COUNT(*) FILTER (WHERE c.is_high_risk = true) AS high_risk_count,
  MIN(c.created_at) AS oldest_case,
  MAX(c.created_at) AS newest_case
FROM public.cases c
GROUP BY c.status, c.case_type
ORDER BY case_count DESC;

-- View: Active subscription metrics
CREATE OR REPLACE VIEW public.crm_subscription_metrics AS
SELECT
  us.status AS subscription_status,
  pp.name AS plan_name,
  pp.slug AS plan_slug,
  COUNT(*) AS subscriber_count,
  SUM(pp.price_monthly) AS monthly_recurring_revenue
FROM public.user_subscriptions us
JOIN public.pricing_plans pp ON us.plan_id = pp.id
GROUP BY us.status, pp.name, pp.slug
ORDER BY subscriber_count DESC;

-- ============================================
-- 18. SEED: DEFAULT CRM SYSTEM SETTINGS
-- ============================================

INSERT INTO public.crm_system_settings (setting_key, setting_value, setting_type, description) VALUES
  ('site_name', 'Infinity Legal', 'string', 'Public site display name'),
  ('site_tagline', 'Professional Legal Services', 'string', 'Site tagline'),
  ('contact_email', 'info@infinitylegal.org', 'string', 'Primary contact email'),
  ('contact_phone', '068 127 6038', 'string', 'Primary contact phone'),
  ('contact_whatsapp', '068 127 6038', 'string', 'WhatsApp number'),
  ('contact_address', '93 Grayston Drive, Sandton', 'string', 'Physical address'),
  ('payfast_mode', 'sandbox', 'string', 'PayFast mode: sandbox or live'),
  ('max_free_cases', '3', 'number', 'Maximum cases for free tier'),
  ('trial_period_days', '14', 'number', 'Trial period in days'),
  ('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
  ('registration_enabled', 'true', 'boolean', 'Allow new user registrations'),
  ('ai_chat_enabled', 'true', 'boolean', 'Enable AI chat assistant'),
  ('email_notifications', 'true', 'boolean', 'Send email notifications'),
  ('lead_sla_hours', '24', 'number', 'SLA hours for lead response');

-- ============================================
-- 19. SEED: DEFAULT CRM DASHBOARD WIDGETS
-- ============================================
-- These will be assigned to the admin user once they sign up
-- (admin_user_id will be set programmatically after first admin signup)

-- ============================================
-- 20. TRIGGER: Log subscription events automatically
-- ============================================

CREATE OR REPLACE FUNCTION public.log_subscription_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.crm_subscription_events (
    subscription_id, user_id, event_type, previous_status, new_status, plan_id
  ) VALUES (
    NEW.id,
    NEW.user_id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'subscription_created'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'status_changed'
      WHEN TG_OP = 'UPDATE' AND OLD.cancel_at_period_end = false AND NEW.cancel_at_period_end = true THEN 'cancellation_requested'
      WHEN TG_OP = 'UPDATE' THEN 'subscription_updated'
    END,
    OLD.status,
    NEW.status,
    NEW.plan_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.log_subscription_event();

-- ============================================
-- 21. TRIGGER: Auto-notify admins of new signups
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_admins_new_signup()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Notify all admin users of new signup
  FOR admin_record IN
    SELECT user_id FROM public.profiles
    WHERE role IN ('admin', 'managing_director', 'systems_admin')
    AND is_active = true
  LOOP
    INSERT INTO public.crm_notifications (
      admin_user_id, type, title, message, priority, related_resource_type, related_resource_id
    ) VALUES (
      admin_record.user_id,
      'new_signup',
      'New User Registration',
      COALESCE(NEW.full_name, NEW.email) || ' has signed up',
      'normal',
      'profile',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_signup();

-- ============================================
-- 22. TRIGGER: Auto-notify admins of new leads
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_admins_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM public.profiles
    WHERE role IN ('admin', 'managing_director', 'systems_admin')
    AND is_active = true
  LOOP
    INSERT INTO public.crm_notifications (
      admin_user_id, type, title, message, priority, related_resource_type, related_resource_id
    ) VALUES (
      admin_record.user_id,
      'new_lead',
      'New Lead Received',
      NEW.name || ' (' || NEW.email || ') - ' || NEW.source,
      CASE WHEN NEW.urgency = 'critical' THEN 'high' ELSE 'normal' END,
      'lead',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_lead();

-- ============================================
-- 23. TRIGGER: Auto-notify admins of new contact messages
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_admins_new_contact()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM public.profiles
    WHERE role IN ('admin', 'managing_director', 'systems_admin')
    AND is_active = true
  LOOP
    INSERT INTO public.crm_notifications (
      admin_user_id, type, title, message, priority, related_resource_type, related_resource_id
    ) VALUES (
      admin_record.user_id,
      'new_contact',
      'New Contact Message',
      NEW.name || ': ' || LEFT(NEW.subject, 50),
      'normal',
      'contact_message',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_contact_message
  AFTER INSERT ON public.crm_contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_contact();

-- ============================================
-- 24. SEED: DEFAULT ADMIN WIDGETS TEMPLATE
-- ============================================
-- Function to seed default widgets for a new admin user

CREATE OR REPLACE FUNCTION public.seed_admin_widgets(p_admin_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.crm_dashboard_widgets (admin_user_id, widget_type, title, position_x, position_y, width, height, config)
  VALUES
    (p_admin_user_id, 'quick_stats', 'Quick Stats', 0, 0, 4, 1, '{"metrics": ["total_users", "active_subscriptions", "monthly_revenue", "new_leads"]}'),
    (p_admin_user_id, 'signups_chart', 'User Signups', 0, 1, 2, 2, '{"period": "30d", "chart_type": "line"}'),
    (p_admin_user_id, 'revenue_chart', 'Revenue', 2, 1, 2, 2, '{"period": "30d", "chart_type": "bar"}'),
    (p_admin_user_id, 'recent_activity', 'Recent Activity', 0, 3, 3, 2, '{"limit": 10}'),
    (p_admin_user_id, 'leads_funnel', 'Lead Funnel', 3, 3, 1, 2, '{}'),
    (p_admin_user_id, 'subscriptions_status', 'Subscriptions', 0, 5, 2, 1, '{}'),
    (p_admin_user_id, 'upcoming_consultations', 'Upcoming Consultations', 2, 5, 2, 1, '{"limit": 5}')
  ON CONFLICT (admin_user_id, widget_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 25. GRANT PERMISSIONS ON VIEWS
-- ============================================

-- Views are accessible based on the underlying table RLS policies
-- Admin users can query these views through their authenticated sessions

-- ============================================
-- NOTES FOR THE DEVELOPER:
-- ============================================
-- 
-- To set up the first admin user:
-- 1. Sign up via Supabase Auth with admin email
-- 2. Run this SQL to promote the user to admin:
--    UPDATE public.profiles 
--    SET role = 'admin' 
--    WHERE email = 'your-admin@email.com';
-- 3. Run this SQL to seed their dashboard widgets:
--    SELECT public.seed_admin_widgets(
--      (SELECT user_id FROM public.profiles WHERE email = 'your-admin@email.com')
--    );
--
-- The admin CRM is accessible at /admin route
-- Only users with role 'admin', 'managing_director', or 'systems_admin' can access it
-- All CRM actions are logged in admin_activity_logs
-- Admin notifications are triggered automatically for key events
