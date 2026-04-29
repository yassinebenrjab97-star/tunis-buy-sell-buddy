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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          bid_amount: number
          bidder_email: string
          bidder_id: string
          bidder_name: string
          bidder_phone: string | null
          created_at: string
          currency: string
          id: string
          is_verified_bidder: boolean | null
          listing_id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bid_amount: number
          bidder_email: string
          bidder_id: string
          bidder_name: string
          bidder_phone?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_verified_bidder?: boolean | null
          listing_id: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          bidder_email?: string
          bidder_id?: string
          bidder_name?: string
          bidder_phone?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_verified_bidder?: boolean | null
          listing_id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          area: number | null
          area_unit: string | null
          bid_count: number | null
          bidding_enabled: boolean | null
          city: string
          condition: Database["public"]["Enums"]["condition_type"] | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          current_highest_bid: number | null
          description: string | null
          features: Json | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          lat: number | null
          lng: number | null
          location: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          starting_bid: number | null
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
          year_built: number | null
        }
        Insert: {
          area?: number | null
          area_unit?: string | null
          bid_count?: number | null
          bidding_enabled?: boolean | null
          city: string
          condition?: Database["public"]["Enums"]["condition_type"] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          current_highest_bid?: number | null
          description?: string | null
          features?: Json | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lat?: number | null
          lng?: number | null
          location: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          starting_bid?: number | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
          year_built?: number | null
        }
        Update: {
          area?: number | null
          area_unit?: string | null
          bid_count?: number | null
          bidding_enabled?: boolean | null
          city?: string
          condition?: Database["public"]["Enums"]["condition_type"] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          current_highest_bid?: number | null
          description?: string | null
          features?: Json | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          starting_bid?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
          year_built?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_ratings: {
        Row: {
          created_at: string
          id: string
          rater_id: string
          rating: number
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          rater_id: string
          rating: number
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          rater_id?: string
          rating?: number
          seller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_conversations: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          last_message_at: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          last_message_at?: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          last_message_at?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_conversations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "trusted_shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          media_url: string | null
          message_type: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message_type?: string
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message_type?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "shop_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          price: number
          product_name: string
          shop_id: string
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          price: number
          product_name: string
          shop_id: string
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          price?: number
          product_name?: string
          shop_id?: string
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "trusted_shops"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_shops: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          city: string | null
          contact_email: string
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          logo_url: string | null
          owner_id: string
          rejection_reason: string | null
          shop_description: string | null
          shop_name: string
          status: Database["public"]["Enums"]["shop_status"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          contact_email: string
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          owner_id: string
          rejection_reason?: string | null
          shop_description?: string | null
          shop_name: string
          status?: Database["public"]["Enums"]["shop_status"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          contact_email?: string
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          owner_id?: string
          rejection_reason?: string | null
          shop_description?: string | null
          shop_name?: string
          status?: Database["public"]["Enums"]["shop_status"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      tunisia_app_votes: {
        Row: {
          id: string
          ip_address: string | null
          user_agent: string | null
          voted_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          voted_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          voted_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_verifications: {
        Row: {
          address: string
          cin_number: string
          cin_photo_url: string
          city: string
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          phone_number: string
          postal_code: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address: string
          cin_number: string
          cin_photo_url: string
          city: string
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          id?: string
          phone_number: string
          postal_code?: string | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string
          cin_number?: string
          cin_photo_url?: string
          city?: string
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          phone_number?: string
          postal_code?: string | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_views: { Args: { listing_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      condition_type: "new" | "excellent" | "good" | "fair" | "needs_work"
      property_type: "car" | "building" | "land"
      shop_status: "pending" | "approved" | "rejected" | "suspended"
      user_role: "buyer" | "seller"
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
      app_role: ["admin", "user"],
      condition_type: ["new", "excellent", "good", "fair", "needs_work"],
      property_type: ["car", "building", "land"],
      shop_status: ["pending", "approved", "rejected", "suspended"],
      user_role: ["buyer", "seller"],
    },
  },
} as const
