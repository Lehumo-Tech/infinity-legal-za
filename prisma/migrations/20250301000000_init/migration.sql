-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('managing_director', 'senior_partner', 'associate', 'paralegal', 'legal_officer', 'supervising_officer', 'senior_consultant', 'consultant', 'candidate_attorney', 'hr_manager', 'finance_manager', 'office_administrator', 'systems_admin', 'receptionist', 'client', 'guest');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('management', 'litigation', 'conveyancing', 'family_law', 'corporate', 'criminal_law', 'estate_planning', 'consulting', 'hr', 'finance', 'it', 'administration');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('family_law', 'criminal_defence', 'civil_litigation', 'conveyancing', 'estate_planning', 'corporate_commercial', 'debt_collection', 'immigration', 'labour_law', 'personal_injury', 'other');

-- CreateEnum
CREATE TYPE "CaseUrgency" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('intake', 'pending_review', 'active', 'on_hold', 'settled', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('website', 'referral', 'walk_in', 'social_media', 'advertisement', 'cold_call', 'other');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'disqualified');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('contract', 'pleading', 'correspondence', 'court_filing', 'affidavit', 'opinion', 'memo', 'invoice', 'consent_form', 'id_document', 'other');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('draft', 'review', 'approved', 'signed', 'filed', 'archived');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('message', 'note', 'system', 'alert');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('data_processing', 'marketing', 'third_party_sharing', 'automated_decision', 'popia_general');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('case_update', 'task_assigned', 'document_review', 'message', 'system', 'deadline', 'lead_assigned', 'consultation');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('in_person', 'video_call', 'phone_call');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'cancelled', 'expired', 'trialing');

-- CreateEnum
CREATE TYPE "AttorneyAvailability" AS ENUM ('available', 'busy', 'on_leave', 'unavailable');

-- CreateEnum
CREATE TYPE "PrivilegedNoteVisibility" AS ENUM ('officer_only', 'managing_partner_only', 'attorney_client');

