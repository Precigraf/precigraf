export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      calculations: {
        Row: {
          cost_type: string
          created_at: string
          duplicated_from: string | null
          energy_cost: number
          equipment_cost: number
          fixed_profit: number | null
          id: string
          ink_cost: number
          is_favorite: boolean
          labor_cost: number
          lot_cost: number
          lot_quantity: number
          margin_percentage: number
          other_material_cost: number
          other_operational_cost: number
          paper_cost: number
          product_name: string
          profit: number
          raw_inputs: Json | null
          rent_cost: number
          sale_price: number
          total_cost: number
          unit_price: number
          user_id: string
          varnish_cost: number
        }
        Insert: {
          cost_type?: string
          created_at?: string
          duplicated_from?: string | null
          energy_cost?: number
          equipment_cost?: number
          fixed_profit?: number | null
          id?: string
          ink_cost?: number
          is_favorite?: boolean
          labor_cost?: number
          lot_cost?: number
          lot_quantity?: number
          margin_percentage?: number
          other_material_cost?: number
          other_operational_cost?: number
          paper_cost?: number
          product_name: string
          profit: number
          raw_inputs?: Json | null
          rent_cost?: number
          sale_price: number
          total_cost: number
          unit_price: number
          user_id: string
          varnish_cost?: number
        }
        Update: {
          cost_type?: string
          created_at?: string
          duplicated_from?: string | null
          energy_cost?: number
          equipment_cost?: number
          fixed_profit?: number | null
          id?: string
          ink_cost?: number
          is_favorite?: boolean
          labor_cost?: number
          lot_cost?: number
          lot_quantity?: number
          margin_percentage?: number
          other_material_cost?: number
          other_operational_cost?: number
          paper_cost?: number
          product_name?: string
          profit?: number
          raw_inputs?: Json | null
          rent_cost?: number
          sale_price?: number
          total_cost?: number
          unit_price?: number
          user_id?: string
          varnish_cost?: number
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          address_number: string | null
          cep: string | null
          city: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          landmark: string | null
          name: string
          neighborhood: string | null
          notes: string | null
          state: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          cep?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          landmark?: string | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          address_number?: string | null
          cep?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          landmark?: string | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      device_fingerprints: {
        Row: {
          created_at: string | null
          fingerprint_hash: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fingerprint_hash: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fingerprint_hash?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          order_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          order_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string
          created_at: string
          id: string
          kanban_position: number
          quote_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          kanban_position?: number
          quote_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          kanban_position?: number
          quote_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_payments: {
        Row: {
          completed_at: string | null
          created_at: string
          csrf_token: string
          expires_at: string
          id: string
          payment_provider_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          csrf_token: string
          expires_at?: string
          id?: string
          payment_provider_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          csrf_token?: string
          expires_at?: string
          id?: string
          payment_provider_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_address: string | null
          company_address_number: string | null
          company_cep: string | null
          company_city: string | null
          company_document: string | null
          company_email: string | null
          company_full_address: string | null
          company_name: string | null
          company_neighborhood: string | null
          company_phone: string | null
          company_state: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          monthly_edits_count: number
          monthly_edits_reset_at: string
          pix_key: string | null
          plan: string
          plan_id: string
          profile_image_url: string | null
          store_name: string | null
          system_color: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_address?: string | null
          company_address_number?: string | null
          company_cep?: string | null
          company_city?: string | null
          company_document?: string | null
          company_email?: string | null
          company_full_address?: string | null
          company_name?: string | null
          company_neighborhood?: string | null
          company_phone?: string | null
          company_state?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          monthly_edits_count?: number
          monthly_edits_reset_at?: string
          pix_key?: string | null
          plan?: string
          plan_id?: string
          profile_image_url?: string | null
          store_name?: string | null
          system_color?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_address?: string | null
          company_address_number?: string | null
          company_cep?: string | null
          company_city?: string | null
          company_document?: string | null
          company_email?: string | null
          company_full_address?: string | null
          company_name?: string | null
          company_neighborhood?: string | null
          company_phone?: string | null
          company_state?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          monthly_edits_count?: number
          monthly_edits_reset_at?: string
          pix_key?: string | null
          plan?: string
          plan_id?: string
          profile_image_url?: string | null
          store_name?: string | null
          system_color?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          calculation_id: string | null
          client_id: string
          created_at: string
          description: string | null
          id: string
          product_name: string | null
          quantity: number | null
          raw_data: Json | null
          status: string
          total_value: number
          unit_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calculation_id?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          product_name?: string | null
          quantity?: number | null
          raw_data?: Json | null
          status?: string
          total_value: number
          unit_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calculation_id?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          product_name?: string | null
          quantity?: number | null
          raw_data?: Json | null
          status?: string
          total_value?: number
          unit_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_calculation_id_fkey"
            columns: ["calculation_id"]
            isOneToOne: false
            referencedRelation: "calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          blocked_until: string | null
          created_at: string | null
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          action_type: string
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          action_type?: string
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string | null
          event_description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          can_export: boolean | null
          created_at: string | null
          id: string
          max_calculations: number
          name: string
        }
        Insert: {
          can_export?: boolean | null
          created_at?: string | null
          id?: string
          max_calculations: number
          name: string
        }
        Update: {
          can_export?: boolean | null
          created_at?: string | null
          id?: string
          max_calculations?: number
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          last_login: string | null
          must_change_password: boolean
          name: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_login?: string | null
          must_change_password?: boolean
          name?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          must_change_password?: boolean
          name?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      pending_payments_safe: {
        Row: {
          completed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_device_fingerprint: {
        Args: {
          p_fingerprint_hash: string
          p_ip_address?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: Json
      }
      check_edit_limit: { Args: { p_user_id: string }; Returns: Json }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: Json
      }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      confirm_payment_webhook: {
        Args: {
          p_amount?: number
          p_payment_provider_id: string
          p_user_email?: string
        }
        Returns: Json
      }
      get_free_plan_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_edit_count: { Args: { p_user_id: string }; Returns: undefined }
      log_security_event: {
        Args: {
          p_description: string
          p_event_type: string
          p_ip_address?: string
          p_metadata?: Json
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      validate_user_plan: {
        Args: { p_feature: string; p_user_id: string }
        Returns: Json
      }
      verify_and_complete_payment: {
        Args: { p_csrf_token: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
