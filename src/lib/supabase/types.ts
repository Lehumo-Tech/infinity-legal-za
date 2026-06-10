/**
 * Supabase Database Types
 * Auto-generated style types for the Infinity Legal database
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          phone: string | null
          role: UserRole
          department: string | null
          bar_number: string | null
          hire_date: string | null
          is_active: boolean
          avatar: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          department?: string | null
          bar_number?: string | null
          hire_date?: string | null
          is_active?: boolean
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          department?: string | null
          bar_number?: string | null
          hire_date?: string | null
          is_active?: boolean
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cases: {
        Row: {
          id: string
          matter_number: string
          title: string
          description: string | null
          case_type: CaseType
          urgency: CaseUrgency
          status: CaseStatus
          client_id: string
          lead_attorney_id: string | null
          support_paralegal_id: string | null
          lead_id: string | null
          court_date: string | null
          filing_date: string | null
          closing_date: string | null
          estimated_value: number | null
          ai_analysis: string | null
          is_high_risk: boolean
          next_action: string | null
          next_action_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          matter_number: string
          title: string
          description?: string | null
          case_type: CaseType
          urgency: CaseUrgency
          status?: CaseStatus
          client_id: string
          lead_attorney_id?: string | null
          support_paralegal_id?: string | null
          lead_id?: string | null
          court_date?: string | null
          filing_date?: string | null
          closing_date?: string | null
          estimated_value?: number | null
          ai_analysis?: string | null
          is_high_risk?: boolean
          next_action?: string | null
          next_action_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          matter_number?: string
          title?: string
          description?: string | null
          case_type?: CaseType
          urgency?: CaseUrgency
          status?: CaseStatus
          client_id?: string
          lead_attorney_id?: string | null
          support_paralegal_id?: string | null
          lead_id?: string | null
          court_date?: string | null
          filing_date?: string | null
          closing_date?: string | null
          estimated_value?: number | null
          ai_analysis?: string | null
          is_high_risk?: boolean
          next_action?: string | null
          next_action_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          source: LeadSource
          status: LeadStatus
          case_type: CaseType | null
          description: string | null
          assigned_paralegal_id: string | null
          assigned_officer_id: string | null
          lead_score: number | null
          qualification_notes: string | null
          estimated_value: number | null
          first_contact_date: string | null
          sla_deadline: string | null
          converted_case_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          source: LeadSource
          status?: LeadStatus
          case_type?: CaseType | null
          description?: string | null
          assigned_paralegal_id?: string | null
          assigned_officer_id?: string | null
          lead_score?: number | null
          qualification_notes?: string | null
          estimated_value?: number | null
          first_contact_date?: string | null
          sla_deadline?: string | null
          converted_case_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          source?: LeadSource
          status?: LeadStatus
          case_type?: CaseType | null
          description?: string | null
          assigned_paralegal_id?: string | null
          assigned_officer_id?: string | null
          lead_score?: number | null
          qualification_notes?: string | null
          estimated_value?: number | null
          first_contact_date?: string | null
          sla_deadline?: string | null
          converted_case_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          case_id: string
          document_type: DocumentType
          workflow_status: WorkflowStatus
          version: number
          file_url: string | null
          file_name: string | null
          file_size: number | null
          prepared_by: string | null
          approved_by: string | null
          signed_by: string | null
          supervising_officer: string | null
          is_locked: boolean
          locked_by: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          case_id: string
          document_type: DocumentType
          workflow_status?: WorkflowStatus
          version?: number
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          prepared_by?: string | null
          approved_by?: string | null
          signed_by?: string | null
          supervising_officer?: string | null
          is_locked?: boolean
          locked_by?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          case_id?: string
          document_type?: DocumentType
          workflow_status?: WorkflowStatus
          version?: number
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          prepared_by?: string | null
          approved_by?: string | null
          signed_by?: string | null
          supervising_officer?: string | null
          is_locked?: boolean
          locked_by?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      intake_submissions: {
        Row: {
          id: string
          reference_id: string
          full_name: string
          email: string
          phone: string | null
          id_number: string | null
          case_type: CaseType
          description: string
          opposing_party: string | null
          urgency: CaseUrgency | null
          has_documents: boolean
          consent_given: boolean
          popia_consent: boolean
          ai_analysis: string | null
          converted_case_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference_id: string
          full_name: string
          email: string
          phone?: string | null
          id_number?: string | null
          case_type: CaseType
          description: string
          opposing_party?: string | null
          urgency?: CaseUrgency | null
          has_documents?: boolean
          consent_given: boolean
          popia_consent: boolean
          ai_analysis?: string | null
          converted_case_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference_id?: string
          full_name?: string
          email?: string
          phone?: string | null
          id_number?: string | null
          case_type?: CaseType
          description?: string
          opposing_party?: string | null
          urgency?: CaseUrgency | null
          has_documents?: boolean
          consent_given?: boolean
          popia_consent?: boolean
          ai_analysis?: string | null
          converted_case_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          case_id: string | null
          assigned_to: string
          created_by: string
          priority: TaskPriority
          status: TaskStatus
          due_date: string | null
          completed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          case_id?: string | null
          assigned_to: string
          created_by: string
          priority: TaskPriority
          status?: TaskStatus
          due_date?: string | null
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          case_id?: string | null
          assigned_to?: string
          created_by?: string
          priority?: TaskPriority
          status?: TaskStatus
          due_date?: string | null
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          case_id: string
          sender_id: string
          recipient_id: string | null
          content: string
          is_read: boolean
          message_type: MessageType
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          sender_id: string
          recipient_id?: string | null
          content: string
          is_read?: boolean
          message_type?: MessageType
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          sender_id?: string
          recipient_id?: string | null
          content?: string
          is_read?: boolean
          message_type?: MessageType
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          details: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          details?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      consent_logs: {
        Row: {
          id: string
          user_id: string | null
          consent_type: ConsentType
          purpose: string
          granted: boolean
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          consent_type: ConsentType
          purpose: string
          granted: boolean
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          consent_type?: ConsentType
          purpose?: string
          granted?: boolean
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          is_read: boolean
          link: string | null
          related_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          is_read?: boolean
          link?: string | null
          related_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          message?: string
          is_read?: boolean
          link?: string | null
          related_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      consultations: {
        Row: {
          id: string
          client_id: string
          attorney_id: string
          case_id: string | null
          scheduled_date: string
          scheduled_time: string
          duration_minutes: number
          status: ConsultationStatus
          notes: string | null
          meeting_type: MeetingType
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          attorney_id: string
          case_id?: string | null
          scheduled_date: string
          scheduled_time: string
          duration_minutes?: number
          status?: ConsultationStatus
          notes?: string | null
          meeting_type?: MeetingType
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          attorney_id?: string
          case_id?: string | null
          scheduled_date?: string
          scheduled_time?: string
          duration_minutes?: number
          status?: ConsultationStatus
          notes?: string | null
          meeting_type?: MeetingType
          created_at?: string
          updated_at?: string
        }
      }
      pricing_plans: {
        Row: {
          id: string
          name: string
          slug: string
          price_monthly: number
          price_annual: number | null
          currency: string
          features: string
          max_cases: number | null
          max_documents: number | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          price_monthly: number
          price_annual?: number | null
          currency?: string
          features: string
          max_cases?: number | null
          max_documents?: number | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          price_monthly?: number
          price_annual?: number | null
          currency?: string
          features?: string
          max_cases?: number | null
          max_documents?: number | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: SubscriptionStatus
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: SubscriptionStatus
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: SubscriptionStatus
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payment_records: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          m_payment_id: string
          pf_payment_id: string | null
          amount_gross: number
          amount_fee: number | null
          amount_net: number | null
          payment_status: string
          item_name: string
          billing_cycle: string
          payfast_data: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          m_payment_id: string
          pf_payment_id?: string | null
          amount_gross: number
          amount_fee?: number | null
          amount_net?: number | null
          payment_status?: string
          item_name: string
          billing_cycle: string
          payfast_data?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          m_payment_id?: string
          pf_payment_id?: string | null
          amount_gross?: number
          amount_fee?: number | null
          amount_net?: number | null
          payment_status?: string
          item_name?: string
          billing_cycle?: string
          payfast_data?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      case_timeline: {
        Row: {
          id: string
          case_id: string
          user_id: string | null
          action: string
          description: string | null
          previous_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          user_id?: string | null
          action: string
          description?: string | null
          previous_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          user_id?: string | null
          action?: string
          description?: string | null
          previous_value?: string | null
          new_value?: string | null
          created_at?: string
        }
      }
      privileged_notes: {
        Row: {
          id: string
          case_id: string
          author_id: string
          content: string
          visibility: PrivilegedNoteVisibility
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          author_id: string
          content: string
          visibility?: PrivilegedNoteVisibility
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          author_id?: string
          content?: string
          visibility?: PrivilegedNoteVisibility
          created_at?: string
          updated_at?: string
        }
      }
      api_analytics: {
        Row: {
          id: string
          endpoint: string
          method: string
          status_code: number
          response_time_ms: number | null
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          endpoint: string
          method: string
          status_code: number
          response_time_ms?: number | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          endpoint?: string
          method?: string
          status_code?: number
          response_time_ms?: number | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      error_logs: {
        Row: {
          id: string
          error_type: ErrorType
          message: string
          stack_trace: string | null
          url: string | null
          user_id: string | null
          metadata: string | null
          resolved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          error_type: ErrorType
          message: string
          stack_trace?: string | null
          url?: string | null
          user_id?: string | null
          metadata?: string | null
          resolved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          error_type?: ErrorType
          message?: string
          stack_trace?: string | null
          url?: string | null
          user_id?: string | null
          metadata?: string | null
          resolved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      attorneys: {
        Row: {
          id: string
          user_id: string
          lpc_number: string | null
          firm_name: string | null
          specializations: string | null
          years_experience: number | null
          is_verified: boolean
          hourly_rate: number | null
          bio: string | null
          availability_status: AttorneyAvailability
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lpc_number?: string | null
          firm_name?: string | null
          specializations?: string | null
          years_experience?: number | null
          is_verified?: boolean
          hourly_rate?: number | null
          bio?: string | null
          availability_status?: AttorneyAvailability
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lpc_number?: string | null
          firm_name?: string | null
          specializations?: string | null
          years_experience?: number | null
          is_verified?: boolean
          hourly_rate?: number | null
          bio?: string | null
          availability_status?: AttorneyAvailability
          created_at?: string
          updated_at?: string
        }
      }
      rate_limit_logs: {
        Row: {
          id: string
          ip: string
          endpoint: string
          request_count: number
          window_start: string
          created_at: string
        }
        Insert: {
          id?: string
          ip: string
          endpoint: string
          request_count?: number
          window_start?: string
          created_at?: string
        }
        Update: {
          id?: string
          ip?: string
          endpoint?: string
          request_count?: number
          window_start?: string
          created_at?: string
        }
      }
      backup_records: {
        Row: {
          id: string
          filename: string
          size_bytes: number | null
          backup_type: string
          status: BackupStatus
          started_at: string
          completed_at: string | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          filename: string
          size_bytes?: number | null
          backup_type?: string
          status?: BackupStatus
          started_at?: string
          completed_at?: string | null
          error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          filename?: string
          size_bytes?: number | null
          backup_type?: string
          status?: BackupStatus
          started_at?: string
          completed_at?: string | null
          error?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      case_type: CaseType
      case_urgency: CaseUrgency
      case_status: CaseStatus
      lead_source: LeadSource
      lead_status: LeadStatus
      document_type: DocumentType
      workflow_status: WorkflowStatus
      task_priority: TaskPriority
      task_status: TaskStatus
      message_type: MessageType
      consent_type: ConsentType
      notification_type: NotificationType
      consultation_status: ConsultationStatus
      meeting_type: MeetingType
      subscription_status: SubscriptionStatus
      attorney_availability: AttorneyAvailability
      privileged_note_visibility: PrivilegedNoteVisibility
      error_type: ErrorType
      backup_status: BackupStatus
    }
  }
}

// Enum types
export type UserRole =
  | 'managing_director'
  | 'senior_partner'
  | 'associate'
  | 'paralegal'
  | 'legal_officer'
  | 'supervising_officer'
  | 'senior_consultant'
  | 'consultant'
  | 'candidate_attorney'
  | 'hr_manager'
  | 'finance_manager'
  | 'office_administrator'
  | 'systems_admin'
  | 'receptionist'
  | 'client'
  | 'guest'

export type CaseType =
  | 'family_law'
  | 'criminal_defence'
  | 'civil_litigation'
  | 'conveyancing'
  | 'estate_planning'
  | 'corporate_commercial'
  | 'debt_collection'
  | 'immigration'
  | 'labour_law'
  | 'personal_injury'
  | 'other'

export type CaseUrgency = 'low' | 'medium' | 'high' | 'critical'
export type CaseStatus = 'intake' | 'pending_review' | 'active' | 'on_hold' | 'settled' | 'closed' | 'archived'
export type LeadSource = 'website' | 'referral' | 'walk_in' | 'social_media' | 'advertisement' | 'cold_call' | 'other'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'consultation_scheduled' | 'retained' | 'lost' | 'disqualified'
export type DocumentType = 'contract' | 'pleading' | 'correspondence' | 'court_filing' | 'affidavit' | 'opinion' | 'memo' | 'invoice' | 'consent_form' | 'id_document' | 'other'
export type WorkflowStatus = 'draft' | 'review' | 'approved' | 'signed' | 'filed' | 'archived'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
export type MessageType = 'message' | 'note' | 'system' | 'alert'
export type ConsentType = 'data_processing' | 'marketing' | 'third_party_sharing' | 'automated_decision' | 'popia_general'
export type NotificationType = 'case_update' | 'task_assigned' | 'document_review' | 'message' | 'system' | 'deadline' | 'lead_assigned' | 'consultation'
export type ConsultationStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type MeetingType = 'in_person' | 'video_call' | 'phone_call'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'trialing'
export type AttorneyAvailability = 'available' | 'busy' | 'on_leave' | 'unavailable'
export type PrivilegedNoteVisibility = 'officer_only' | 'managing_partner_only' | 'attorney_client'
export type ErrorType = 'runtime' | 'api' | 'database' | 'auth' | 'validation' | 'network' | 'unknown'
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed'
