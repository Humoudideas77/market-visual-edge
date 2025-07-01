export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_activities: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_id: string
          created_at: string
          id: string
          target_record_id: string | null
          target_table: string | null
          target_user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          target_record_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          target_record_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activities_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_activities_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          is_enabled: boolean | null
          notification_type: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          notification_type: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          notification_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_cards: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_address: string | null
          bank_name: string
          created_at: string | null
          id: string
          is_default: boolean | null
          routing_number: string | null
          swift_code: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_address?: string | null
          bank_name: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          routing_number?: string | null
          swift_code?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_address?: string | null
          bank_name?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          routing_number?: string | null
          swift_code?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      crypto_addresses: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean | null
          network: string
          qr_code_url: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          is_active?: boolean | null
          network: string
          qr_code_url?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          network?: string
          qr_code_url?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      customer_messages: {
        Row: {
          admin_id: string | null
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          amount: number
          created_at: string | null
          currency: string
          id: string
          network: string
          screenshot_url: string | null
          status: string
          transaction_screenshot_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          network: string
          screenshot_url?: string | null
          status?: string
          transaction_screenshot_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          network?: string
          screenshot_url?: string | null
          status?: string
          transaction_screenshot_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          address: string
          admin_id: string | null
          admin_notes: string | null
          back_document_url: string | null
          created_at: string | null
          date_of_birth: string
          front_document_url: string | null
          full_name: string
          id: string
          id_card_url: string | null
          nationality: string
          passport_url: string | null
          personal_id_number: string | null
          phone_number: string | null
          reviewed_at: string | null
          selfie_url: string | null
          selfie_with_id_url: string | null
          status: string
          updated_at: string | null
          user_id: string
          utility_bill_url: string | null
        }
        Insert: {
          address: string
          admin_id?: string | null
          admin_notes?: string | null
          back_document_url?: string | null
          created_at?: string | null
          date_of_birth: string
          front_document_url?: string | null
          full_name: string
          id?: string
          id_card_url?: string | null
          nationality: string
          passport_url?: string | null
          personal_id_number?: string | null
          phone_number?: string | null
          reviewed_at?: string | null
          selfie_url?: string | null
          selfie_with_id_url?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          utility_bill_url?: string | null
        }
        Update: {
          address?: string
          admin_id?: string | null
          admin_notes?: string | null
          back_document_url?: string | null
          created_at?: string | null
          date_of_birth?: string
          front_document_url?: string | null
          full_name?: string
          id?: string
          id_card_url?: string | null
          nationality?: string
          passport_url?: string | null
          personal_id_number?: string | null
          phone_number?: string | null
          reviewed_at?: string | null
          selfie_url?: string | null
          selfie_with_id_url?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          utility_bill_url?: string | null
        }
        Relationships: []
      }
      mining_investments: {
        Row: {
          created_at: string
          daily_return_rate: number
          id: string
          investment_amount: number
          last_payout_date: string | null
          maturity_days: number
          next_payout_date: string
          plan_name: string
          start_date: string
          status: string
          total_earned: number
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_return_rate: number
          id?: string
          investment_amount: number
          last_payout_date?: string | null
          maturity_days: number
          next_payout_date: string
          plan_name: string
          start_date?: string
          status?: string
          total_earned?: number
          user_id: string
        }
        Update: {
          created_at?: string
          daily_return_rate?: number
          id?: string
          investment_amount?: number
          last_payout_date?: string | null
          maturity_days?: number
          next_payout_date?: string
          plan_name?: string
          start_date?: string
          status?: string
          total_earned?: number
          user_id?: string
        }
        Relationships: []
      }
      mining_payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          investment_id: string
          payout_date: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          investment_id: string
          payout_date?: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          investment_id?: string
          payout_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mining_payouts_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "mining_investments"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          recipient_id: string
          recipient_transfer_id: string
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          notes?: string | null
          recipient_id: string
          recipient_transfer_id: string
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          recipient_id?: string
          recipient_transfer_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_transfers_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_transfers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perpetual_positions: {
        Row: {
          closed_at: string | null
          created_at: string
          entry_price: number
          exit_price: number | null
          fixed_pnl: number | null
          id: string
          leverage: number
          liquidation_price: number
          margin: number
          pair: string
          side: string
          size: number
          status: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          entry_price: number
          exit_price?: number | null
          fixed_pnl?: number | null
          id?: string
          leverage: number
          liquidation_price: number
          margin: number
          pair: string
          side: string
          size: number
          status?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          entry_price?: number
          exit_price?: number | null
          fixed_pnl?: number | null
          id?: string
          leverage?: number
          liquidation_price?: number
          margin?: number
          pair?: string
          side?: string
          size?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          kyc_status: string | null
          kyc_submission_id: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          trading_enabled: boolean | null
          unique_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          kyc_status?: string | null
          kyc_submission_id?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          trading_enabled?: boolean | null
          unique_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          kyc_status?: string | null
          kyc_submission_id?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          trading_enabled?: boolean | null
          unique_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trade_pnl: {
        Row: {
          created_at: string
          currency: string
          entry_price: number
          exit_price: number
          id: string
          pnl_amount: number
          pnl_percentage: number
          trade_pair: string
          trade_reference: string | null
          trade_side: string
          trade_size: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          entry_price: number
          exit_price: number
          id?: string
          pnl_amount: number
          pnl_percentage: number
          trade_pair: string
          trade_reference?: string | null
          trade_side: string
          trade_size: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          entry_price?: number
          exit_price?: number
          id?: string
          pnl_amount?: number
          pnl_percentage?: number
          trade_pair?: string
          trade_reference?: string | null
          trade_side?: string
          trade_size?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_pnl_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          device_info: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_balances: {
        Row: {
          available_balance: number
          created_at: string
          currency: string
          id: string
          locked_balance: number
          total_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          currency: string
          id?: string
          locked_balance?: number
          total_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          currency?: string
          id?: string
          locked_balance?: number
          total_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          amount: number
          bank_card_id: string | null
          created_at: string | null
          currency: string
          id: string
          network: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          amount: number
          bank_card_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          network: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          amount?: number
          bank_card_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          network?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_bank_card_id_fkey"
            columns: ["bank_card_id"]
            isOneToOne: false
            referencedRelation: "bank_cards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_peer_transfer: {
        Args: {
          p_sender_id: string
          p_recipient_transfer_id: string
          p_currency: string
          p_amount: number
          p_notes?: string
        }
        Returns: Json
      }
      generate_unique_transfer_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_role_secure: {
        Args: { user_uuid: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_secure: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_superadmin_secure: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_superadmin_user: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          p_user_id: string
          p_activity_type: string
          p_details?: Json
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      record_trade_pnl: {
        Args: {
          p_user_id: string
          p_trade_pair: string
          p_trade_side: string
          p_entry_price: number
          p_exit_price: number
          p_trade_size: number
          p_currency?: string
        }
        Returns: Json
      }
      update_wallet_balance: {
        Args: {
          p_user_id: string
          p_currency: string
          p_amount: number
          p_operation: string
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "user" | "admin" | "superadmin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["user", "admin", "superadmin"],
    },
  },
} as const
