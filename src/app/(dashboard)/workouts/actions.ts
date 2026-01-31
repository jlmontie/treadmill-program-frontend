'use server'

import { createClient } from '@/lib/supabase/server'
import { withAuth, getAuthenticatedClient } from '@/lib/supabase/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { type ActionResult, failure, successVoid } from '@/lib/types/actions'

// Validation schemas
const StartWorkoutSchema = z.object({
  athlete_program_id: z.string().uuid('Invalid athlete program ID'),
  program_workout_id: z.coerce.number().int().positive('Program workout ID must be a positive integer'),
})

const ExerciseResultSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  exerciseId: z.number().int().positive('Exercise ID must be a positive integer'),
  completionLevel: z.enum(['complete', 'slight_touch', 'push', 'failure']),
  speedColumnUsed: z.number().int().min(1).max(3).optional().nullable(),
  actualSpeed: z.number().positive().optional().nullable(),
  notes: z.string().max(500).transform(s => s.trim()).optional(),
})

/**
 * Start a new workout session
 */
export async function startWorkout(formData: FormData): Promise<void> {
  // Authenticate and get trainer
  const authResult = await withAuth()
  if (!authResult.success) {
    redirect('/login')
  }
  const { supabase, trainer } = authResult.data

  // Validate input
  const validated = StartWorkoutSchema.safeParse({
    athlete_program_id: formData.get('athlete_program_id'),
    program_workout_id: formData.get('program_workout_id'),
  })

  if (!validated.success) {
    redirect('/workouts/new?error=invalid_input')
  }

  const { athlete_program_id, program_workout_id } = validated.data

  // Check if there's already an in-progress session for this athlete program
  const { data: existingSession } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('athlete_program_id', athlete_program_id)
    .eq('status', 'in_progress')
    .single()

  if (existingSession) {
    // Resume existing session
    redirect(`/workouts/session/${existingSession.id}`)
  }

  // Create the workout session
  const { data: session, error } = await supabase
    .from('workout_sessions')
    .insert({
      athlete_program_id,
      program_workout_id,
      trainer_id: trainer.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !session) {
    redirect('/workouts/new?error=create_failed')
  }

  revalidatePath('/workouts')
  redirect(`/workouts/session/${session.id}`)
}

/**
 * Record result for a workout exercise
 */
export async function recordExerciseResult(
  sessionId: string,
  exerciseId: number,
  completionLevel: string,
  speedColumnUsed: number | null,
  actualSpeed: number | null,
  notes?: string
): Promise<ActionResult<void>> {
  // Authenticate
  const authResult = await withAuth()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate input
  const validated = ExerciseResultSchema.safeParse({
    sessionId,
    exerciseId,
    completionLevel,
    speedColumnUsed,
    actualSpeed,
    notes: notes?.trim() || undefined,
  })

  if (!validated.success) {
    const firstError = Object.values(validated.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError)
  }

  const { error } = await supabase
    .from('exercise_results')
    .upsert({
      workout_session_id: validated.data.sessionId,
      workout_exercise_id: validated.data.exerciseId,
      completion_level: validated.data.completionLevel,
      speed_column_used: validated.data.speedColumnUsed ?? null,
      actual_speed: validated.data.actualSpeed ?? null,
      notes: validated.data.notes || null,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'workout_session_id,workout_exercise_id'
    })

  if (error) {
    return failure(error.message)
  }

  revalidatePath(`/workouts/session/${sessionId}`)
  return successVoid()
}

/**
 * Complete the workout session
 */
export async function completeWorkout(sessionId: string, sessionNotes?: string): Promise<void> {
  // Authenticate
  try {
    const { supabase } = await getAuthenticatedClient()

    // Validate session ID
    const sessionIdSchema = z.string().uuid('Invalid session ID')
    const result = sessionIdSchema.safeParse(sessionId)
    if (!result.success) {
      redirect('/workouts?error=invalid_session')
    }

    // Sanitize notes
    const sanitizedNotes = sessionNotes?.trim().slice(0, 1000) || null

    // Update session status to completed
    const { error: updateError } = await supabase
      .from('workout_sessions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        session_notes: sanitizedNotes,
      })
      .eq('id', sessionId)

    if (updateError) {
      redirect(`/workouts/session/${sessionId}?error=complete_failed`)
    }

    // Atomically increment the workout number using RPC function
    // This prevents race conditions in concurrent workout completions
    const { data: session } = await supabase
      .from('workout_sessions')
      .select('athlete_program_id')
      .eq('id', sessionId)
      .single()

    if (session) {
      // Use atomic RPC function to increment workout number
      const { error: incrementError } = await supabase.rpc('increment_workout_number', {
        p_athlete_program_id: session.athlete_program_id,
        p_session_id: sessionId
      })

      if (incrementError) {
        console.error('Failed to increment workout number:', incrementError)
        // Continue anyway - workout is already marked complete
      }
    }

    revalidatePath('/workouts')
    revalidatePath(`/workouts/${sessionId}`)
    redirect(`/workouts/${sessionId}`)
  } catch {
    redirect('/login')
  }
}

/**
 * Cancel a workout session
 */
export async function cancelWorkout(sessionId: string): Promise<ActionResult<void>> {
  // Authenticate
  const authResult = await withAuth()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate session ID
  const sessionIdSchema = z.string().uuid('Invalid session ID')
  const result = sessionIdSchema.safeParse(sessionId)
  if (!result.success) {
    return failure('Invalid session ID')
  }

  const { error } = await supabase
    .from('workout_sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/workouts')
  redirect('/workouts')
}
