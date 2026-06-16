/**
 * Supabase Database Types
 * Generated from 000_complete_schema.sql
 * Uses TEXT + CHECK constraints (no PostgreSQL enums)
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
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: UserRole
          id_number: string | null
          company: string | null
          address: Json | null
          preferences: Json | null
          popi_consent: boolean | null
          email_verified: boolean | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          id_number?: string | null
          company?: string | null
          address?: Json | null
          preferences?: Json | null
          popi_consent?: boolean | null
          email_verified?: boolean | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          id_number?: string | null
          company?: string | null
          address?: Json | null
          preferences?: Json | null
          popi_consent?: boolean | null
          email_verified?: boolean | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attorneys: {
        Row: {
          id: string
          practice_number: string | null
          specialization: string[] | null
          bar_admission_date: string | null
          hourly_rate: number | null
          bio: string | null
          available: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          practice_number?: string | null
          specialization?: string[] | null
          bar_admission_date?: string | null
          hourly_rate?: number | null
          bio?: string | null
          available?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          practice_number?: string | null
          specialization?: string[] | null
          bar_admission_date?: string | null
          hourly_rate?: number | null
          bio?: string | null
          available?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      cases: {
        Row: {
          id: string
          case_ref: string | null
          title: string
          description: string | null
          case_type: CaseType
          status: CaseStatus
          client_id: string
          attorney_id: string | null
          opposing_party: string | null
          court_name: string | null
          case_number: string | null
          jurisdiction: string | null
          estimated_value: number | null
          retainer_amount: number | null
          contingency_fee: number | null
          next_deadline: string | null
          notes: string | null
          tags: string[] | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_ref?: string | null
          title: string
          description?: string | null
          case_type?: CaseType
          status?: CaseStatus
          client_id: string
          attorney_id?: string | null
          opposing_party?: string | null
          court_name?: string | null
          case_number?: string | null
          jurisdiction?: string | null
          estimated_value?: number | null
          retainer_amount?: number | null
          contingency_fee?: number | null
          next_deadline?: string | null
          notes?: string | null
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_ref?: string | null
          title?: string
          description?: string | null
          case_type?: CaseType
          status?: CaseStatus
          client_id?: string
          attorney_id?: string | null
          opposing_party?: string | null
          court_name?: string | null
          case_number?: string | null
          jurisdiction?: string | null
          estimated_value?: number | null
          retainer_amount?: number | null
          contingency_fee?: number | null
          next_deadline?: string | null
          notes?: string | null
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          company: string | null
          source: LeadSource
          status: LeadStatus
          case_type: CaseType | null
          description: string | null
          estimated_value: number | null
          lead_score: number | null
          assigned_to: string | null
          converted_client_id: string | null
          converted_case_id: string | null
          notes: string | null
          tags: string[] | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          last_contacted_at: string | null
          next_follow_up: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          company?: string | null
          source?: LeadSource
          status?: LeadStatus
          case_type?: CaseType | null
          description?: string | null
          estimated_value?: number | null
          lead_score?: number | null
          assigned_to?: string | null
          converted_client_id?: string | null
          converted_case_id?: string | null
          notes?: string | null
          tags?: string[] | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          last_contacted_at?: string | null
          next_follow_up?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          company?: string | null
          source?: LeadSource
          status?: LeadStatus
          case_type?: CaseType | null
          description?: string | null
          estimated_value?: number | null
          lead_score?: number | null
          assigned_to?: string | null
          converted_client_id?: string | null
          converted_case_id?: string | null
          notes?: string | null
          tags?: string[] | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          last_contacted_at?: string | null
          next_follow_up?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      intake_submissions: {
        Row: {
          id: string
          client_id: string | null
          case_id: string | null
          lead_id: string | null
          status: IntakeStatus
          case_type: CaseType
          case_description: string
          opposing_party: string | null
          estimated_value: number | null
          urgency: string | null
          timeline: string | null
          desired_outcome: string | null
          previous_legal_help: string | null
          documents_ready: boolean | null
          personal_info: Json | null
          case_details: Json | null
          financial_info: Json | null
          ai_extracted_data: Json | null
          ai_confidence: number | null
          review_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          case_id?: string | null
          lead_id?: string | null
          status?: IntakeStatus
          case_type: CaseType
          case_description: string
          opposing_party?: string | null
          estimated_value?: number | null
          urgency?: string | null
          timeline?: string | null
          desired_outcome?: string | null
          previous_legal_help?: string | null
          documents_ready?: boolean | null
          personal_info?: Json | null
          case_details?: Json | null
          financial_info?: Json | null
          ai_extracted_data?: Json | null
          ai_confidence?: number | null
          review_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          case_id?: string | null
          lead_id?: string | null
          status?: IntakeStatus
          case_type?: CaseType
          case_description?: string
          opposing_party?: string | null
          estimated_value?: number | null
          urgency?: string | null
          timeline?: string | null
          desired_outcome?: string | null
          previous_legal_help?: string | null
          documents_ready?: boolean | null
          personal_info?: Json | null
          case_details?: Json | null
          financial_info?: Json | null
          ai_extracted_data?: Json | null
          ai_confidence?: number | null
          review_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_intake_sessions: {
        Row: {
          id: string
          client_id: string | null
          intake_submission_id: string | null
          session_token: string | null
          status: IntakeStatus
          conversation_history: Json | null
          extracted_entities: Json | null
          current_step: string | null
          steps_completed: string[] | null
          steps_remaining: string[] | null
          ai_model_used: string | null
          total_tokens: number | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          intake_submission_id?: string | null
          session_token?: string | null
          status?: IntakeStatus
          conversation_history?: Json | null
          extracted_entities?: Json | null
          current_step?: string | null
          steps_completed?: string[] | null
          steps_remaining?: string[] | null
          ai_model_used?: string | null
          total_tokens?: number | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          intake_submission_id?: string | null
          session_token?: string | null
          status?: IntakeStatus
          conversation_history?: Json | null
          extracted_entities?: Json | null
          current_step?: string | null
          steps_completed?: string[] | null
          steps_remaining?: string[] | null
          ai_model_used?: string | null
          total_tokens?: number | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_analyses: {
        Row: {
          id: string
          case_id: string | null
          intake_id: string | null
          analysis_type: AnalysisType
          status: AnalysisStatus
          input_data: Json | null
          result: Json | null
          summary: string | null
          recommendations: Json | null
          risk_flags: Json | null
          confidence_score: number | null
          ai_model_used: string | null
          tokens_used: number | null
          processing_time_ms: number | null
          error_message: string | null
          requested_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          intake_id?: string | null
          analysis_type: AnalysisType
          status?: AnalysisStatus
          input_data?: Json | null
          result?: Json | null
          summary?: string | null
          recommendations?: Json | null
          risk_flags?: Json | null
          confidence_score?: number | null
          ai_model_used?: string | null
          tokens_used?: number | null
          processing_time_ms?: number | null
          error_message?: string | null
          requested_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string | null
          intake_id?: string | null
          analysis_type?: AnalysisType
          status?: AnalysisStatus
          input_data?: Json | null
          result?: Json | null
          summary?: string | null
          recommendations?: Json | null
          risk_flags?: Json | null
          confidence_score?: number | null
          ai_model_used?: string | null
          tokens_used?: number | null
          processing_time_ms?: number | null
          error_message?: string | null
          requested_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_analysis_queue: {
        Row: {
          id: string
          analysis_id: string | null
          priority: Priority
          retry_count: number | null
          max_retries: number | null
          scheduled_at: string
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id?: string | null
          priority?: Priority
          retry_count?: number | null
          max_retries?: number | null
          scheduled_at?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string | null
          priority?: Priority
          retry_count?: number | null
          max_retries?: number | null
          scheduled_at?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          case_id: string | null
          uploaded_by: string
          document_type: DocumentType
          status: DocumentStatus
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          description: string | null
          tags: string[] | null
          version: number | null
          parent_document_id: string | null
          ai_extracted_text: string | null
          ai_summary: string | null
          is_confidential: boolean | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          uploaded_by: string
          document_type?: DocumentType
          status?: DocumentStatus
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          tags?: string[] | null
          version?: number | null
          parent_document_id?: string | null
          ai_extracted_text?: string | null
          ai_summary?: string | null
          is_confidential?: boolean | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string | null
          uploaded_by?: string
          document_type?: DocumentType
          status?: DocumentStatus
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          tags?: string[] | null
          version?: number | null
          parent_document_id?: string | null
          ai_extracted_text?: string | null
          ai_summary?: string | null
          is_confidential?: boolean | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          case_id: string | null
          assigned_to: string
          created_by: string
          title: string
          description: string | null
          status: TaskStatus
          priority: Priority
          due_date: string | null
          completed_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          assigned_to: string
          created_by: string
          title: string
          description?: string | null
          status?: TaskStatus
          priority?: Priority
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string | null
          assigned_to?: string
          created_by?: string
          title?: string
          description?: string | null
          status?: TaskStatus
          priority?: Priority
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          case_id: string | null
          sender_id: string
          recipient_id: string | null
          message_type: MessageType
          subject: string | null
          content: string
          is_read: boolean | null
          parent_message_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          sender_id: string
          recipient_id?: string | null
          message_type?: MessageType
          subject?: string | null
          content: string
          is_read?: boolean | null
          parent_message_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string | null
          sender_id?: string
          recipient_id?: string | null
          message_type?: MessageType
          subject?: string | null
          content?: string
          is_read?: boolean | null
          parent_message_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      case_timeline: {
        Row: {
          id: string
          case_id: string
          event_type: string
          event_description: string
          performed_by: string | null
          metadata: Json | null
          is_system_event: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          event_type: string
          event_description: string
          performed_by?: string | null
          metadata?: Json | null
          is_system_event?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          event_type?: string
          event_description?: string
          performed_by?: string | null
          metadata?: Json | null
          is_system_event?: boolean | null
          created_at?: string
        }
      }
      privileged_notes: {
        Row: {
          id: string
          case_id: string
          author_id: string
          content: string
          is_privileged: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          author_id: string
          content: string
          is_privileged?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          author_id?: string
          content?: string
          is_privileged?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      consultations: {
        Row: {
          id: string
          case_id: string | null
          client_id: string
          attorney_id: string | null
          status: ConsultationStatus
          scheduled_at: string
          duration_minutes: number | null
          meeting_type: string | null
          meeting_link: string | null
          location: string | null
          notes: string | null
          follow_up_required: boolean | null
          fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          client_id: string
          attorney_id?: string | null
          status?: ConsultationStatus
          scheduled_at: string
          duration_minutes?: number | null
          meeting_type?: string | null
          meeting_link?: string | null
          location?: string | null
          notes?: string | null
          follow_up_required?: boolean | null
          fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string | null
          client_id?: string
          attorney_id?: string | null
          status?: ConsultationStatus
          scheduled_at?: string
          duration_minutes?: number | null
          meeting_type?: string | null
          meeting_link?: string | null
          location?: string | null
          notes?: string | null
          follow_up_required?: boolean | null
          fee?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      consent_logs: {
        Row: {
          id: string
          user_id: string
          consent_type: ConsentType
          granted: boolean
          ip_address: string | null
          user_agent: string | null
          version: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          consent_type: ConsentType
          granted: boolean
          ip_address?: string | null
          user_agent?: string | null
          version?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          consent_type?: ConsentType
          granted?: boolean
          ip_address?: string | null
          user_agent?: string | null
          version?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          link: string | null
          is_read: boolean | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          link?: string | null
          is_read?: boolean | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          link?: string | null
          is_read?: boolean | null
          metadata?: Json | null
          created_at?: string
        }
      }
      pricing_plans: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price_monthly: number
          price_annual: number | null
          currency: string | null
          features: Json | null
          is_popular: boolean | null
          is_active: boolean | null
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price_monthly?: number
          price_annual?: number | null
          currency?: string | null
          features?: Json | null
          is_popular?: boolean | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price_monthly?: number
          price_annual?: number | null
          currency?: string | null
          features?: Json | null
          is_popular?: boolean | null
          is_active?: boolean | null
          sort_order?: number | null
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
          current_period_start: string
          current_period_end: string | null
          cancel_at_period_end: boolean | null
          trial_ends_at: string | null
          payfast_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: SubscriptionStatus
          current_period_start?: string
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          trial_ends_at?: string | null
          payfast_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: SubscriptionStatus
          current_period_start?: string
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          trial_ends_at?: string | null
          payfast_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_records: {
        Row: {
          id: string
          subscription_id: string | null
          case_id: string | null
          user_id: string
          amount: number
          currency: string | null
          status: PaymentStatus
          payfast_payment_id: string | null
          payfast_token: string | null
          payment_method: string | null
          description: string | null
          metadata: Json | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subscription_id?: string | null
          case_id?: string | null
          user_id: string
          amount: number
          currency?: string | null
          status?: PaymentStatus
          payfast_payment_id?: string | null
          payfast_token?: string | null
          payment_method?: string | null
          description?: string | null
          metadata?: Json | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          subscription_id?: string | null
          case_id?: string | null
          user_id?: string
          amount?: number
          currency?: string | null
          status?: PaymentStatus
          payfast_payment_id?: string | null
          payfast_token?: string | null
          payment_method?: string | null
          description?: string | null
          metadata?: Json | null
          paid_at?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          details: Json | null
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
          details?: Json | null
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
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      api_analytics: {
        Row: {
          id: string
          endpoint: string
          method: string
          status_code: number | null
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
          status_code?: number | null
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
          status_code?: number | null
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
          error_type: string
          message: string
          stack_trace: string | null
          user_id: string | null
          request_path: string | null
          metadata: Json | null
          resolved: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          error_type: string
          message: string
          stack_trace?: string | null
          user_id?: string | null
          request_path?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          error_type?: string
          message?: string
          stack_trace?: string | null
          user_id?: string | null
          request_path?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          created_at?: string
        }
      }
      rate_limit_logs: {
        Row: {
          id: string
          identifier: string
          endpoint: string | null
          request_count: number | null
          blocked: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          identifier: string
          endpoint?: string | null
          request_count?: number | null
          blocked?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          identifier?: string
          endpoint?: string | null
          request_count?: number | null
          blocked?: boolean | null
          created_at?: string
        }
      }
      backup_records: {
        Row: {
          id: string
          backup_type: string
          status: string
          file_path: string | null
          file_size_bytes: number | null
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          backup_type?: string
          status?: string
          file_path?: string | null
          file_size_bytes?: number | null
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          backup_type?: string
          status?: string
          file_path?: string | null
          file_size_bytes?: number | null
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      workbench_configs: {
        Row: {
          id: string
          user_id: string
          layout: WorkbenchLayout
          widgets: Json | null
          sidebar_collapsed: boolean | null
          theme: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          layout?: WorkbenchLayout
          widgets?: Json | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          layout?: WorkbenchLayout
          widgets?: Json | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workbench_widgets: {
        Row: {
          id: string
          user_id: string
          widget_type: WidgetType
          title: string | null
          position_x: number
          position_y: number
          width: number
          height: number
          is_visible: boolean | null
          config: Json | null
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          widget_type: WidgetType
          title?: string | null
          position_x?: number
          position_y?: number
          width?: number
          height?: number
          is_visible?: boolean | null
          config?: Json | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          widget_type?: WidgetType
          title?: string | null
          position_x?: number
          position_y?: number
          width?: number
          height?: number
          is_visible?: boolean | null
          config?: Json | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      workbench_quick_actions: {
        Row: {
          id: string
          user_id: string
          action_type: string
          label: string
          icon: string | null
          target_url: string | null
          config: Json | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          label: string
          icon?: string | null
          target_url?: string | null
          config?: Json | null
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          label?: string
          icon?: string | null
          target_url?: string | null
          config?: Json | null
          sort_order?: number | null
          created_at?: string
        }
      }
      workbench_pinned_items: {
        Row: {
          id: string
          user_id: string
          item_type: string
          item_id: string
          label: string | null
          metadata: Json | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: string
          item_id: string
          label?: string | null
          metadata?: Json | null
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: string
          item_id?: string
          label?: string | null
          metadata?: Json | null
          sort_order?: number | null
          created_at?: string
        }
      }
      workbench_recent_activity: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          resource_type: string
          resource_id: string | null
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          resource_type: string
          resource_id?: string | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          resource_type?: string
          resource_id?: string | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      lead_pipeline_stages: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          sort_order: number
          color: string | null
          is_default: boolean | null
          auto_assign_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          sort_order?: number
          color?: string | null
          is_default?: boolean | null
          auto_assign_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          sort_order?: number
          color?: string | null
          is_default?: boolean | null
          auto_assign_to?: string | null
          created_at?: string
        }
      }
      lead_pipeline_transitions: {
        Row: {
          id: string
          lead_id: string
          from_stage: string | null
          to_stage: string
          changed_by: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          from_stage?: string | null
          to_stage: string
          changed_by?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          from_stage?: string | null
          to_stage?: string
          changed_by?: string | null
          reason?: string | null
          created_at?: string
        }
      }
      lead_communications: {
        Row: {
          id: string
          lead_id: string
          type: string
          direction: string | null
          subject: string | null
          content: string
          contacted_by: string | null
          follow_up_date: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          type?: string
          direction?: string | null
          subject?: string | null
          content: string
          contacted_by?: string | null
          follow_up_date?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          type?: string
          direction?: string | null
          subject?: string | null
          content?: string
          contacted_by?: string | null
          follow_up_date?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      lead_automation_rules: {
        Row: {
          id: string
          name: string
          description: string | null
          trigger_event: string
          conditions: Json | null
          actions: Json | null
          is_active: boolean | null
          created_by: string | null
          last_triggered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          trigger_event: string
          conditions?: Json | null
          actions?: Json | null
          is_active?: boolean | null
          created_by?: string | null
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          trigger_event?: string
          conditions?: Json | null
          actions?: Json | null
          is_active?: boolean | null
          created_by?: string | null
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lead_form_submissions: {
        Row: {
          id: string
          form_slug: string
          lead_id: string | null
          form_data: Json
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          ip_address: string | null
          user_agent: string | null
          is_processed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          form_slug: string
          lead_id?: string | null
          form_data?: Json
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          ip_address?: string | null
          user_agent?: string | null
          is_processed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          form_slug?: string
          lead_id?: string | null
          form_data?: Json
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          ip_address?: string | null
          user_agent?: string | null
          is_processed?: boolean | null
          created_at?: string
        }
      }
      admin_sessions: {
        Row: {
          id: string
          user_id: string
          token: string
          ip_address: string | null
          user_agent: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          ip_address?: string | null
          user_agent?: string | null
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          ip_address?: string | null
          user_agent?: string | null
          expires_at?: string
          created_at?: string
        }
      }
      admin_activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Json | null
          ip_address: string | null
          severity: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          severity?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          severity?: string | null
          created_at?: string
        }
      }
      crm_dashboard_widgets: {
        Row: {
          id: string
          widget_key: string
          title: string
          description: string | null
          widget_type: string
          config: Json | null
          data_source: string | null
          is_active: boolean | null
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          widget_key: string
          title: string
          description?: string | null
          widget_type?: string
          config?: Json | null
          data_source?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          widget_key?: string
          title?: string
          description?: string | null
          widget_type?: string
          config?: Json | null
          data_source?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      crm_reports: {
        Row: {
          id: string
          title: string
          report_type: ReportType
          description: string | null
          parameters: Json | null
          result_data: Json | null
          generated_by: string | null
          is_scheduled: boolean | null
          schedule_cron: string | null
          format: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          report_type: ReportType
          description?: string | null
          parameters?: Json | null
          result_data?: Json | null
          generated_by?: string | null
          is_scheduled?: boolean | null
          schedule_cron?: string | null
          format?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          report_type?: ReportType
          description?: string | null
          parameters?: Json | null
          result_data?: Json | null
          generated_by?: string | null
          is_scheduled?: boolean | null
          schedule_cron?: string | null
          format?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      crm_notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          priority: Priority | null
          link: string | null
          is_read: boolean | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          priority?: Priority | null
          link?: string | null
          is_read?: boolean | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          priority?: Priority | null
          link?: string | null
          is_read?: boolean | null
          metadata?: Json | null
          created_at?: string
        }
      }
      crm_system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          description: string | null
          is_public: boolean | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          description?: string | null
          is_public?: boolean | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          description?: string | null
          is_public?: boolean | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      crm_contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          subject: string | null
          message: string
          status: ContactMessageStatus
          assigned_to: string | null
          replied_at: string | null
          reply_content: string | null
          lead_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          subject?: string | null
          message: string
          status?: ContactMessageStatus
          assigned_to?: string | null
          replied_at?: string | null
          reply_content?: string | null
          lead_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          subject?: string | null
          message?: string
          status?: ContactMessageStatus
          assigned_to?: string | null
          replied_at?: string | null
          reply_content?: string | null
          lead_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      crm_user_notes: {
        Row: {
          id: string
          user_id: string
          author_id: string
          content: string
          is_pinned: boolean | null
          is_internal: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          author_id: string
          content: string
          is_pinned?: boolean | null
          is_internal?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          author_id?: string
          content?: string
          is_pinned?: boolean | null
          is_internal?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      crm_subscription_events: {
        Row: {
          id: string
          subscription_id: string | null
          user_id: string
          event_type: string
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          subscription_id?: string | null
          user_id: string
          event_type: string
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          subscription_id?: string | null
          user_id?: string
          event_type?: string
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

// ---------------------------------------------------------------------------
// String union type aliases for CHECK-constrained TEXT columns
// ---------------------------------------------------------------------------

export type UserRole =
  | 'client'
  | 'attorney'
  | 'paralegal'
  | 'admin'
  | 'managing_director'
  | 'systems_admin'

export type CaseType =
  | 'civil'
  | 'criminal'
  | 'family'
  | 'corporate'
  | 'property'
  | 'labour'
  | 'immigration'
  | 'intellectual_property'
  | 'tax'
  | 'personal_injury'
  | 'debt_recovery'
  | 'other'

export type CaseStatus =
  | 'intake'
  | 'review'
  | 'active'
  | 'on_hold'
  | 'closed'
  | 'archived'

export type LeadSource =
  | 'website'
  | 'referral'
  | 'social_media'
  | 'google_ads'
  | 'walk_in'
  | 'phone'
  | 'email'
  | 'partner'
  | 'event'
  | 'other'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'consultation_scheduled'
  | 'retained'
  | 'lost'
  | 'nurturing'

export type IntakeStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'additional_info_needed'

export type AnalysisType =
  | 'merit_assessment'
  | 'risk_analysis'
  | 'cost_estimate'
  | 'timeline_prediction'
  | 'document_review'
  | 'legal_research'
  | 'strategy_recommendation'

export type AnalysisStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

export type Priority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export type DocumentType =
  | 'id_document'
  | 'contract'
  | 'court_filing'
  | 'correspondence'
  | 'evidence'
  | 'financial'
  | 'medical'
  | 'police_report'
  | 'affidavit'
  | 'other'

export type DocumentStatus =
  | 'uploading'
  | 'uploaded'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'archived'

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type MessageType =
  | 'system'
  | 'direct'
  | 'group'
  | 'notification'

export type ConsultationStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type ConsentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'popi_act'
  | 'marketing'
  | 'data_processing'

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'trial'

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'

export type WorkbenchLayout =
  | 'grid'
  | 'list'
  | 'compact'

export type WidgetType =
  | 'case_summary'
  | 'task_list'
  | 'upcoming_deadlines'
  | 'recent_documents'
  | 'billing_overview'
  | 'lead_pipeline'
  | 'ai_insights'
  | 'quick_actions'
  | 'notifications'
  | 'calendar'

export type ReportType =
  | 'leads_summary'
  | 'revenue'
  | 'case_metrics'
  | 'client_acquisition'
  | 'attorney_performance'
  | 'ai_usage'
  | 'conversion_funnel'

export type ContactMessageStatus =
  | 'unread'
  | 'read'
  | 'replied'
  | 'archived'
