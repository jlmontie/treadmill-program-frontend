/**
 * Database types for Supabase
 * 
 * These types are based on the schema defined in:
 * athlete-training-database/supabase/migrations/001_initial_schema.sql
 * 
 * In production, you should generate these using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.ts
 */

// Enum types matching PostgreSQL enums
export type CompletionLevel = 'complete' | 'slight_touch' | 'push' | 'failure'
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type ProgramStatus = 'active' | 'completed' | 'paused' | 'cancelled'
export type Gender = 'male' | 'female'
export type ExerciseType = 
  | 'run' 
  | 'hold' 
  | 'run_hold' 
  | 'run_hold_run' 
  | 'run_rest_run' 
  | 'box_runs' 
  | 'speedwork' 
  | 'hip_flexion' 
  | 'hip_extension'
export type MetabolicCategory = 'la' | 'standard' | 'low'

export type Database = {
  public: {
    Tables: {
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
      }
      athletes: {
        Row: {
          id: string
          name: string
          gender: Gender
          sport: string | null
          position: string | null
          birth_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          gender: Gender
          sport?: string | null
          position?: string | null
          birth_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          gender?: Gender
          sport?: string | null
          position?: string | null
          birth_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
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
      }
      programs: {
        Row: {
          id: number
          code: string
          name: string
          athlete_type: string
          level: string
          metabolic_category: MetabolicCategory
          total_workouts: number
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          athlete_type: string
          level: string
          metabolic_category: MetabolicCategory
          total_workouts?: number
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          athlete_type?: string
          level?: string
          metabolic_category?: MetabolicCategory
          total_workouts?: number
          created_at?: string
        }
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
          exercise_type: ExerciseType
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
          exercise_type?: ExerciseType
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
          exercise_type?: ExerciseType
          notes?: string | null
          is_male_speed?: boolean
          created_at?: string
        }
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
      }
      pretest_sessions: {
        Row: {
          id: string
          athlete_id: string
          trainer_id: string
          pretest_type_id: number
          session_date: string
          status: SessionStatus
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
          status?: SessionStatus
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
          status?: SessionStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pretest_step_results: {
        Row: {
          id: string
          pretest_session_id: string
          pretest_step_id: number
          completion_level: CompletionLevel
          notes: string | null
          completed_at: string
        }
        Insert: {
          id?: string
          pretest_session_id: string
          pretest_step_id: number
          completion_level?: CompletionLevel
          notes?: string | null
          completed_at?: string
        }
        Update: {
          id?: string
          pretest_session_id?: string
          pretest_step_id?: number
          completion_level?: CompletionLevel
          notes?: string | null
          completed_at?: string
        }
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
          recommended_program_id: number | null
          metabolic_category: MetabolicCategory | null
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
          recommended_program_id?: number | null
          metabolic_category?: MetabolicCategory | null
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
          recommended_program_id?: number | null
          metabolic_category?: MetabolicCategory | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
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
          status: ProgramStatus
          current_workout_number: number
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
          status?: ProgramStatus
          current_workout_number?: number
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
          status?: ProgramStatus
          current_workout_number?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
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
          status: SessionStatus
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
          status?: SessionStatus
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
          status?: SessionStatus
          session_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exercise_results: {
        Row: {
          id: string
          workout_session_id: string
          workout_exercise_id: number
          completion_level: CompletionLevel
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
          completion_level?: CompletionLevel
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
          completion_level?: CompletionLevel
          speed_column_used?: number | null
          actual_speed?: number | null
          actual_incline?: number | null
          notes?: string | null
          completed_at?: string
        }
      }
    }
    Enums: {
      completion_level: CompletionLevel
      session_status: SessionStatus
      program_status: ProgramStatus
      gender: Gender
      exercise_type: ExerciseType
      metabolic_category: MetabolicCategory
    }
  }
}

// Convenience type aliases
export type Trainer = Database['public']['Tables']['trainers']['Row']
export type Athlete = Database['public']['Tables']['athletes']['Row']
export type PretestType = Database['public']['Tables']['pretest_types']['Row']
export type Program = Database['public']['Tables']['programs']['Row']
export type ProgramWorkout = Database['public']['Tables']['program_workouts']['Row']
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row']
export type PretestStep = Database['public']['Tables']['pretest_steps']['Row']
export type PretestSession = Database['public']['Tables']['pretest_sessions']['Row']
export type PretestStepResult = Database['public']['Tables']['pretest_step_results']['Row']
export type MetabolicResult = Database['public']['Tables']['metabolic_results']['Row']
export type AthleteProgram = Database['public']['Tables']['athlete_programs']['Row']
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type ExerciseResult = Database['public']['Tables']['exercise_results']['Row']

// Insert types
export type AthleteInsert = Database['public']['Tables']['athletes']['Insert']
export type WorkoutSessionInsert = Database['public']['Tables']['workout_sessions']['Insert']
export type ExerciseResultInsert = Database['public']['Tables']['exercise_results']['Insert']
