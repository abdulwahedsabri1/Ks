export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string;
          device: string | null;
          event_type: string;
          id: string;
          item_id: string | null;
          shop_id: string;
        };
        Insert: {
          created_at?: string;
          device?: string | null;
          event_type?: string;
          id?: string;
          item_id?: string | null;
          shop_id: string;
        };
        Update: {
          created_at?: string;
          device?: string | null;
          event_type?: string;
          id?: string;
          item_id?: string | null;
          shop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          position: number;
          shop_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          position?: number;
          shop_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          position?: number;
          shop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_items: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          discount_price: number | null;
          id: string;
          image_url: string | null;
          is_available: boolean;
          is_bestseller: boolean;
          is_veg: boolean;
          name: string;
          position: number;
          price: number;
          shop_id: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          discount_price?: number | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          is_bestseller?: boolean;
          is_veg?: boolean;
          name: string;
          position?: number;
          price?: number;
          shop_id: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          discount_price?: number | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          is_bestseller?: boolean;
          is_veg?: boolean;
          name?: string;
          position?: number;
          price?: number;
          shop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      shops: {
        Row: {
          address: string | null;
          amount_paid: number;
          auto_renew: boolean;
          billing_cycle: string;
          cover_url: string | null;
          created_at: string;
          currency: string;
          description: string | null;
          features: Json;
          grace_period_days: number;
          id: string;
          logo_url: string | null;
          name: string;
          next_billing_date: string | null;
          niche: string;
          owner_id: string;
          payment_status: string;
          phone: string | null;
          plan: string;
          plan_expires_at: string | null;
          plan_started_at: string;
          slug: string;
          status: string;
          tagline: string | null;
          theme_color: string;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          address?: string | null;
          amount_paid?: number;
          auto_renew?: boolean;
          billing_cycle?: string;
          cover_url?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          features?: Json;
          grace_period_days?: number;
          id?: string;
          logo_url?: string | null;
          name: string;
          next_billing_date?: string | null;
          niche?: string;
          owner_id: string;
          payment_status?: string;
          phone?: string | null;
          plan?: string;
          plan_expires_at?: string | null;
          plan_started_at?: string;
          slug: string;
          status?: string;
          tagline?: string | null;
          theme_color?: string;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          address?: string | null;
          amount_paid?: number;
          auto_renew?: boolean;
          billing_cycle?: string;
          cover_url?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          features?: Json;
          grace_period_days?: number;
          id?: string;
          logo_url?: string | null;
          name?: string;
          next_billing_date?: string | null;
          niche?: string;
          owner_id?: string;
          payment_status?: string;
          phone?: string | null;
          plan?: string;
          plan_expires_at?: string | null;
          plan_started_at?: string;
          slug?: string;
          status?: string;
          tagline?: string | null;
          theme_color?: string;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      subscription_history: {
        Row: {
          id: string;
          shop_id: string;
          action: string;
          previous_value: string | null;
          new_value: string | null;
          performed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          action: string;
          previous_value?: string | null;
          new_value?: string | null;
          performed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          action?: string;
          previous_value?: string | null;
          new_value?: string | null;
          performed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_history_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_history: {
        Row: {
          id: string;
          shop_id: string;
          invoice_id: string;
          amount: number;
          plan: string;
          billing_cycle: string;
          payment_status: string;
          payment_method: string | null;
          transaction_id: string | null;
          payment_date: string | null;
          due_date: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          invoice_id?: string;
          amount?: number;
          plan?: string;
          billing_cycle?: string;
          payment_status?: string;
          payment_method?: string | null;
          transaction_id?: string | null;
          payment_date?: string | null;
          due_date?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          invoice_id?: string;
          amount?: number;
          plan?: string;
          billing_cycle?: string;
          payment_status?: string;
          payment_method?: string | null;
          transaction_id?: string | null;
          payment_date?: string | null;
          due_date?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_history_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          plan_name: string;
          amount: number;
          business_name: string;
          owner_name: string;
          mobile: string;
          whatsapp: string;
          email: string;
          city: string;
          state: string;
          category: string;
          business_address: string | null;
          website: string | null;
          screenshot_url: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_name: string;
          amount: number;
          business_name: string;
          owner_name: string;
          mobile: string;
          whatsapp: string;
          email: string;
          city: string;
          state: string;
          category: string;
          business_address?: string | null;
          website?: string | null;
          screenshot_url: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_name?: string;
          amount?: number;
          business_name?: string;
          owner_name?: string;
          mobile?: string;
          whatsapp?: string;
          email?: string;
          city?: string;
          state?: string;
          category?: string;
          business_address?: string | null;
          website?: string | null;
          screenshot_url?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          role: string;
          shop_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          role?: string;
          shop_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          role?: string;
          shop_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      owns_shop: { Args: { _shop_id: string }; Returns: boolean };
      shop_is_active: { Args: { _shop_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "owner";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "owner"],
    },
  },
} as const;
