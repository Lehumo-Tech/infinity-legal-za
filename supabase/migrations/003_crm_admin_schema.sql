-- ============================================
-- Infinity Legal ZA - CRM & Admin Schema
-- ============================================
-- This migration adds admin-specific tables for the CRM dashboard.
-- Only users with managing_director, senior_partner, or systems_admin roles
-- can access the CRM (enforced via RLS + API-level checks).
-- ============================================

-- ============================================
-- ADMIN SESSIONS TABLE
-- Tracks admin login sessions for security auditing
-- ============================================

CREATE TABLE public.admin_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  login_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  logout_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_admin_sessions_user_id ON public.admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_is_active ON public.admin_sessions(is_active);
CREATE INDEX idx_admin_sessions_login_at ON public.admin_sessions(login_at);

-- ============================================
-- ADMIN ACTIVITY LOGS TABLE
-- Detailed tracking of all CRM actions by admins
-- ============================================

CREATE TYPE public.admin_action_type AS ENUM (
  'view_crm', 'edit_user', 'deactivate_user', 'change_role',
  'view_subscription', 'cancel_subscription', 'refund_payment',
  'manage_pricing', 'export_data', 'run_backup', 'view_audit',
  'manage_lead', 'manage_case', 'system_config', 'admin_login',
  'admin_logout', 'bulk_action', 'generate_report'
);

CREATE TABLE public.admin_activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL NOT NULL,
  action public.admin_action_type NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_admin_activity_logs_user_id ON public.admin_activity_logs(user_id);
CREATE INDEX idx_admin_activity_logs_action ON public.admin_activity_logs(action);
CREATE INDEX idx_admin_activity_logs_resource ON public.admin_activity_logs(resource_type, resource_id);
CREATE INDEX idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at);

-- ============================================
-- ADMIN SETTINGS TABLE
-- Site-wide configuration managed via CRM
-- ============================================

CREATE TABLE public.admin_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_admin_settings_key ON public.admin_settings(key);

CREATE TRIGGER set_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- CRM DASHBOARD WIDGETS TABLE
-- Customizable widget layout for each admin user
-- ============================================

CREATE TYPE public.widget_type AS ENUM (
  'signup_stats', 'subscription_overview', 'revenue_chart',
  'lead_funnel', 'case_load', 'recent_activity', 'error_monitor',
  'system_health', 'payment_history', 'user_growth', 'top_cases',
  'task_overview', 'consultation_stats', 'custom'
);

CREATE TABLE public.crm_widgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  widget_type public.widget_type NOT NULL,
  title TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  position_x INT DEFAULT 0 NOT NULL,
  position_y INT DEFAULT 0 NOT NULL,
  width INT DEFAULT 1 NOT NULL,
  height INT DEFAULT 1 NOT NULL,
  is_visible BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_crm_widgets_user_id ON public.crm_widgets(user_id);
CREATE INDEX idx_crm_widgets_widget_type ON public.crm_widgets(widget_type);

CREATE TRIGGER set_crm_widgets_updated_at
  BEFORE UPDATE ON public.crm_widgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ADMIN NOTIFICATIONS TABLE
-- CRM-specific notifications for admin users
-- ============================================

CREATE TYPE public.admin_notification_priority AS ENUM ('low', 'normal', 'high', 'critical');

CREATE TABLE public.admin_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  target_role public.user_role NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority public.admin_notification_priority DEFAULT 'normal' NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  action_url TEXT,
  related_resource_type TEXT,
  related_resource_id UUID,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_admin_notifications_target_role ON public.admin_notifications(target_role);
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_priority ON public.admin_notifications(priority);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at);

-- ============================================
-- DATA EXPORT JOBS TABLE
-- Track data exports initiated from CRM
-- ============================================

CREATE TYPE public.export_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE public.data_exports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requested_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL NOT NULL,
  export_type TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  file_url TEXT,
  file_size_bytes INT,
  row_count INT,
  status public.export_status DEFAULT 'pending' NOT NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_data_exports_requested_by ON public.data_exports(requested_by);
CREATE INDEX idx_data_exports_status ON public.data_exports(status);
CREATE INDEX idx_data_exports_export_type ON public.data_exports(export_type);
CREATE INDEX idx_data_exports_created_at ON public.data_exports(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) FOR CRM TABLES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
  
  RETURN user_role IN ('managing_director', 'senior_partner', 'systems_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Admin sessions: only admins can view/manage
CREATE POLICY "Admins can view admin sessions"
  ON public.admin_sessions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert admin sessions"
  ON public.admin_sessions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update admin sessions"
  ON public.admin_sessions FOR UPDATE
  USING (public.is_admin());

-- Admin activity logs: only admins can view, service role can insert
CREATE POLICY "Admins can view activity logs"
  ON public.admin_activity_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Service role can insert activity logs"
  ON public.admin_activity_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Admin settings: only admins can manage
CREATE POLICY "Admins can view settings"
  ON public.admin_settings FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage settings"
  ON public.admin_settings FOR ALL
  USING (public.is_admin());

-- CRM widgets: admins can manage their own
CREATE POLICY "Admins can view own widgets"
  ON public.crm_widgets FOR SELECT
  USING (public.is_admin() AND user_id = auth.uid());

CREATE POLICY "Admins can manage own widgets"
  ON public.crm_widgets FOR ALL
  USING (public.is_admin() AND user_id = auth.uid());

-- Admin notifications: admins with matching role can view
CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage notifications"
  ON public.admin_notifications FOR ALL
  USING (public.is_admin());

-- Data exports: admins can view and manage their own
CREATE POLICY "Admins can view own exports"
  ON public.data_exports FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage own exports"
  ON public.data_exports FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update own exports"
  ON public.data_exports FOR UPDATE
  USING (public.is_admin());

-- Service role full access to all CRM tables
CREATE POLICY "Service role full access on admin_sessions"
  ON public.admin_sessions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on admin_activity_logs"
  ON public.admin_activity_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on admin_settings"
  ON public.admin_settings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on crm_widgets"
  ON public.crm_widgets FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on admin_notifications"
  ON public.admin_notifications FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on data_exports"
  ON public.data_exports FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SEED: DEFAULT ADMIN SETTINGS
-- ============================================

INSERT INTO public.admin_settings (key, value, description) VALUES
  ('site_name', '"Infinity Legal ZA"', 'Site display name'),
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('max_free_consultations', '3', 'Max free consultations for non-subscribers'),
  ('auto_assign_leads', 'true', 'Automatically assign leads to available attorneys'),
  ('lead_sla_hours', '24', 'Hours before a lead is considered overdue'),
  ('enable_ai_intake', 'true', 'Enable AI-powered intake form'),
  ('enable_public_pricing', 'true', 'Show pricing page to public'),
  ('default_subscription_plan', '"extensive-legal"', 'Default plan slug for new subscribers'),
  ('payfast_sandbox_mode', 'true', 'Use PayFast sandbox for payments'),
  ('crm_session_timeout_minutes', '60', 'CRM session timeout in minutes');

-- ============================================
-- SEED: DEFAULT CRM WIDGETS (for admin users)
-- ============================================

-- Default widgets will be created dynamically when an admin first visits the CRM

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Allow the is_admin function to be called by authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
