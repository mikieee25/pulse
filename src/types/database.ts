export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          actor_email: string;
          actor_name: string;
          actor_user_id: string;
          created_at: string;
          division_id: string | null;
          division_name: string | null;
          entity_id: string | null;
          entity_label: string;
          entity_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_email: string;
          actor_name: string;
          actor_user_id: string;
          created_at?: string;
          division_id?: string | null;
          division_name?: string | null;
          entity_id?: string | null;
          entity_label: string;
          entity_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_email?: string;
          actor_name?: string;
          actor_user_id?: string;
          created_at?: string;
          division_id?: string | null;
          division_name?: string | null;
          entity_id?: string | null;
          entity_label?: string;
          entity_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      app_users: {
        Row: {
          division_scope: string | null;
          email: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          division_scope?: string | null;
          email: string;
          full_name: string;
          id: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          division_scope?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [
          {
            foreignKeyName: "app_users_division_scope_fkey";
            columns: ["division_scope"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
        ];
      };
      assignment_history: {
        Row: {
          assigned_at: string;
          assignment_type: string;
          equipment_id: string;
          id: string;
          note: string | null;
          personnel_id: string;
          unassigned_at: string | null;
        };
        Insert: {
          assigned_at?: string;
          assignment_type?: string;
          equipment_id: string;
          id?: string;
          note?: string | null;
          personnel_id: string;
          unassigned_at?: string | null;
        };
        Update: {
          assigned_at?: string;
          assignment_type?: string;
          equipment_id?: string;
          id?: string;
          note?: string | null;
          personnel_id?: string;
          unassigned_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assignment_history_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_history_personnel_id_fkey";
            columns: ["personnel_id"];
            isOneToOne: false;
            referencedRelation: "personnel";
            referencedColumns: ["id"];
          },
        ];
      };
      category_unit_costs: {
        Row: {
          category_id: string;
          id: string;
          unit_cost: number;
          year: number;
        };
        Insert: {
          category_id: string;
          id?: string;
          unit_cost: number;
          year: number;
        };
        Update: {
          category_id?: string;
          id?: string;
          unit_cost?: number;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "category_unit_costs_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "equipment_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      divisions: {
        Row: {
          code: string;
          full_name: string;
          id: string;
        };
        Insert: {
          code: string;
          full_name: string;
          id?: string;
        };
        Update: {
          code?: string;
          full_name?: string;
          id?: string;
        };
        Relationships: [];
      };
      equipment: {
        Row: {
          assigned_to: string | null;
          assignee_id: string | null;
          brand: string | null;
          category_id: string;
          condition_state: string;
          created_at: string | null;
          division_id: string;
          id: string;
          is_rts: boolean;
          model: string | null;
          procurement_method: string | null;
          remarks: string | null;
          serial_number: string | null;
          status: Database["public"]["Enums"]["equipment_status"];
          year_acquired: number | null;
        };
        Insert: {
          assigned_to?: string | null;
          assignee_id?: string | null;
          brand?: string | null;
          category_id: string;
          condition_state?: string;
          created_at?: string | null;
          division_id: string;
          id?: string;
          is_rts?: boolean;
          model?: string | null;
          procurement_method?: string | null;
          remarks?: string | null;
          serial_number?: string | null;
          status?: Database["public"]["Enums"]["equipment_status"];
          year_acquired?: number | null;
        };
        Update: {
          assigned_to?: string | null;
          assignee_id?: string | null;
          brand?: string | null;
          category_id?: string;
          condition_state?: string;
          created_at?: string | null;
          division_id?: string;
          id?: string;
          is_rts?: boolean;
          model?: string | null;
          procurement_method?: string | null;
          remarks?: string | null;
          serial_number?: string | null;
          status?: Database["public"]["Enums"]["equipment_status"];
          year_acquired?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "personnel";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "personnel";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "equipment_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_division_id_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment_categories: {
        Row: {
          id: string;
          lifespan_years: number | null;
          name: string;
        };
        Insert: {
          id?: string;
          lifespan_years?: number | null;
          name: string;
        };
        Update: {
          id?: string;
          lifespan_years?: number | null;
          name?: string;
        };
        Relationships: [];
      };
      personnel: {
        Row: {
          division_id: string;
          full_name: string;
          id: string;
          initials: string;
          plantilla_status: Database["public"]["Enums"]["plantilla_status"];
          position: string;
        };
        Insert: {
          division_id: string;
          full_name: string;
          id?: string;
          initials: string;
          plantilla_status?: Database["public"]["Enums"]["plantilla_status"];
          position: string;
        };
        Update: {
          division_id?: string;
          full_name?: string;
          id?: string;
          initials?: string;
          plantilla_status?: Database["public"]["Enums"]["plantilla_status"];
          position?: string;
        };
        Relationships: [
          {
            foreignKeyName: "personnel_division_id_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_presence: {
        Row: {
          last_seen_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          last_seen_at: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          last_seen_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      pulse_division_summary: {
        Args: { p_as_of?: string };
        Returns: {
          code: string;
          equipment_count: number;
          full_name: string;
          id: string;
          personnel_count: number;
          replacement_count: number;
        }[];
      };
      pulse_effective_equipment_status: {
        Args: {
          p_as_of: string;
          p_condition: string;
          p_lifespan_years: number;
          p_status: Database["public"]["Enums"]["equipment_status"];
          p_year_acquired: number;
        };
        Returns: string;
      };
      pulse_equipment_category_snapshot: {
        Args: {
          p_as_of?: string;
          p_category: string;
          p_division_scope?: string;
        };
        Returns: Json;
      };
      pulse_inventory_dashboard: {
        Args: { p_as_of?: string; p_division_scope?: string };
        Returns: Json;
      };
      pulse_inventory_plan: {
        Args: { p_division_scope: string; p_mode: string; p_year: number };
        Returns: {
          category_id: string;
          category_name: string;
          division_code: string;
          subtotal: number;
          unit_cost: number;
          unit_count: number;
        }[];
      };
      pulse_notification_snapshot: {
        Args: { p_as_of?: string; p_division_scope?: string };
        Returns: Json;
      };
      pulse_personnel_summary: { Args: never; Returns: Json };
      pulse_search_equipment: {
        Args: {
          p_assignment?: string;
          p_brand?: string;
          p_category?: string;
          p_division?: string;
          p_page?: number;
          p_page_size?: number;
          p_query?: string;
          p_rts?: string;
          p_status?: string;
        };
        Returns: {
          assignee_name: string;
          brand: string;
          category_name: string;
          condition_state: string;
          custodian_name: string;
          display_status: string;
          division_code: string;
          id: string;
          is_rts: boolean;
          lifespan_years: number;
          model: string;
          serial_number: string;
          status: Database["public"]["Enums"]["equipment_status"];
          total_count: number;
          year_acquired: number;
        }[];
      };
      pulse_search_personnel: {
        Args: {
          p_assignment?: string;
          p_division?: string;
          p_page?: number;
          p_page_size?: number;
          p_query?: string;
          p_status?: string;
        };
        Returns: {
          division_code: string;
          division_id: string;
          equipment_count: number;
          full_name: string;
          id: string;
          initials: string;
          plantilla_status: Database["public"]["Enums"]["plantilla_status"];
          position: string;
          total_count: number;
        }[];
      };
      reassign_equipment: {
        Args: {
          p_equipment_id: string;
          p_note?: string;
          p_personnel_id: string;
          p_type?: string;
        };
        Returns: undefined;
      };
      delete_equipment: {
        Args: { p_equipment_id: string };
        Returns: Json;
      };
      retire_equipment: {
        Args: { p_equipment_id: string };
        Returns: undefined;
      };
      set_equipment_rts: {
        Args: { p_equipment_id: string; p_is_rts: boolean };
        Returns: boolean;
      };
      save_equipment: {
        Args: {
          p_assigned_to: string;
          p_assignee_id: string;
          p_brand: string;
          p_category_id: string;
          p_condition_state: string;
          p_division_id: string;
          p_equipment_id: string;
          p_model: string;
          p_procurement_method: string;
          p_remarks: string;
          p_serial_number: string;
          p_year_acquired: number;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: "Admin" | "Viewer";
      equipment_status: "Active" | "For Replacement" | "Retired";
      plantilla_status:
        | "Regular"
        | "COS"
        | "Outsourced"
        | "Reserve"
        | "For Transfer"
        | "For RTS";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
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
      app_role: ["Admin", "Viewer"],
      equipment_status: ["Active", "For Replacement", "Retired"],
      plantilla_status: [
        "Regular",
        "COS",
        "Outsourced",
        "Reserve",
        "For Transfer",
        "For RTS",
      ],
    },
  },
} as const;
