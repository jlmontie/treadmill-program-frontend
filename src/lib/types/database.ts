/**
 * Database types for Supabase
 * 
 * Generated from schema defined in:
 * athlete-training-database/supabase/migrations/001_initial_schema.sql
 * athlete-training-database/supabase/migrations/003_schema_updates_v2.sql
 * athlete-training-database/supabase/migrations/004_assign_program_rpc.sql
 * 
 * To regenerate from live database (when Supabase CLI connection is available):
 * npx supabase gen types typescript --project-id gsrtyjlsdnmocrdjeypw > src/lib/types/database.ts
 */

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
      athletes: {
        Row: {
          id: string
          name: string
          gender: Database["public"]["Enums"]["gender"]
          sport: string | null
          position: string | null
          birth_date: string | null
          head_size: Database["public"]["Enums"]["equipment_size"] | null
          chest_size: Database["public"]["Enums"]["equipment_size"] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          gender: Database["public"]["Enums"]["gender"]
          sport?: string | null
          position?: string | null
          birth_date?: string | null
          head_size?: Database["public"]["Enums"]["equipment_size"] | null
          chest_size?: Database["public"]["Enums"]["equipment_size"] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          gender?: Database["public"]["Enums"]["gender"]
          sport?: string | null
          position?: string | null
          birth_date?: string | null
          head_size?: Database["public"]["Enums"]["equipment_size"] | null
          chest_size?: Database["public"]["Enums"]["equipment_size"] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      athlete_programs: {
        Row: {
          id: string
          athlete_id: string
          program_id: number
          assigned_by: string
          pretest_session_id: string | null
          start_date: string
          end_date: string | null
          status: Database["public"]["Enums"]["program_status"]
          current_workout_number: number
          use_hr_monitoring: boolean | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          program_id: number
          assigned_by: string
          pretest_session_id?: string | null
          start_date?: string
          end_date?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          current_workout_number?: number
          use_hr_monitoring?: boolean | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          program_id?: number
          assigned_by?: string
          pretest_session_id?: string | null
          start_date?: string
          end_date?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          current_workout_number?: number
          use_hr_monitoring?: boolean | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_programs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_programs_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_programs_pretest_session_id_fkey"
            columns: ["pretest_session_id"]
            isOneToOne: false
            referencedRelation: "pretest_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          }
        ]
      }
      exercise_results: {
        Row: {
          id: string
          workout_session_id: string
          workout_exercise_id: number
          completion_level: Database["public"]["Enums"]["completion_level"]
          speed_column_used: number | null
          actual_speed: number | null
          actual_incline: number | null
          notes: string | null
          completed_at: string
        }
        Insert: {
          id?: string
          workout_session_id: string
          workout_exercise_id: number
          completion_level?: Database["public"]["Enums"]["completion_level"]
          speed_column_used?: number | null
          actual_speed?: number | null
          actual_incline?: number | null
          notes?: string | null
          completed_at?: string
        }
        Update: {
          id?: string
          workout_session_id?: string
          workout_exercise_id?: number
          completion_level?: Database["public"]["Enums"]["completion_level"]
          speed_column_used?: number | null
          actual_speed?: number | null
          actual_incline?: number | null
          notes?: string | null
          completed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_results_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_results_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      metabolic_results: {
        Row: {
          id: string
          pretest_session_id: string
          at_hr: number | null
          max_hr: number | null
          at_max_percent: number | null
          recovery_hr_2min: number | null
          recovery_at_percent: number | null
          recovery_hr: number | null
          recommended_program_id: number | null
          metabolic_category: Database["public"]["Enums"]["metabolic_category"] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pretest_session_id: string
          at_hr?: number | null
          max_hr?: number | null
          at_max_percent?: number | null
          recovery_hr_2min?: number | null
          recovery_at_percent?: number | null
          recovery_hr?: number | null
          recommended_program_id?: number | null
          metabolic_category?: Database["public"]["Enums"]["metabolic_category"] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pretest_session_id?: string
          at_hr?: number | null
          max_hr?: number | null
          at_max_percent?: number | null
          recovery_hr_2min?: number | null
          recovery_at_percent?: number | null
          recovery_hr?: number | null
          recommended_program_id?: number | null
          metabolic_category?: Database["public"]["Enums"]["metabolic_category"] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metabolic_results_pretest_session_id_fkey"
            columns: ["pretest_session_id"]
            isOneToOne: true
            referencedRelation: "pretest_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metabolic_results_recommended_program_id_fkey"
            columns: ["recommended_program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          }
        ]
      }
      pretest_sessions: {
        Row: {
          id: string
          athlete_id: string
          trainer_id: string
          pretest_type_id: number
          session_date: string
          status: Database["public"]["Enums"]["session_status"]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          trainer_id: string
          pretest_type_id: number
          session_date?: string
          status?: Database["public"]["Enums"]["session_status"]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          trainer_id?: string
          pretest_type_id?: number
          session_date?: string
          status?: Database["public"]["Enums"]["session_status"]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pretest_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pretest_sessions_pretest_type_id_fkey"
            columns: ["pretest_type_id"]
            isOneToOne: false
            referencedRelation: "pretest_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pretest_sessions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          }
        ]
      }
      pretest_step_results: {
        Row: {
          id: string
          pretest_session_id: string
          pretest_step_id: number
          completion_level: Database["public"]["Enums"]["completion_level"]
          notes: string | null
          completed_at: string
        }
        Insert: {
          id?: string
          pretest_session_id: string
          pretest_step_id: number
          completion_level?: Database["public"]["Enums"]["completion_level"]
          notes?: string | null
          completed_at?: string
        }
        Update: {
          id?: string
          pretest_session_id?: string
          pretest_step_id?: number
          completion_level?: Database["public"]["Enums"]["completion_level"]
          notes?: string | null
          completed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pretest_step_results_pretest_session_id_fkey"
            columns: ["pretest_session_id"]
            isOneToOne: false
            referencedRelation: "pretest_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pretest_step_results_pretest_step_id_fkey"
            columns: ["pretest_step_id"]
            isOneToOne: false
            referencedRelation: "pretest_steps"
            referencedColumns: ["id"]
          }
        ]
      }
      pretest_steps: {
        Row: {
          id: number
          pretest_type_id: number
          step_number: number
          num_runs: number
          incline: number | null
          speed: number | null
          time_pattern: string | null
          gate_instruction: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          pretest_type_id: number
          step_number: number
          num_runs?: number
          incline?: number | null
          speed?: number | null
          time_pattern?: string | null
          gate_instruction?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          pretest_type_id?: number
          step_number?: number
          num_runs?: number
          incline?: number | null
          speed?: number | null
          time_pattern?: string | null
          gate_instruction?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pretest_steps_pretest_type_id_fkey"
            columns: ["pretest_type_id"]
            isOneToOne: false
            referencedRelation: "pretest_types"
            referencedColumns: ["id"]
          }
        ]
      }
      pretest_types: {
        Row: {
          id: number
          code: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: number
          code: string
          name: string
          athlete_type: string
          level: string
          metabolic_category: Database["public"]["Enums"]["metabolic_category"]
          total_workouts: number
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          athlete_type: string
          level: string
          metabolic_category: Database["public"]["Enums"]["metabolic_category"]
          total_workouts?: number
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          athlete_type?: string
          level?: string
          metabolic_category?: Database["public"]["Enums"]["metabolic_category"]
          total_workouts?: number
          created_at?: string
        }
        Relationships: []
      }
      program_workouts: {
        Row: {
          id: number
          program_id: number
          workout_number: number
          name: string | null
          created_at: string
        }
        Insert: {
          id?: number
          program_id: number
          workout_number: number
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          program_id?: number
          workout_number?: number
          name?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_workouts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          }
        ]
      }
      trainers: {
        Row: {
          id: string
          auth_user_id: string | null
          email: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          email: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          email?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          id: number
          program_workout_id: number
          sequence: number
          num_runs: number
          incline: number | null
          speed_col1: number | null
          speed_col2: number | null
          speed_col3: number | null
          time_pattern: string | null
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          notes: string | null
          is_male_speed: boolean
          created_at: string
        }
        Insert: {
          id?: number
          program_workout_id: number
          sequence: number
          num_runs?: number
          incline?: number | null
          speed_col1?: number | null
          speed_col2?: number | null
          speed_col3?: number | null
          time_pattern?: string | null
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          notes?: string | null
          is_male_speed?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          program_workout_id?: number
          sequence?: number
          num_runs?: number
          incline?: number | null
          speed_col1?: number | null
          speed_col2?: number | null
          speed_col3?: number | null
          time_pattern?: string | null
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          notes?: string | null
          is_male_speed?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_program_workout_id_fkey"
            columns: ["program_workout_id"]
            isOneToOne: false
            referencedRelation: "program_workouts"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_sessions: {
        Row: {
          id: string
          athlete_program_id: string
          program_workout_id: number
          trainer_id: string
          scheduled_date: string | null
          started_at: string | null
          completed_at: string | null
          status: Database["public"]["Enums"]["session_status"]
          session_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          athlete_program_id: string
          program_workout_id: number
          trainer_id: string
          scheduled_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          session_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          athlete_program_id?: string
          program_workout_id?: number
          trainer_id?: string
          scheduled_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          session_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_athlete_program_id_fkey"
            columns: ["athlete_program_id"]
            isOneToOne: false
            referencedRelation: "athlete_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_program_workout_id_fkey"
            columns: ["program_workout_id"]
            isOneToOne: false
            referencedRelation: "program_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_program_to_athlete: {
        Args: {
          p_athlete_id: string
          p_program_id: number
          p_trainer_id: string
          p_pretest_session_id?: string | null
          p_use_hr_monitoring?: boolean
          p_notes?: string | null
        }
        Returns: {
          new_program_id: string
          paused_program_id: string
        }[]
      }
      calculate_recovery_hr: {
        Args: {
          p_recovery_at_percent: number
          p_max_hr: number
        }
        Returns: number
      }
    }
    Enums: {
      completion_level: "complete" | "slight_touch" | "push" | "failure"
      session_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      program_status: "active" | "completed" | "paused" | "cancelled"
      gender: "male" | "female"
      equipment_size: "small" | "medium" | "large"
      exercise_type:
        | "run"
        | "hold"
        | "run_hold"
        | "run_hold_run"
        | "run_rest_run"
        | "box_runs"
        | "speedwork"
        | "hip_flexion"
        | "hip_extension"
      metabolic_category: "la" | "standard" | "low"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier access
type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// ============================================================================
// Convenience Type Aliases (Row types)
// ============================================================================

export type Athlete = Tables<"athletes">
export type AthleteProgram = Tables<"athlete_programs">
export type ExerciseResult = Tables<"exercise_results">
export type MetabolicResult = Tables<"metabolic_results">
export type PretestSession = Tables<"pretest_sessions">
export type PretestStepResult = Tables<"pretest_step_results">
export type PretestStep = Tables<"pretest_steps">
export type PretestType = Tables<"pretest_types">
export type Program = Tables<"programs">
export type ProgramWorkout = Tables<"program_workouts">
export type Trainer = Tables<"trainers">
export type WorkoutExercise = Tables<"workout_exercises">
export type WorkoutSession = Tables<"workout_sessions">

// ============================================================================
// Insert Type Aliases
// ============================================================================

export type AthleteInsert = TablesInsert<"athletes">
export type AthleteProgramInsert = TablesInsert<"athlete_programs">
export type ExerciseResultInsert = TablesInsert<"exercise_results">
export type MetabolicResultInsert = TablesInsert<"metabolic_results">
export type PretestSessionInsert = TablesInsert<"pretest_sessions">
export type PretestStepResultInsert = TablesInsert<"pretest_step_results">
export type WorkoutSessionInsert = TablesInsert<"workout_sessions">

// ============================================================================
// Enum Type Aliases
// ============================================================================

export type CompletionLevel = Enums<"completion_level">
export type SessionStatus = Enums<"session_status">
export type ProgramStatus = Enums<"program_status">
export type Gender = Enums<"gender">
export type EquipmentSize = Enums<"equipment_size">
export type ExerciseType = Enums<"exercise_type">
export type MetabolicCategory = Enums<"metabolic_category">
