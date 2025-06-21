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
      bank_cards: {
        Row: {
          bank_address: string
          bank_name: string
          bank_number: string
          created_at: string
          id: string
          is_default: boolean | null
          payee_address: string
          payee_name: string
          swift_code: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          bank_address: string
          bank_name: string
          bank_number: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          payee_address: string
          payee_name: string
          swift_code: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          bank_address?: string
          bank_name?: string
          bank_number?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          payee_address?: string
          payee_name?: string
          swift_code?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
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
      deposit_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          network: string
          status: string
          transaction_screenshot_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency: string
          id?: string
          network: string
          status?: string
          transaction_screenshot_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          network?: string
          status?: string
          transaction_screenshot_url?: string | null
          updated_at?: string
          user_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          kyc_status: string | null
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          kyc_status?: string | null
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          kyc_status?: string | null
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          bank_card_id: string
          created_at: string
          currency: string
          id: string
          network: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          bank_card_id: string
          created_at?: string
          currency: string
          id?: string
          network: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          bank_card_id?: string
          created_at?: string
          currency?: string
          id?: string
          network?: string
          status?: string
          updated_at?: string
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
    Enums: {},
  },
} as const
