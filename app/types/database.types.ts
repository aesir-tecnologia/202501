export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      daily_summaries: {
        Row: {
          completed_at: string
          date: string
          id: string
          project_breakdown: Json
          total_focus_seconds: number
          total_pause_seconds: number
          total_stints: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          date: string
          id?: string
          project_breakdown?: Json
          total_focus_seconds?: number
          total_pause_seconds?: number
          total_stints?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          date?: string
          id?: string
          project_breakdown?: Json
          total_focus_seconds?: number
          total_pause_seconds?: number
          total_stints?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          color_tag: string | null
          created_at: string | null
          custom_stint_duration: number | null
          expected_daily_stints: number | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color_tag?: string | null
          created_at?: string | null
          custom_stint_duration?: number | null
          expected_daily_stints?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          color_tag?: string | null
          created_at?: string | null
          custom_stint_duration?: number | null
          expected_daily_stints?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stints: {
        Row: {
          actual_duration: number | null
          completion_type: Database["public"]["Enums"]["completion_type"] | null
          created_at: string | null
          ended_at: string | null
          id: string
          notes: string | null
          paused_at: string | null
          paused_duration: number
          planned_duration: number
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["stint_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_duration?: number | null
          completion_type?:
            | Database["public"]["Enums"]["completion_type"]
            | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          paused_at?: string | null
          paused_duration?: number
          planned_duration: number
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["stint_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_duration?: number | null
          completion_type?:
            | Database["public"]["Enums"]["completion_type"]
            | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          paused_at?: string | null
          paused_duration?: number
          planned_duration?: number
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["stint_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          timezone: string
          updated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          timezone?: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          timezone?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_streak: number
          last_stint_date: string | null
          longest_streak: number
          streak_updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_stint_date?: string | null
          longest_streak?: number
          streak_updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_stint_date?: string | null
          longest_streak?: number
          streak_updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_daily_summary: {
        Args: { p_date: string; p_user_id: string }
        Returns: Json
      }
      auto_complete_expired_stints: {
        Args: never
        Returns: {
          completed_count: number
          completed_stint_ids: string[]
          error_count: number
        }[]
      }
      calculate_actual_duration: {
        Args: {
          p_ended_at: string
          p_paused_duration: number
          p_started_at: string
        }
        Returns: number
      }
      calculate_streak: { Args: { p_user_id: string }; Returns: number }
      calculate_streak_with_tz: {
        Args: { p_timezone?: string; p_user_id: string }
        Returns: {
          current_streak: number
          is_at_risk: boolean
          last_stint_date: string
          longest_streak: number
        }[]
      }
      complete_stint: {
        Args: {
          p_completion_type: Database["public"]["Enums"]["completion_type"]
          p_notes?: string
          p_stint_id: string
        }
        Returns: {
          actual_duration: number | null
          completion_type: Database["public"]["Enums"]["completion_type"] | null
          created_at: string | null
          ended_at: string | null
          id: string
          notes: string | null
          paused_at: string | null
          paused_duration: number
          planned_duration: number
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["stint_status"]
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "stints"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_active_stint: {
        Args: { p_user_id: string }
        Returns: {
          actual_duration: number | null
          completion_type: Database["public"]["Enums"]["completion_type"] | null
          created_at: string | null
          ended_at: string | null
          id: string
          notes: string | null
          paused_at: string | null
          paused_duration: number
          planned_duration: number
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["stint_status"]
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "stints"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_daily_summaries: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          completed_at: string
          date: string
          id: string
          project_breakdown: Json
          total_focus_seconds: number
          total_pause_seconds: number
          total_stints: number
        }[]
      }
      increment_user_version: { Args: { p_user_id: string }; Returns: number }
      pause_stint: {
        Args: { p_stint_id: string }
        Returns: {
          actual_duration: number | null
          completion_type: Database["public"]["Enums"]["completion_type"] | null
          created_at: string | null
          ended_at: string | null
          id: string
          notes: string | null
          paused_at: string | null
          paused_duration: number
          planned_duration: number
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["stint_status"]
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "stints"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      process_daily_reset: {
        Args: never
        Returns: {
          errors: Json
          streaks_updated: number
          summaries_created: number
          users_processed: number
        }[]
      }
      resume_stint: {
        Args: { p_stint_id: string }
        Returns: {
          actual_duration: number | null
          completion_type: Database["public"]["Enums"]["completion_type"] | null
          created_at: string | null
          ended_at: string | null
          id: string
          notes: string | null
          paused_at: string | null
          paused_duration: number
          planned_duration: number
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["stint_status"]
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "stints"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_streak: {
        Args: { p_timezone?: string; p_user_id: string }
        Returns: {
          current_streak: number
          is_at_risk: boolean
          last_stint_date: string
          longest_streak: number
        }[]
      }
      validate_stint_start: {
        Args: { p_project_id: string; p_user_id: string; p_version: number }
        Returns: {
          can_start: boolean
          conflict_message: string
          existing_stint_id: string
        }[]
      }
    }
    Enums: {
      completion_type: "manual" | "auto" | "interrupted"
      stint_status: "active" | "paused" | "completed" | "interrupted"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      completion_type: ["manual", "auto", "interrupted"],
      stint_status: ["active", "paused", "completed", "interrupted"],
    },
  },
} as const