-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('runtime', 'api', 'database', 'auth', 'validation', 'network', 'unknown');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'client',
    "department" "Department",
    "bar_number" TEXT,
    "hire_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "password_expires_at" TIMESTAMP(3),
    "last_password_change" TIMESTAMP(3),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "supervisor_id" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "department" "Department",
    "bar_number" TEXT,
    "hire_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "matter_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "case_type" "CaseType" NOT NULL,
    "urgency" "CaseUrgency" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'intake',
    "client_id" TEXT NOT NULL,
    "lead_attorney_id" TEXT,
    "support_paralegal_id" TEXT,
    "lead_id" TEXT,
    "court_date" TIMESTAMP(3),
    "filing_date" TIMESTAMP(3),
    "closing_date" TIMESTAMP(3),
    "estimated_value" DOUBLE PRECISION,
    "ai_analysis" TEXT,
    "is_high_risk" BOOLEAN NOT NULL DEFAULT false,
    "next_action" TEXT,
    "next_action_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "case_type" "CaseType",
    "description" TEXT,
    "assigned_paralegal_id" TEXT,
    "assigned_officer_id" TEXT,
    "lead_score" INTEGER,
    "qualification_notes" TEXT,
    "estimated_value" DOUBLE PRECISION,
    "first_contact_date" TIMESTAMP(3),
    "sla_deadline" TIMESTAMP(3),
    "converted_case_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "workflow_status" "WorkflowStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "prepared_by" TEXT,
    "approved_by" TEXT,
    "signed_by" TEXT,
    "supervising_officer" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_by" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeSubmission" (
    "id" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "id_number" TEXT,
    "case_type" "CaseType" NOT NULL,
    "description" TEXT NOT NULL,
    "opposing_party" TEXT,
    "urgency" "CaseUrgency",
    "has_documents" BOOLEAN NOT NULL DEFAULT false,
    "consent_given" BOOLEAN NOT NULL,
    "popia_consent" BOOLEAN NOT NULL,
    "ai_analysis" TEXT,
    "converted_case_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "case_id" TEXT,
    "assigned_to" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "message_type" "MessageType" NOT NULL DEFAULT 'message',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "consent_type" "ConsentType" NOT NULL,
    "purpose" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "related_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "attorney_id" TEXT NOT NULL,
    "case_id" TEXT,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_time" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "meeting_type" "MeetingType" NOT NULL DEFAULT 'in_person',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price_monthly" DOUBLE PRECISION NOT NULL,
    "price_annual" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "features" TEXT NOT NULL,
    "max_cases" INTEGER,
    "max_documents" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseTimeline" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "previous_value" TEXT,
    "new_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivilegedNote" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" "PrivilegedNoteVisibility" NOT NULL DEFAULT 'officer_only',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivilegedNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiAnalytic" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_time_ms" INTEGER,
    "user_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiAnalytic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "error_type" "ErrorType" NOT NULL,
    "message" TEXT NOT NULL,
    "stack_trace" TEXT,
    "url" TEXT,
    "user_id" TEXT,
    "metadata" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attorney" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lpc_number" TEXT,
    "firm_name" TEXT,
    "specializations" TEXT,
    "years_experience" INTEGER,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "hourly_rate" DOUBLE PRECISION,
    "bio" TEXT,
    "availability_status" "AttorneyAvailability" NOT NULL DEFAULT 'available',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attorney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitLog" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 1,
    "window_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "backup_type" TEXT NOT NULL DEFAULT 'scheduled',
    "status" "BackupStatus" NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_department_idx" ON "User"("department");

-- CreateIndex
CREATE INDEX "User_is_active_idx" ON "User"("is_active");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_user_id_key" ON "Profile"("user_id");

-- CreateIndex
CREATE INDEX "Profile_role_idx" ON "Profile"("role");

-- CreateIndex
CREATE INDEX "Profile_department_idx" ON "Profile"("department");

-- CreateIndex
CREATE INDEX "Profile_user_id_idx" ON "Profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Case_matter_number_key" ON "Case"("matter_number");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_case_type_idx" ON "Case"("case_type");

-- CreateIndex
CREATE INDEX "Case_client_id_idx" ON "Case"("client_id");

-- CreateIndex
CREATE INDEX "Case_lead_attorney_id_idx" ON "Case"("lead_attorney_id");

-- CreateIndex
CREATE INDEX "Case_urgency_idx" ON "Case"("urgency");

-- CreateIndex
CREATE INDEX "Case_created_at_idx" ON "Case"("created_at");

-- CreateIndex
CREATE INDEX "Case_court_date_idx" ON "Case"("court_date");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_assigned_paralegal_id_idx" ON "Lead"("assigned_paralegal_id");

-- CreateIndex
CREATE INDEX "Lead_sla_deadline_idx" ON "Lead"("sla_deadline");

-- CreateIndex
CREATE INDEX "Lead_created_at_idx" ON "Lead"("created_at");

-- CreateIndex
CREATE INDEX "Document_case_id_idx" ON "Document"("case_id");

-- CreateIndex
CREATE INDEX "Document_document_type_idx" ON "Document"("document_type");

-- CreateIndex
CREATE INDEX "Document_workflow_status_idx" ON "Document"("workflow_status");

-- CreateIndex
CREATE INDEX "Document_prepared_by_idx" ON "Document"("prepared_by");

-- CreateIndex
CREATE INDEX "Document_created_at_idx" ON "Document"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeSubmission_reference_id_key" ON "IntakeSubmission"("reference_id");

-- CreateIndex
CREATE INDEX "IntakeSubmission_email_idx" ON "IntakeSubmission"("email");

-- CreateIndex
CREATE INDEX "IntakeSubmission_status_idx" ON "IntakeSubmission"("status");

-- CreateIndex
CREATE INDEX "IntakeSubmission_case_type_idx" ON "IntakeSubmission"("case_type");

-- CreateIndex
CREATE INDEX "IntakeSubmission_reference_id_idx" ON "IntakeSubmission"("reference_id");

-- CreateIndex
CREATE INDEX "IntakeSubmission_created_at_idx" ON "IntakeSubmission"("created_at");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_assigned_to_idx" ON "Task"("assigned_to");

-- CreateIndex
CREATE INDEX "Task_case_id_idx" ON "Task"("case_id");

-- CreateIndex
CREATE INDEX "Task_due_date_idx" ON "Task"("due_date");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_created_at_idx" ON "Task"("created_at");

-- CreateIndex
CREATE INDEX "Message_case_id_idx" ON "Message"("case_id");

-- CreateIndex
CREATE INDEX "Message_sender_id_idx" ON "Message"("sender_id");

-- CreateIndex
CREATE INDEX "Message_recipient_id_idx" ON "Message"("recipient_id");

-- CreateIndex
CREATE INDEX "Message_is_read_idx" ON "Message"("is_read");

-- CreateIndex
CREATE INDEX "Message_created_at_idx" ON "Message"("created_at");

-- CreateIndex
CREATE INDEX "AuditLog_user_id_idx" ON "AuditLog"("user_id");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_type_resource_id_idx" ON "AuditLog"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- CreateIndex
CREATE INDEX "ConsentLog_user_id_idx" ON "ConsentLog"("user_id");

-- CreateIndex
CREATE INDEX "ConsentLog_consent_type_idx" ON "ConsentLog"("consent_type");

-- CreateIndex
CREATE INDEX "ConsentLog_created_at_idx" ON "ConsentLog"("created_at");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_is_read_idx" ON "Notification"("is_read");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE INDEX "Consultation_client_id_idx" ON "Consultation"("client_id");

-- CreateIndex
CREATE INDEX "Consultation_attorney_id_idx" ON "Consultation"("attorney_id");

-- CreateIndex
CREATE INDEX "Consultation_scheduled_date_idx" ON "Consultation"("scheduled_date");

-- CreateIndex
CREATE INDEX "Consultation_status_idx" ON "Consultation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PricingPlan_slug_key" ON "PricingPlan"("slug");

-- CreateIndex
CREATE INDEX "PricingPlan_slug_idx" ON "PricingPlan"("slug");

-- CreateIndex
CREATE INDEX "PricingPlan_is_active_idx" ON "PricingPlan"("is_active");

-- CreateIndex
CREATE INDEX "UserSubscription_user_id_idx" ON "UserSubscription"("user_id");

-- CreateIndex
CREATE INDEX "UserSubscription_status_idx" ON "UserSubscription"("status");

-- CreateIndex
CREATE INDEX "CaseTimeline_case_id_idx" ON "CaseTimeline"("case_id");

-- CreateIndex
CREATE INDEX "CaseTimeline_created_at_idx" ON "CaseTimeline"("created_at");

-- CreateIndex
CREATE INDEX "PrivilegedNote_case_id_idx" ON "PrivilegedNote"("case_id");

-- CreateIndex
CREATE INDEX "PrivilegedNote_author_id_idx" ON "PrivilegedNote"("author_id");

-- CreateIndex
CREATE INDEX "PrivilegedNote_visibility_idx" ON "PrivilegedNote"("visibility");

-- CreateIndex
CREATE INDEX "ApiAnalytic_endpoint_idx" ON "ApiAnalytic"("endpoint");

-- CreateIndex
CREATE INDEX "ApiAnalytic_status_code_idx" ON "ApiAnalytic"("status_code");

-- CreateIndex
CREATE INDEX "ApiAnalytic_created_at_idx" ON "ApiAnalytic"("created_at");

-- CreateIndex
CREATE INDEX "ApiAnalytic_user_id_idx" ON "ApiAnalytic"("user_id");

-- CreateIndex
CREATE INDEX "ErrorLog_error_type_idx" ON "ErrorLog"("error_type");

-- CreateIndex
CREATE INDEX "ErrorLog_resolved_idx" ON "ErrorLog"("resolved");

-- CreateIndex
CREATE INDEX "ErrorLog_created_at_idx" ON "ErrorLog"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Attorney_user_id_key" ON "Attorney"("user_id");

-- CreateIndex
CREATE INDEX "Attorney_lpc_number_idx" ON "Attorney"("lpc_number");

-- CreateIndex
CREATE INDEX "Attorney_is_verified_idx" ON "Attorney"("is_verified");

-- CreateIndex
CREATE INDEX "Attorney_availability_status_idx" ON "Attorney"("availability_status");

-- CreateIndex
CREATE INDEX "RateLimitLog_ip_idx" ON "RateLimitLog"("ip");

-- CreateIndex
CREATE INDEX "RateLimitLog_endpoint_idx" ON "RateLimitLog"("endpoint");

-- CreateIndex
CREATE INDEX "RateLimitLog_window_start_idx" ON "RateLimitLog"("window_start");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitLog_ip_endpoint_key" ON "RateLimitLog"("ip", "endpoint");

-- CreateIndex
CREATE INDEX "BackupRecord_status_idx" ON "BackupRecord"("status");

-- CreateIndex
CREATE INDEX "BackupRecord_backup_type_idx" ON "BackupRecord"("backup_type");

-- CreateIndex
CREATE INDEX "BackupRecord_started_at_idx" ON "BackupRecord"("started_at");

-- CreateIndex
CREATE INDEX "LeadAssignment_user_id_idx" ON "LeadAssignment"("user_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_lead_attorney_id_fkey" FOREIGN KEY ("lead_attorney_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_support_paralegal_id_fkey" FOREIGN KEY ("support_paralegal_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assigned_paralegal_id_fkey" FOREIGN KEY ("assigned_paralegal_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assigned_officer_id_fkey" FOREIGN KEY ("assigned_officer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_signed_by_fkey" FOREIGN KEY ("signed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_supervising_officer_fkey" FOREIGN KEY ("supervising_officer") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_attorney_id_fkey" FOREIGN KEY ("attorney_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "PricingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTimeline" ADD CONSTRAINT "CaseTimeline_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivilegedNote" ADD CONSTRAINT "PrivilegedNote_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivilegedNote" ADD CONSTRAINT "PrivilegedNote_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiAnalytic" ADD CONSTRAINT "ApiAnalytic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attorney" ADD CONSTRAINT "Attorney_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

