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
      answers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_id: string
          value_json: Json | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_id: string
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          display_name: string | null
          fingerprint: string | null
          id: string
          poll_id: string
          status: Database["public"]["Enums"]["comment_status"]
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          display_name?: string | null
          fingerprint?: string | null
          id?: string
          poll_id: string
          status?: Database["public"]["Enums"]["comment_status"]
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string | null
          fingerprint?: string | null
          id?: string
          poll_id?: string
          status?: Database["public"]["Enums"]["comment_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          created_at: string
          id: string
          label: string
          position: number
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          position?: number
          question_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_views: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          poll_id: string
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          poll_id: string
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_views_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_comments: boolean
          close_after_responses: number | null
          created_at: string
          created_by_user_id: string | null
          creator_key_hash: string | null
          description: string | null
          id: string
          open_until: string | null
          preview_image_url: string | null
          slug: string
          status: Database["public"]["Enums"]["poll_status"]
          title: string
          updated_at: string
          visibility_mode: Database["public"]["Enums"]["visibility_mode"]
        }
        Insert: {
          allow_comments?: boolean
          close_after_responses?: number | null
          created_at?: string
          created_by_user_id?: string | null
          creator_key_hash?: string | null
          description?: string | null
          id?: string
          open_until?: string | null
          preview_image_url?: string | null
          slug: string
          status?: Database["public"]["Enums"]["poll_status"]
          title: string
          updated_at?: string
          visibility_mode?: Database["public"]["Enums"]["visibility_mode"]
        }
        Update: {
          allow_comments?: boolean
          close_after_responses?: number | null
          created_at?: string
          created_by_user_id?: string | null
          creator_key_hash?: string | null
          description?: string | null
          id?: string
          open_until?: string | null
          preview_image_url?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["poll_status"]
          title?: string
          updated_at?: string
          visibility_mode?: Database["public"]["Enums"]["visibility_mode"]
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          poll_id: string
          position: number
          prompt: string
          settings_json: Json | null
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          poll_id: string
          position?: number
          prompt: string
          settings_json?: Json | null
          type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          poll_id?: string
          position?: number
          prompt?: string
          settings_json?: Json | null
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          created_at: string
          fingerprint: string | null
          id: string
          poll_id: string
          respondent_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          fingerprint?: string | null
          id?: string
          poll_id: string
          respondent_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          fingerprint?: string | null
          id?: string
          poll_id?: string
          respondent_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          admin_note: string | null
          comment_id: string | null
          created_at: string
          id: string
          message: string | null
          poll_id: string | null
          resolved_at: string | null
          status: string
          type: string
        }
        Insert: {
          admin_note?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          poll_id?: string | null
          resolved_at?: string | null
          status?: string
          type: string
        }
        Update: {
          admin_note?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          poll_id?: string | null
          resolved_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      comments_public: {
        Row: {
          body: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          poll_id: string | null
          status: Database["public"]["Enums"]["comment_status"] | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          poll_id?: string | null
          status?: Database["public"]["Enums"]["comment_status"] | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          poll_id?: string | null
          status?: Database["public"]["Enums"]["comment_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      responses_public: {
        Row: {
          created_at: string | null
          id: string | null
          poll_id: string | null
          respondent_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          poll_id?: string | null
          respondent_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          poll_id?: string | null
          respondent_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_poll_slug: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_anonymous_poll: {
        Args: {
          _allow_comments?: boolean
          _creator_key_hash: string
          _description?: string
          _poll_id: string
          _status?: Database["public"]["Enums"]["poll_status"]
          _title?: string
          _visibility_mode?: Database["public"]["Enums"]["visibility_mode"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      comment_status: "visible" | "hidden" | "flagged"
      poll_status: "draft" | "open" | "closed"
      question_type:
        | "single_choice"
        | "multiple_choice"
        | "rating"
        | "nps"
        | "ranking"
        | "short_text"
        | "emoji"
      visibility_mode: "public" | "unlisted" | "voters" | "private"
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
      comment_status: ["visible", "hidden", "flagged"],
      poll_status: ["draft", "open", "closed"],
      question_type: [
        "single_choice",
        "multiple_choice",
        "rating",
        "nps",
        "ranking",
        "short_text",
        "emoji",
      ],
      visibility_mode: ["public", "unlisted", "voters", "private"],
    },
  },
} as const
