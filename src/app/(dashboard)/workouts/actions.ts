'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Start a new workout session
 */
export async function startWorkout(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const athleteProgramId = formData.get('athlete_program_id') as string
  const programWorkoutId = formData.get('program_workout_id') as string

  if (!athleteProgramId || !programWorkoutId) {
    redirect('/workouts/new?error=missing_fields')
  }

  // Get current trainer
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: trainer } = await supabase
    .from('trainers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single() as { data: { id: string } | null }

  if (!trainer) {
    redirect('/workouts/new?error=no_trainer')
  }

  // Check if there's already an in-progress session for this athlete program
  const { data: existingSession } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('athlete_program_id', athleteProgramId)
    .eq('status', 'in_progress')
    .single() as { data: { id: string } | null }

  if (existingSession) {
    // Resume existing session
    redirect(`/workouts/session/${existingSession.id}`)
  }

  // Create the workout session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await (supabase as any)
    .from('workout_sessions')
    .insert({
      athlete_program_id: athleteProgramId,
      program_workout_id: parseInt(programWorkoutId),
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
) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('exercise_results')
    .upsert({
      workout_session_id: sessionId,
      workout_exercise_id: exerciseId,
      completion_level: completionLevel,
      speed_column_used: speedColumnUsed,
      actual_speed: actualSpeed,
      notes: notes || null,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'workout_session_id,workout_exercise_id'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/workouts/session/${sessionId}`)
  return { success: true }
}

/**
 * Complete the workout session
 */
export async function completeWorkout(sessionId: string, sessionNotes?: string): Promise<void> {
  const supabase = await createClient()

  // Update session status to completed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('workout_sessions')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString(),
      session_notes: sessionNotes || null,
    })
    .eq('id', sessionId)

  // Get the athlete program to update current workout number
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('athlete_program_id, program_workout_id')
    .eq('id', sessionId)
    .single() as { data: { athlete_program_id: string; program_workout_id: number } | null }

  if (session) {
    // Get the workout number
    const { data: workout } = await supabase
      .from('program_workouts')
      .select('workout_number')
      .eq('id', session.program_workout_id)
      .single() as { data: { workout_number: number } | null }

    if (workout) {
      // Update athlete program's current workout number
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('athlete_programs')
        .update({ current_workout_number: workout.workout_number + 1 })
        .eq('id', session.athlete_program_id)
    }
  }

  revalidatePath('/workouts')
  revalidatePath(`/workouts/${sessionId}`)
  redirect(`/workouts/${sessionId}`)
}

/**
 * Cancel a workout session
 */
export async function cancelWorkout(sessionId: string): Promise<void> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('workout_sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)

  revalidatePath('/workouts')
  redirect('/workouts')
}
