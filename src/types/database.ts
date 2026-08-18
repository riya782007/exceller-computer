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

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'cancelled' | 'refunded'

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
          low_stock_threshold: number
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
          low_stock_threshold?: number
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
          low_stock_threshold?: number
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
          allocated_by: string
          allocated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          item_id: string
          quantity: number
          unit_price: number
          allocated_by: string
          allocated_at?: string
          created_at?: string
        }
        Update: {
          job_id?: string
          item_id?: string
          quantity?: number
          unit_price?: number
          allocated_by?: string
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
          context_data: Json
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
          context_data?: Json
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
          context_data?: Json
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
      job_status_events: {
        Row: {
          id: string
          job_id: string
          from_status: JobStatus | null
          to_status: JobStatus
          changed_by: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          from_status?: JobStatus | null
          to_status: JobStatus
          changed_by?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          job_id?: string
          from_status?: JobStatus | null
          to_status?: JobStatus
          changed_by?: string | null
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'job_status_events_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'repair_jobs'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      allocate_part_to_job: {
        Args: {
          p_job_id: string
          p_item_id: string
          p_quantity: number
          p_allocated_by: string
        }
        Returns: string
      }
      transition_job_status: {
        Args: {
          p_job_id: string
          p_new_status: JobStatus
          p_user_id: string
        }
        Returns: boolean
      }
      generate_invoice_number: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      user_role: UserRole
      job_status: JobStatus
      inventory_category: InventoryCategory
      bot_state: BotState
      tax_type: TaxType
      payment_status: PaymentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
