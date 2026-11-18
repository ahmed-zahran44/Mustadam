export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      acquisition_requests: {
        Row: {
          dropoff_partner_id: string | null
          handover_method: string | null
          manifest_id: string | null
          pickup_address: string | null
          pickup_slot: string | null
          preverification_status: string
          preverified_by: string | null
          request_id: string
          request_type: string
          seller_id: string
          status: string
          submission_date: string
          tracking_code: string
        }
        Insert: {
          dropoff_partner_id?: string | null
          handover_method?: string | null
          manifest_id?: string | null
          pickup_address?: string | null
          pickup_slot?: string | null
          preverification_status?: string
          preverified_by?: string | null
          request_id?: string
          request_type?: string
          seller_id: string
          status?: string
          submission_date?: string
          tracking_code: string
        }
        Update: {
          dropoff_partner_id?: string | null
          handover_method?: string | null
          manifest_id?: string | null
          pickup_address?: string | null
          pickup_slot?: string | null
          preverification_status?: string
          preverified_by?: string | null
          request_id?: string
          request_type?: string
          seller_id?: string
          status?: string
          submission_date?: string
          tracking_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "acquisition_requests_dropoff_partner_id_fkey"
            columns: ["dropoff_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_hubs"
            referencedColumns: ["hub_id"]
          },
          {
            foreignKeyName: "acquisition_requests_manifest_id_fkey"
            columns: ["manifest_id"]
            isOneToOne: false
            referencedRelation: "pickup_manifests"
            referencedColumns: ["manifest_id"]
          },
          {
            foreignKeyName: "acquisition_requests_preverified_by_fkey"
            columns: ["preverified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "acquisition_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categories: {
        Row: {
          base_reference_price: number
          category_id: string
          diagnostic_questions_json: Json
          is_bulky: boolean
          name: string
          name_ar: string
          parent_id: string | null
          requires_data_wipe: boolean
          warranty_days: number
        }
        Insert: {
          base_reference_price?: number
          category_id?: string
          diagnostic_questions_json?: Json
          is_bulky?: boolean
          name: string
          name_ar: string
          parent_id?: string | null
          requires_data_wipe?: boolean
          warranty_days?: number
        }
        Update: {
          base_reference_price?: number
          category_id?: string
          diagnostic_questions_json?: Json
          is_bulky?: boolean
          name?: string
          name_ar?: string
          parent_id?: string | null
          requires_data_wipe?: boolean
          warranty_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      dismantling_tickets: {
        Row: {
          closed_at: string | null
          created_at: string
          dismantle_id: string
          item_serial_id: string
          status: string
          technician_id: string | null
          trigger: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          dismantle_id?: string
          item_serial_id: string
          status?: string
          technician_id?: string | null
          trigger: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          dismantle_id?: string
          item_serial_id?: string
          status?: string
          technician_id?: string | null
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismantling_tickets_item_serial_id_fkey"
            columns: ["item_serial_id"]
            isOneToOne: false
            referencedRelation: "serialized_items"
            referencedColumns: ["item_serial_id"]
          },
          {
            foreignKeyName: "dismantling_tickets_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inspection_records: {
        Row: {
          condition_notes: string
          data_wipe_certificate_url: string | null
          inspected_at: string
          inspection_id: string
          inspector_id: string
          item_serial_id: string
          technical_classification: string
        }
        Insert: {
          condition_notes: string
          data_wipe_certificate_url?: string | null
          inspected_at?: string
          inspection_id?: string
          inspector_id: string
          item_serial_id: string
          technical_classification: string
        }
        Update: {
          condition_notes?: string
          data_wipe_certificate_url?: string | null
          inspected_at?: string
          inspection_id?: string
          inspector_id?: string
          item_serial_id?: string
          technical_classification?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_records_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inspection_records_item_serial_id_fkey"
            columns: ["item_serial_id"]
            isOneToOne: false
            referencedRelation: "serialized_items"
            referencedColumns: ["item_serial_id"]
          },
        ]
      }
      item_photos: {
        Row: {
          item_serial_id: string
          photo_id: string
          photo_type: string
          sort_order: number
          url: string
        }
        Insert: {
          item_serial_id: string
          photo_id?: string
          photo_type: string
          sort_order?: number
          url: string
        }
        Update: {
          item_serial_id?: string
          photo_id?: string
          photo_type?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_photos_item_serial_id_fkey"
            columns: ["item_serial_id"]
            isOneToOne: false
            referencedRelation: "serialized_items"
            referencedColumns: ["item_serial_id"]
          },
        ]
      }
      item_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: string | null
          history_id: string
          item_serial_id: string
          note: string | null
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          history_id?: string
          item_serial_id: string
          note?: string | null
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          history_id?: string
          item_serial_id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "item_status_history_item_serial_id_fkey"
            columns: ["item_serial_id"]
            isOneToOne: false
            referencedRelation: "serialized_items"
            referencedColumns: ["item_serial_id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          message: string
          notification_id: string
          recipient_id: string
          status: string
          type: string
        }
        Insert: {
          channel: string
          created_at?: string
          message: string
          notification_id?: string
          recipient_id: string
          status?: string
          type: string
        }
        Update: {
          channel?: string
          created_at?: string
          message?: string
          notification_id?: string
          recipient_id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      order_items_warranty: {
        Row: {
          delivery_date: string | null
          item_serial_id: string
          order_id: string
          order_item_id: string
          sold_price: number
          warranty_end_date: string | null
        }
        Insert: {
          delivery_date?: string | null
          item_serial_id: string
          order_id: string
          order_item_id?: string
          sold_price: number
          warranty_end_date?: string | null
        }
        Update: {
          delivery_date?: string | null
          item_serial_id?: string
          order_id?: string
          order_item_id?: string
          sold_price?: number
          warranty_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_warranty_item_serial_id_fkey"
            columns: ["item_serial_id"]
            isOneToOne: false
            referencedRelation: "serialized_items"
            referencedColumns: ["item_serial_id"]
          },
          {
            foreignKeyName: "order_items_warranty_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          delivery_address: string
          invoice_url: string | null
          order_id: string
          paid_at: string | null
          payment_method: string
          payment_status: string
          payment_transaction_ref: string | null
          quote_id: string | null
          reserved_until: string
          total_amount: number
        }
        Insert: {
          buyer_id: string
          created_at?: string
          delivery_address: string
          invoice_url?: string | null
          order_id?: string
          paid_at?: string | null
          payment_method: string
          payment_status?: string
          payment_transaction_ref?: string | null
          quote_id?: string | null
          reserved_until: string
          total_amount: number
        }
        Update: {
          buyer_id?: string
          created_at?: string
          delivery_address?: string
          invoice_url?: string | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          payment_transaction_ref?: string | null
          quote_id?: string | null
          reserved_until?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      partner_hubs: {
        Row: {
          address: string
          city: string
          hub_id: string
          is_dropoff: boolean
          is_warehouse: boolean
          name: string
          name_ar: string
          zone: string
        }
        Insert: {
          address: string
          city: string
          hub_id?: string
          is_dropoff?: boolean
          is_warehouse?: boolean
          name: string
          name_ar: string
          zone: string
        }
        Update: {
          address?: string
          city?: string
          hub_id?: string
          is_dropoff?: boolean
          is_warehouse?: boolean
          name?: string
          name_ar?: string
          zone?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string
          event_id: string
          order_id: string
          outcome: string
          payload: Json
          source: string
        }
        Insert: {
          created_at?: string
          event_id?: string
          order_id: string
          outcome: string
          payload?: Json
          source?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          order_id?: string
          outcome?: string
          payload?: Json
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          item_serial_id: string
          payout_id: string
          payout_ref: string
          seller_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          item_serial_id: string
          payout_id?: string
          payout_ref: string
          seller_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          item_serial_id?: string
          payout_id?: string
          payout_ref?: string
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_item_serial_id_fkey"
            columns: ["item_serial_id"]
            isOneToOne: false
            referencedRelation: "serialized_items"
            referencedColumns: ["item_serial_id"]
          },
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pickup_manifests: {
        Row: {
          manifest_id: string
          scheduled_date: string
          status: string
          total_batch_logistics_cost: number
          transport_user_id: string | null
          zone: string
        }
        Insert: {
          manifest_id?: string
          scheduled_date: string
          status?: string
          total_batch_logistics_cost?: number
          transport_user_id?: string | null
          zone: string
        }
        Update: {
          manifest_id?: string
          scheduled_date?: string
          status?: string
          total_batch_logistics_cost?: number
          transport_user_id?: string | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_manifests_transport_user_id_fkey"
            columns: ["transport_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quote_items: {
        Row: {
          item_serial_id: string
          quote_id: string
          quote_item_id: string
        }
        Insert: {
          item_serial_id: string
          quote_id: string
          quote_item_id?: string
        }
        Update: {
          item_serial_id?: string
          quote_id?: string
          quote_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_item_serial_id_fkey"
            columns: ["item_serial_id"]
            isOneToOne: false
            referencedRelation: "serialized_items"
            referencedColumns: ["item_serial_id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          buyer_id: string
          created_at: string
          discount_pct: number
          quote_id: string
          status: string
          valid_until: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          discount_pct?: number
          quote_id?: string
          status?: string
          valid_until?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          discount_pct?: number
          quote_id?: string
          status?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      recycling_batches: {
        Row: {
          batch_id: string
          handover_date: string
          material_type: string
          recorded_by: string
          recycler_entity_name: string
          revenue_amount: number
          total_weight_kg: number
        }
        Insert: {
          batch_id?: string
          handover_date?: string
          material_type: string
          recorded_by: string
          recycler_entity_name: string
          revenue_amount: number
          total_weight_kg: number
        }
        Update: {
          batch_id?: string
          handover_date?: string
          material_type?: string
          recorded_by?: string
          recycler_entity_name?: string
          revenue_amount?: number
          total_weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "recycling_batches_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      refurbishment_logs: {
        Row: {
          closed_at: string | null
          final_grade: string | null
          item_serial_id: string
          labor_cost: number
          opened_at: string
          parts_cost: number
          refurb_id: string
          status: string
          technician_id: string | null
          work_description: string | null
        }
        Insert: {
          closed_at?: string | null
          final_grade?: string | null
          item_serial_id: string
          labor_cost?: number
          opened_at?: string
          parts_cost?: number
          refurb_id?: string
          status?: string
          technician_id?: string | null
          work_description?: string | null
        }
        Update: {
          closed_at?: string | null
          final_grade?: string | null
          item_serial_id?: string
          labor_cost?: number
          opened_at?: string
          parts_cost?: number
          refurb_id?: string
          status?: string
          technician_id?: string | null
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refurbishment_logs_item_serial_id_fkey"
            columns: ["item_serial_id"]
            isOneToOne: false
            referencedRelation: "serialized_items"
            referencedColumns: ["item_serial_id"]
          },
          {
            foreignKeyName: "refurbishment_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      return_tasks: {
        Row: {
          created_at: string
          fee_amount: number
          fee_payment_ref: string | null
          fee_status: string
          item_serial_id: string
          return_id: string
          status: string
        }
        Insert: {
          created_at?: string
          fee_amount: number
          fee_payment_ref?: string | null
          fee_status?: string
          item_serial_id: string
          return_id?: string
          status?: string
        }
        Update: {
          created_at?: string
          fee_amount?: number
          fee_payment_ref?: string | null
          fee_status?: string
          item_serial_id?: string
          return_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_tasks_item_serial_id_fkey"
            columns: ["item_serial_id"]
            isOneToOne: false
            referencedRelation: "serialized_items"
            referencedColumns: ["item_serial_id"]
          },
        ]
      }
      scrap_entries: {
        Row: {
          batch_id: string | null
          dismantle_id: string
          material_type: string
          scrap_id: string
          weight_kg: number
        }
        Insert: {
          batch_id?: string | null
          dismantle_id: string
          material_type: string
          scrap_id?: string
          weight_kg: number
        }
        Update: {
          batch_id?: string | null
          dismantle_id?: string
          material_type?: string
          scrap_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "scrap_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "recycling_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "scrap_entries_dismantle_id_fkey"
            columns: ["dismantle_id"]
            isOneToOne: false
            referencedRelation: "dismantling_tickets"
            referencedColumns: ["dismantle_id"]
          },
        ]
      }
      serialized_items: {
        Row: {
          aging_tier: string | null
          barcode: string | null
          category_id: string
          condition_grade: string | null
          created_at: string
          current_status: string
          data_wiped_bool: boolean
          diagnostic_answers: Json
          estimated_max_price: number
          estimated_min_price: number
          final_purchase_price: number | null
          item_serial_id: string
          listed_date: string | null
          logistics_cost: number
          offer_expires_at: string | null
          refurbishment_cost: number
          request_id: string
          seller_decision: string | null
          selling_price: number | null
          target_selling_price: number | null
          title: string
          title_ar: string | null
          total_unit_cost: number | null
          weight_kg: number | null
        }
        Insert: {
          aging_tier?: string | null
          barcode?: string | null
          category_id: string
          condition_grade?: string | null
          created_at?: string
          current_status?: string
          data_wiped_bool?: boolean
          diagnostic_answers?: Json
          estimated_max_price: number
          estimated_min_price: number
          final_purchase_price?: number | null
          item_serial_id?: string
          listed_date?: string | null
          logistics_cost?: number
          offer_expires_at?: string | null
          refurbishment_cost?: number
          request_id: string
          seller_decision?: string | null
          selling_price?: number | null
          target_selling_price?: number | null
          title: string
          title_ar?: string | null
          total_unit_cost?: number | null
          weight_kg?: number | null
        }
        Update: {
          aging_tier?: string | null
          barcode?: string | null
          category_id?: string
          condition_grade?: string | null
          created_at?: string
          current_status?: string
          data_wiped_bool?: boolean
          diagnostic_answers?: Json
          estimated_max_price?: number
          estimated_min_price?: number
          final_purchase_price?: number | null
          item_serial_id?: string
          listed_date?: string | null
          logistics_cost?: number
          offer_expires_at?: string | null
          refurbishment_cost?: number
          request_id?: string
          seller_decision?: string | null
          selling_price?: number | null
          target_selling_price?: number | null
          title?: string
          title_ar?: string | null
          total_unit_cost?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "serialized_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "serialized_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "acquisition_requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      spare_parts_inventory: {
        Row: {
          category_id: string
          consumed_in_refurb_id: string | null
          estimated_cost: number
          internal_cost: number
          part_id: string
          part_name: string
          source_item_serial_id: string
          status: string
        }
        Insert: {
          category_id: string
          consumed_in_refurb_id?: string | null
          estimated_cost?: number
          internal_cost?: number
          part_id?: string
          part_name: string
          source_item_serial_id: string
          status?: string
        }
        Update: {
          category_id?: string
          consumed_in_refurb_id?: string | null
          estimated_cost?: number
          internal_cost?: number
          part_id?: string
          part_name?: string
          source_item_serial_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_inventory_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "spare_parts_inventory_consumed_in_refurb_id_fkey"
            columns: ["consumed_in_refurb_id"]
            isOneToOne: false
            referencedRelation: "refurbishment_logs"
            referencedColumns: ["refurb_id"]
          },
          {
            foreignKeyName: "spare_parts_inventory_source_item_serial_id_fkey"
            columns: ["source_item_serial_id"]
            isOneToOne: false
            referencedRelation: "serialized_items"
            referencedColumns: ["item_serial_id"]
          },
        ]
      }
      users: {
        Row: {
          account_type: string
          commercial_reg: string | null
          company_address: string | null
          created_at: string
          email: string
          name: string
          phone: string
          role: string
          segment: string
          tax_id: string | null
          user_id: string
        }
        Insert: {
          account_type: string
          commercial_reg?: string | null
          company_address?: string | null
          created_at?: string
          email: string
          name: string
          phone: string
          role: string
          segment?: string
          tax_id?: string | null
          user_id: string
        }
        Update: {
          account_type?: string
          commercial_reg?: string | null
          company_address?: string | null
          created_at?: string
          email?: string
          name?: string
          phone?: string
          role?: string
          segment?: string
          tax_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      warranty_claims: {
        Row: {
          assigned_to: string | null
          buyer_id: string
          claim_id: string
          created_at: string
          description: string
          order_item_id: string
          resolution_note: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          buyer_id: string
          claim_id?: string
          created_at?: string
          description: string
          order_item_id: string
          resolution_note?: string | null
          status?: string
        }
        Update: {
          assigned_to?: string | null
          buyer_id?: string
          claim_id?: string
          created_at?: string
          description?: string
          order_item_id?: string
          resolution_note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claims_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "warranty_claims_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "warranty_claims_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items_warranty"
            referencedColumns: ["order_item_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      rpc_allocate_batch_logistics_cost: {
        Args: { p_manifest_id: string; p_total_batch_cost: number }
        Returns: Json
      }
      rpc_create_order_with_reservation: {
        Args: {
          p_buyer_id: string
          p_delivery_address: string
          p_item_serial_ids: string[]
          p_payment_method: string
          p_quote_id?: string
        }
        Returns: Json
      }
      rpc_process_payment_webhook: {
        Args: {
          p_order_id: string
          p_outcome: string
          p_payload?: Json
          p_transaction_ref: string
        }
        Returns: Json
      }
      rpc_run_inventory_aging: {
        Args: { p_reference_time?: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

