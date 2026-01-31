'use server'

import { withAuthRateLimited } from '@/lib/supabase/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { type ActionResult, failure, success, successVoid } from '@/lib/types/actions'

// Validation schemas
const UuidSchema = z.string().uuid('Invalid ID')

const LogExerciseResultSchema = z.object({
  workoutSessionId: z.string().uuid('Invalid workout session ID'),
  workoutExerciseId: z.number().int().positive('Exercise ID must be a positive integer'),
  completionLevel: z.enum(['complete', 'slight_touch', 'push', 'failure']),
  speedColumnUsed: z.number().int().min(1).max(3).optional().nullable(),
  actualSpeed: z.number().positive().optional().nullable(),
  notes: z.string().max(500).transform(s => s.trim()).optional().nullable(),
})

export async function startWorkoutForGroup(athleteProgramId: string): Promise<ActionResult<{ sessionId: string }>> {
  // Authenticate and get trainer with rate limiting
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase, trainer } = authResult.data

  // Validate input
  const validatedId = UuidSchema.safeParse(athleteProgramId)
  if (!validatedId.success) {
    return failure('Invalid athlete program ID')
  }

  // Get the athlete program details
  const { data: athleteProgram, error: apError } = await supabase
    .from('athlete_programs')
    .select(`
      id,
      program_id,
      current_workout_number,
      programs (
        program_workouts (
          id,
          workout_number
        )
      )
    `)
    .eq('id', athleteProgramId)
    .single()

  if (apError || !athleteProgram) {
    return failure('Athlete program not found')
  }

  const typedAthleteProgram = athleteProgram as {
    id: string
    program_id: number
    current_workout_number: number | null
    programs: { program_workouts: Array<{ id: number; workout_number: number }> } | null
  }

  // Get all workouts for this program, sorted by workout number
  const programWorkouts = (typedAthleteProgram.programs?.program_workouts || [])
    .sort((a, b) => a.workout_number - b.workout_number)
  
  if (programWorkouts.length === 0) {
    return failure('This program has no workouts defined')
  }

  // Determine which workout to start
  let currentWorkout: { id: number; workout_number: number } | undefined
  
  if (typedAthleteProgram.current_workout_number) {
    // Use the tracked workout number
    currentWorkout = programWorkouts.find(
      (pw) => pw.workout_number === typedAthleteProgram.current_workout_number
    )
  }
  
  // If no current workout number set, or it doesn't exist, use the first workout
  if (!currentWorkout) {
    currentWorkout = programWorkouts[0]
    
    // Update the athlete_program with this workout number for future tracking
    await supabase
      .from('athlete_programs')
      .update({ current_workout_number: currentWorkout.workout_number })
      .eq('id', athleteProgramId)
  }

  // Create the workout session
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      athlete_program_id: athleteProgramId,
      program_workout_id: currentWorkout.id,
      trainer_id: trainer.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    return failure(sessionError?.message || 'Failed to create workout session')
  }

  revalidatePath('/sessions/group')
  revalidatePath('/')
  
  return success({ sessionId: session.id })
}

export async function logExerciseResult({
  workoutSessionId,
  workoutExerciseId,
  completionLevel,
  speedColumnUsed,
  actualSpeed,
  notes,
}: {
  workoutSessionId: string
  workoutExerciseId: number
  completionLevel: 'complete' | 'slight_touch' | 'push' | 'failure'
  speedColumnUsed?: number | null
  actualSpeed?: number | null
  notes?: string | null
}): Promise<ActionResult<void>> {
  // Authenticate with rate limiting
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate input
  const validated = LogExerciseResultSchema.safeParse({
    workoutSessionId,
    workoutExerciseId,
    completionLevel,
    speedColumnUsed,
    actualSpeed,
    notes,
  })

  if (!validated.success) {
    const firstError = Object.values(validated.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError)
  }

  // Insert the exercise result
  const { error } = await supabase
    .from('exercise_results')
    .insert({
      workout_session_id: validated.data.workoutSessionId,
      workout_exercise_id: validated.data.workoutExerciseId,
      completion_level: validated.data.completionLevel,
      speed_column_used: validated.data.speedColumnUsed ?? null,
      actual_speed: validated.data.actualSpeed ?? null,
      notes: validated.data.notes || null,
      completed_at: new Date().toISOString(),
    })

  if (error) {
    return failure(error.message)
  }

  // Check if all exercises are complete
  const { data: session } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      athlete_program_id,
      program_workouts (
        workout_exercises (id)
      ),
      exercise_results (id)
    `)
    .eq('id', workoutSessionId)
    .single()

  if (session) {
    const typedSession = session as {
      id: string
      athlete_program_id: string
      program_workouts: { workout_exercises: { id: number }[] } | null
      exercise_results: { id: string }[] | null
    }
    
    const totalExercises = typedSession.program_workouts?.workout_exercises?.length || 0
    const completedExercises = typedSession.exercise_results?.length || 0

    // If all exercises complete, mark session as complete and advance workout number
    if (completedExercises >= totalExercises) {
      await supabase
        .from('workout_sessions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', workoutSessionId)

      // Atomically increment the workout number using RPC function
      // This prevents race conditions in concurrent workout completions
      const { error: incrementError } = await supabase.rpc('increment_workout_number', {
        p_athlete_program_id: typedSession.athlete_program_id,
        p_session_id: workoutSessionId
      })

      if (incrementError) {
        console.error('Failed to increment workout number:', incrementError)
        // Continue anyway - workout is already marked complete
      }
    }
  }

  revalidatePath('/sessions/group')
  revalidatePath('/')

  return successVoid()
}

export async function completeWorkoutSession(workoutSessionId: string, notes?: string): Promise<ActionResult<void>> {
  // Authenticate with rate limiting
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate input
  const validatedId = UuidSchema.safeParse(workoutSessionId)
  if (!validatedId.success) {
    return failure('Invalid workout session ID')
  }

  // Sanitize notes
  const sanitizedNotes = notes?.trim().slice(0, 1000) || null

  const { error } = await supabase
    .from('workout_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      session_notes: sanitizedNotes,
    })
    .eq('id', workoutSessionId)

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/sessions/group')
  revalidatePath('/')

  return successVoid()
}

export async function cancelGroupWorkout(workoutSessionId: string): Promise<ActionResult<void>> {
  // Authenticate with rate limiting
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate input
  const validatedId = UuidSchema.safeParse(workoutSessionId)
  if (!validatedId.success) {
    return failure('Invalid workout session ID')
  }

  const { error } = await supabase
    .from('workout_sessions')
    .update({
      status: 'cancelled',
    })
    .eq('id', workoutSessionId)

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/sessions/group')
  revalidatePath('/')

  return successVoid()
}
