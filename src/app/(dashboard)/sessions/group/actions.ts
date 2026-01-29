'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startWorkoutForGroup(athleteProgramId: string) {
  const supabase = await createClient()

  // Get current user's trainer ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: trainerData } = await supabase
    .from('trainers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const trainer = trainerData as { id: string } | null

  if (!trainer) {
    return { success: false, error: 'Trainer profile not found' }
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
    return { success: false, error: 'Athlete program not found' }
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
    return { success: false, error: 'This program has no workouts defined' }
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
    await (supabase
      .from('athlete_programs') as any)
      .update({ current_workout_number: currentWorkout.workout_number })
      .eq('id', athleteProgramId)
  }
  
  console.log('Starting workout number:', currentWorkout.workout_number, 'for athlete program:', athleteProgramId)

  // Create the workout session
  const insertData = {
    athlete_program_id: athleteProgramId,
    program_workout_id: currentWorkout.id,
    trainer_id: trainer.id,
    status: 'in_progress' as const,
    started_at: new Date().toISOString(),
  }
  
  const { data: session, error: sessionError } = await (supabase
    .from('workout_sessions') as any)
    .insert(insertData)
    .select('id')
    .single()

  if (sessionError) {
    return { success: false, error: sessionError.message }
  }

  revalidatePath('/sessions/group')
  revalidatePath('/')
  
  return { success: true, sessionId: session.id }
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
}) {
  const supabase = await createClient()

  // Insert the exercise result
  const exerciseResultData = {
    workout_session_id: workoutSessionId,
    workout_exercise_id: workoutExerciseId,
    completion_level: completionLevel,
    speed_column_used: speedColumnUsed || null,
    actual_speed: actualSpeed || null,
    notes: notes || null,
    completed_at: new Date().toISOString(),
  }
  
  const { error } = await (supabase
    .from('exercise_results') as any)
    .insert(exerciseResultData)

  if (error) {
    return { success: false, error: error.message }
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
    const totalExercises = (session as any).program_workouts?.workout_exercises?.length || 0
    const completedExercises = (session as any).exercise_results?.length || 0

    // If all exercises complete, mark session as complete and advance workout number
    if (completedExercises >= totalExercises) {
      await (supabase
        .from('workout_sessions') as any)
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', workoutSessionId)

      // Get current workout number and advance it
      const { data: athleteProgram } = await supabase
        .from('athlete_programs')
        .select('current_workout_number')
        .eq('id', (session as any).athlete_program_id)
        .single()

      if (athleteProgram) {
        await (supabase
          .from('athlete_programs') as any)
          .update({ 
            current_workout_number: ((athleteProgram as any).current_workout_number || 2) + 1 
          })
          .eq('id', (session as any).athlete_program_id)
      }
    }
  }

  revalidatePath('/sessions/group')
  revalidatePath('/')

  return { success: true }
}

export async function completeWorkoutSession(workoutSessionId: string, notes?: string) {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('workout_sessions') as any)
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: notes || null,
    })
    .eq('id', workoutSessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/sessions/group')
  revalidatePath('/')

  return { success: true }
}
