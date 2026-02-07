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
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          mode: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_challenges: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          hints: Json | null
          id: string
          skill_id: string
          solution: string | null
          starter_code: string | null
          test_cases: Json
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty: string
          hints?: Json | null
          id?: string
          skill_id: string
          solution?: string | null
          starter_code?: string | null
          test_cases: Json
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          hints?: Json | null
          id?: string
          skill_id?: string
          solution?: string | null
          starter_code?: string | null
          test_cases?: Json
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_challenges_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_analyses: {
        Row: {
          created_at: string
          cv_text: string | null
          education_score: number | null
          experience_score: number | null
          extracted_skills: Json | null
          file_name: string
          file_url: string | null
          format_score: number | null
          id: string
          language_score: number | null
          overall_score: number | null
          skills_score: number | null
          strengths: Json | null
          suggestions: Json | null
          user_id: string
          weaknesses: Json | null
        }
        Insert: {
          created_at?: string
          cv_text?: string | null
          education_score?: number | null
          experience_score?: number | null
          extracted_skills?: Json | null
          file_name: string
          file_url?: string | null
          format_score?: number | null
          id?: string
          language_score?: number | null
          overall_score?: number | null
          skills_score?: number | null
          strengths?: Json | null
          suggestions?: Json | null
          user_id: string
          weaknesses?: Json | null
        }
        Update: {
          created_at?: string
          cv_text?: string | null
          education_score?: number | null
          experience_score?: number | null
          extracted_skills?: Json | null
          file_name?: string
          file_url?: string | null
          format_score?: number | null
          id?: string
          language_score?: number | null
          overall_score?: number | null
          skills_score?: number | null
          strengths?: Json | null
          suggestions?: Json | null
          user_id?: string
          weaknesses?: Json | null
        }
        Relationships: []
      }
      github_analyses: {
        Row: {
          activity_score: number | null
          avatar_url: string | null
          bio: string | null
          contribution_score: number | null
          created_at: string
          detected_skills: Json | null
          diversity_score: number | null
          followers: number | null
          following: number | null
          github_username: string
          id: string
          languages: Json | null
          overall_score: number | null
          profile_url: string | null
          public_repos: number | null
          strengths: Json | null
          suggestions: Json | null
          top_repos: Json | null
          user_id: string
        }
        Insert: {
          activity_score?: number | null
          avatar_url?: string | null
          bio?: string | null
          contribution_score?: number | null
          created_at?: string
          detected_skills?: Json | null
          diversity_score?: number | null
          followers?: number | null
          following?: number | null
          github_username: string
          id?: string
          languages?: Json | null
          overall_score?: number | null
          profile_url?: string | null
          public_repos?: number | null
          strengths?: Json | null
          suggestions?: Json | null
          top_repos?: Json | null
          user_id: string
        }
        Update: {
          activity_score?: number | null
          avatar_url?: string | null
          bio?: string | null
          contribution_score?: number | null
          created_at?: string
          detected_skills?: Json | null
          diversity_score?: number | null
          followers?: number | null
          following?: number | null
          github_username?: string
          id?: string
          languages?: Json | null
          overall_score?: number | null
          profile_url?: string | null
          public_repos?: number | null
          strengths?: Json | null
          suggestions?: Json | null
          top_repos?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      learning_resources: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string
          estimated_hours: number | null
          id: string
          is_free: boolean | null
          provider: string | null
          resource_type: string
          skill_id: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level: string
          estimated_hours?: number | null
          id?: string
          is_free?: boolean | null
          provider?: string | null
          resource_type: string
          skill_id: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string
          estimated_hours?: number | null
          id?: string
          is_free?: boolean | null
          provider?: string | null
          resource_type?: string
          skill_id?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_resources_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          display_name: string | null
          github_username: string | null
          id: string
          job_title: string | null
          linkedin_url: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          github_username?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          github_username?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      project_skills: {
        Row: {
          depth_level: string
          id: string
          project_id: string
          skill_id: string
        }
        Insert: {
          depth_level: string
          id?: string
          project_id: string
          skill_id: string
        }
        Update: {
          depth_level?: string
          id?: string
          project_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_skills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      role_skill_requirements: {
        Row: {
          id: string
          importance: string
          required_level: number
          role_id: string
          skill_id: string
        }
        Insert: {
          id?: string
          importance: string
          required_level: number
          role_id: string
          skill_id: string
        }
        Update: {
          id?: string
          importance?: string
          required_level?: number
          role_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_skill_requirements_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "target_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_skill_requirements_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_questions: {
        Row: {
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          options: Json
          question: string
          skill_id: string
        }
        Insert: {
          created_at?: string
          difficulty: string
          explanation?: string | null
          id?: string
          options: Json
          question: string
          skill_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_questions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      target_roles: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_assessment_attempts: {
        Row: {
          completed_at: string
          correct_answers: number
          id: string
          questions_answered: number
          score: number
          skill_id: string
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          correct_answers: number
          id?: string
          questions_answered: number
          score: number
          skill_id: string
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          correct_answers?: number
          id?: string
          questions_answered?: number
          score?: number
          skill_id?: string
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_assessment_attempts_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_attempts: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          is_completed: boolean | null
          passed_tests: number
          submitted_code: string
          time_taken_seconds: number | null
          total_tests: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          is_completed?: boolean | null
          passed_tests: number
          submitted_code: string
          time_taken_seconds?: number | null
          total_tests: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          is_completed?: boolean | null
          passed_tests?: number
          submitted_code?: string
          time_taken_seconds?: number | null
          total_tests?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "coding_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          github_url: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roadmaps: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          roadmap_data: Json
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          roadmap_data: Json
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          roadmap_data?: Json
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roadmaps_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "target_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          assessment_score: number | null
          confidence_score: number
          contribution_score: number | null
          created_at: string
          id: string
          last_used_at: string | null
          projects_score: number | null
          skill_id: string
          time_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_score?: number | null
          confidence_score?: number
          contribution_score?: number | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          projects_score?: number | null
          skill_id: string
          time_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_score?: number | null
          confidence_score?: number
          contribution_score?: number | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          projects_score?: number | null
          skill_id?: string
          time_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_target_roles: {
        Row: {
          created_at: string
          fit_score: number | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fit_score?: number | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          fit_score?: number | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_target_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "target_roles"
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
    Enums: {},
  },
} as const
