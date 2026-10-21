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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ea_commands: {
        Row: {
          applied_at: string | null
          created_at: string
          delivered_at: string | null
          id: string
          kind: string
          payload: Json | null
          status: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          kind: string
          payload?: Json | null
          status?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          kind?: string
          payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      ea_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          level: string
          message: string
          source: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message: string
          source?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          source?: string
        }
        Relationships: []
      }
      ea_positions: {
        Row: {
          break_even: boolean
          direction: string
          entry_price: number
          floating_pl: number | null
          id: string
          lots: number
          opened_at: string
          stop_loss: number | null
          strategy: string
          symbol: string
          take_profit: number | null
          ticket: string
        }
        Insert: {
          break_even?: boolean
          direction: string
          entry_price: number
          floating_pl?: number | null
          id?: string
          lots: number
          opened_at: string
          stop_loss?: number | null
          strategy: string
          symbol: string
          take_profit?: number | null
          ticket: string
        }
        Update: {
          break_even?: boolean
          direction?: string
          entry_price?: number
          floating_pl?: number | null
          id?: string
          lots?: number
          opened_at?: string
          stop_loss?: number | null
          strategy?: string
          symbol?: string
          take_profit?: number | null
          ticket?: string
        }
        Relationships: []
      }
      ea_settings: {
        Row: {
          be_coverage_percent: number
          daily_reset_time: string
          entry_models: Json
          hard_max_risk_percent: number
          id: number
          max_daily_losses: number
          max_open_trades: number
          prop_dd_daily_limit: number
          prop_risk_fraction: number
          real_risk_percent: number
          risk_mode: string
          sessions: Json
          target_mode: string
          updated_at: string
        }
        Insert: {
          be_coverage_percent?: number
          daily_reset_time?: string
          entry_models?: Json
          hard_max_risk_percent?: number
          id?: number
          max_daily_losses?: number
          max_open_trades?: number
          prop_dd_daily_limit?: number
          prop_risk_fraction?: number
          real_risk_percent?: number
          risk_mode?: string
          sessions?: Json
          target_mode?: string
          updated_at?: string
        }
        Update: {
          be_coverage_percent?: number
          daily_reset_time?: string
          entry_models?: Json
          hard_max_risk_percent?: number
          id?: number
          max_daily_losses?: number
          max_open_trades?: number
          prop_dd_daily_limit?: number
          prop_risk_fraction?: number
          real_risk_percent?: number
          risk_mode?: string
          sessions?: Json
          target_mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      ea_state: {
        Row: {
          account_login: string | null
          account_type: string
          balance: number | null
          daily_pl: number | null
          daily_pl_date: string | null
          emergency_stop: boolean
          equity: number | null
          error_message: string | null
          floating_pl: number | null
          id: number
          last_heartbeat: string | null
          market: string
          mode: string
          status: string
          updated_at: string
        }
        Insert: {
          account_login?: string | null
          account_type?: string
          balance?: number | null
          daily_pl?: number | null
          daily_pl_date?: string | null
          emergency_stop?: boolean
          equity?: number | null
          error_message?: string | null
          floating_pl?: number | null
          id?: number
          last_heartbeat?: string | null
          market?: string
          mode?: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_login?: string | null
          account_type?: string
          balance?: number | null
          daily_pl?: number | null
          daily_pl_date?: string | null
          emergency_stop?: boolean
          equity?: number | null
          error_message?: string | null
          floating_pl?: number | null
          id?: number
          last_heartbeat?: string | null
          market?: string
          mode?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ea_trades: {
        Row: {
          closed_at: string | null
          created_at: string
          direction: string
          entry_price: number
          exit_price: number | null
          id: string
          lots: number
          opened_at: string
          pnl: number | null
          reason: string | null
          result: string | null
          stop_loss: number | null
          strategy: string
          symbol: string
          take_profit: number | null
          ticket: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          direction: string
          entry_price: number
          exit_price?: number | null
          id?: string
          lots: number
          opened_at: string
          pnl?: number | null
          reason?: string | null
          result?: string | null
          stop_loss?: number | null
          strategy: string
          symbol: string
          take_profit?: number | null
          ticket: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          direction?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          lots?: number
          opened_at?: string
          pnl?: number | null
          reason?: string | null
          result?: string | null
          stop_loss?: number | null
          strategy?: string
          symbol?: string
          take_profit?: number | null
          ticket?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
