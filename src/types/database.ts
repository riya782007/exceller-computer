export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'technician' | 'customer'

export type JobStatus =
  | 'received'
  | 'diagnosed'
  | 'quoted'
  | 'approved'
  | 'in_repair'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type InventoryCategory = 'part' | 'refurbished_laptop' | 'accessory'

export type BotState = 'active' | 'paused' | 'escalated'

export type TaxType = 'intra_state' | 'inter_state'

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'cancelled'

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'

export type MsgChannel = 'whatsapp' | 'sms' | 'email' | 'in_app'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          role: UserRole
          address: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email?: string | null
          phone?: string | null
          role?: UserRole
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          role?: UserRole
          address?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          sku: string
          name: string
          category: InventoryCategory
          brand: string | null
          model: string | null
          cost_price: number
          selling_price: number
          quantity: number
          hsn_sac: string | null
          specifications: Json | null
          is_public: boolean
          condition: string | null
          warranty_months: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          category: InventoryCategory
          brand?: string | null
          model?: string | null
          cost_price: number
          selling_price: number
          quantity?: number
          hsn_sac?: string | null
          specifications?: Json | null
          is_public?: boolean
          condition?: string | null
          warranty_months?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          sku?: string
          name?: string
          category?: InventoryCategory
          brand?: string | null
          model?: string | null
          cost_price?: number
          selling_price?: number
          quantity?: number
          hsn_sac?: string | null
          specifications?: Json | null
          is_public?: boolean
          condition?: string | null
          warranty_months?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      repair_jobs: {
        Row: {
          id: string
          job_card_number: string
          customer_id: string
          technician_id: string | null
          device_type: string
          device_brand: string
          device_model: string | null
          serial_number: string | null
          reported_fault: string
          diagnosis: string | null
          estimated_cost: number | null
          final_cost: number | null
          status: JobStatus
          received_at: string
          diagnosed_at: string | null
          quoted_at: string | null
          approved_at: string | null
          repair_started_at: string | null
          ready_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_card_number?: string
          customer_id: string
          technician_id?: string | null
          device_type: string
          device_brand: string
          device_model?: string | null
          serial_number?: string | null
          reported_fault: string
          diagnosis?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          status?: JobStatus
          received_at?: string
          diagnosed_at?: string | null
          quoted_at?: string | null
          approved_at?: string | null
          repair_started_at?: string | null
          ready_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          job_card_number?: string
          customer_id?: string
          technician_id?: string | null
          device_type?: string
          device_brand?: string
          device_model?: string | null
          serial_number?: string | null
          reported_fault?: string
          diagnosis?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          status?: JobStatus
          diagnosed_at?: string | null
          quoted_at?: string | null
          approved_at?: string | null
          repair_started_at?: string | null
          ready_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'repair_jobs_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'repair_jobs_technician_id_fkey'
            columns: ['technician_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      job_parts_allocated: {
        Row: {
          id: string
          job_id: string
          item_id: string
          quantity: number
          unit_price: number
          allocated_by: string | null
          allocated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          item_id: string
          quantity: number
          unit_price: number
          allocated_by?: string | null
          allocated_at?: string
          created_at?: string
        }
        Update: {
          job_id?: string
          item_id?: string
          quantity?: number
          unit_price?: number
          allocated_by?: string | null
          allocated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'job_parts_allocated_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'repair_jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_parts_allocated_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'inventory_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_parts_allocated_allocated_by_fkey'
            columns: ['allocated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          customer_id: string
          job_id: string | null
          subtotal: number
          tax_type: TaxType
          cgst: number
          sgst: number
          igst: number
          total: number
          payment_status: PaymentStatus
          pdf_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number?: string
          customer_id: string
          job_id?: string | null
          subtotal: number
          tax_type?: TaxType
          cgst?: number
          sgst?: number
          igst?: number
          total: number
          payment_status?: PaymentStatus
          pdf_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          invoice_number?: string
          customer_id?: string
          job_id?: string | null
          subtotal?: number
          tax_type?: TaxType
          cgst?: number
          sgst?: number
          igst?: number
          total?: number
          payment_status?: PaymentStatus
          pdf_url?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invoices_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'repair_jobs'
            referencedColumns: ['id']
          }
        ]
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          hsn_sac: string | null
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          hsn_sac?: string | null
          amount: number
          created_at?: string
        }
        Update: {
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          hsn_sac?: string | null
          amount?: number
        }
        Relationships: [
          {
            foreignKeyName: 'invoice_items_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          }
        ]
      }
      chat_sessions: {
        Row: {
          id: string
          phone_number: string
          customer_id: string | null
          bot_state: BotState
          last_message_at: string | null
          escalated_at: string | null
          escalation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          customer_id?: string | null
          bot_state?: BotState
          last_message_at?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          phone_number?: string
          customer_id?: string | null
          bot_state?: BotState
          last_message_at?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chat_sessions_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      business_assets: {
        Row: {
          id: string
          storage_path: string
          file_name: string
          mime_type: string
          size_bytes: number
          alt_text: string | null
          purpose: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          storage_path: string
          file_name: string
          mime_type: string
          size_bytes: number
          alt_text?: string | null
          purpose?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          alt_text?: string | null
          purpose?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_assets_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      public_agent_offers: {
        Row: {
          id: string
          title: string
          summary: string
          price_note: string | null
          image_url: string | null
          image_path: string | null
          payment_url: string | null
          service_slug: string | null
          cta_label: string
          is_active: boolean
          sort_order: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          summary: string
          price_note?: string | null
          image_url?: string | null
          image_path?: string | null
          payment_url?: string | null
          service_slug?: string | null
          cta_label?: string
          is_active?: boolean
          sort_order?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          summary?: string
          price_note?: string | null
          image_url?: string | null
          image_path?: string | null
          payment_url?: string | null
          service_slug?: string | null
          cta_label?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_agent_offers_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      webhook_events: {
        Row: {
          id: string
          provider: string
          provider_event_id: string
          event_type: string
          received_at: string
          processed_at: string | null
          processing_error: string | null
          payload: Json
        }
        Insert: {
          id?: string
          provider?: string
          provider_event_id: string
          event_type: string
          received_at?: string
          processed_at?: string | null
          processing_error?: string | null
          payload: Json
        }
        Update: {
          processed_at?: string | null
          processing_error?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          provider_message_id: string
          direction: 'inbound' | 'outbound'
          message_type: string | null
          body: string | null
          metadata: Json | null
          received_at: string
        }
        Insert: {
          id?: string
          session_id: string
          provider_message_id: string
          direction: 'inbound' | 'outbound'
          message_type?: string | null
          body?: string | null
          metadata?: Json | null
          received_at?: string
        }
        Update: {
          message_type?: string | null
          body?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'chat_messages_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'chat_sessions'
            referencedColumns: ['id']
          }
        ]
      }
      // Added by hand so the estimator lead-capture action compiles.
      // `npm run gen:types` will supersede this along with the other 22 tables
      // from SETUP_PART_B.sql once that migration has been applied.
      leads: {
        Row: {
          id: string
          full_name: string | null
          phone: string
          email: string | null
          city: string | null
          locality: string | null
          device_type: string | null
          brand: string | null
          issue_summary: string | null
          service_interest: string | null
          estimated_value: number | null
          source: string | null
          channel: MsgChannel | null
          status: LeadStatus
          assigned_to: string | null
          converted_customer_id: string | null
          converted_job_id: string | null
          lost_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name?: string | null
          phone: string
          email?: string | null
          city?: string | null
          locality?: string | null
          device_type?: string | null
          brand?: string | null
          issue_summary?: string | null
          service_interest?: string | null
          estimated_value?: number | null
          source?: string | null
          channel?: MsgChannel | null
          status?: LeadStatus
          assigned_to?: string | null
          converted_customer_id?: string | null
          converted_job_id?: string | null
          lost_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          phone?: string
          email?: string | null
          city?: string | null
          locality?: string | null
          device_type?: string | null
          brand?: string | null
          issue_summary?: string | null
          service_interest?: string | null
          estimated_value?: number | null
          source?: string | null
          channel?: MsgChannel | null
          status?: LeadStatus
          assigned_to?: string | null
          converted_customer_id?: string | null
          converted_job_id?: string | null
          lost_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leads_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_part_to_job: {
        Args: {
          p_job_id: string
          p_item_id: string
          p_quantity: number
          p_allocated_by: string | null
        }
        Returns: string
      }
      transition_job_status: {
        Args: {
          p_job_id: string
          p_new_status: JobStatus
          // Null when the owner is signed in with the console access code
          // rather than a provisioned Supabase staff account.
          p_user_id: string | null
        }
        Returns: boolean
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      consume_public_agent_rate_limit: {
        Args: {
          p_key_hash: string
          p_max_requests?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      job_status: JobStatus
      inventory_category: InventoryCategory
      bot_state: BotState
      tax_type: TaxType
      payment_status: PaymentStatus
      lead_status: LeadStatus
      msg_channel: MsgChannel
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
