'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const AthleteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gender: z.enum(['male', 'female'], { message: 'Gender is required' }),
  sport: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  head_size: z.enum(['small', 'medium', 'large']).optional().nullable(),
  chest_size: z.enum(['small', 'medium', 'large']).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type AthleteFormState = {
  errors?: {
    name?: string[]
    gender?: string[]
    sport?: string[]
    position?: string[]
    birth_date?: string[]
    head_size?: string[]
    chest_size?: string[]
    notes?: string[]
    _form?: string[]
  }
  success?: boolean
}

export async function createAthlete(
  prevState: AthleteFormState,
  formData: FormData
): Promise<AthleteFormState> {
  const supabase = await createClient()

  const validatedFields = AthleteSchema.safeParse({
    name: formData.get('name'),
    gender: formData.get('gender'),
    sport: formData.get('sport') || null,
    position: formData.get('position') || null,
    birth_date: formData.get('birth_date') || null,
    head_size: formData.get('head_size') || null,
    chest_size: formData.get('chest_size') || null,
    notes: formData.get('notes') || null,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Note: Types will be properly inferred once you generate types from Supabase:
  // npx supabase gen types typescript --project-id YOUR_PROJECT_ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('athletes')
    .insert(validatedFields.data)
    .select()
    .single()

  if (error) {
    return {
      errors: {
        _form: [error.message],
      },
    }
  }

  revalidatePath('/athletes')
  redirect(`/athletes/${data.id}`)
}

export async function updateAthlete(
  athleteId: string,
  prevState: AthleteFormState,
  formData: FormData
): Promise<AthleteFormState> {
  const supabase = await createClient()

  const validatedFields = AthleteSchema.safeParse({
    name: formData.get('name'),
    gender: formData.get('gender'),
    sport: formData.get('sport') || null,
    position: formData.get('position') || null,
    birth_date: formData.get('birth_date') || null,
    head_size: formData.get('head_size') || null,
    chest_size: formData.get('chest_size') || null,
    notes: formData.get('notes') || null,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('athletes')
    .update(validatedFields.data)
    .eq('id', athleteId)

  if (error) {
    return {
      errors: {
        _form: [error.message],
      },
    }
  }

  revalidatePath('/athletes')
  revalidatePath(`/athletes/${athleteId}`)
  redirect(`/athletes/${athleteId}`)
}

export async function deleteAthlete(athleteId: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('athletes')
    .delete()
    .eq('id', athleteId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/athletes')
  redirect('/athletes')
}

/**
 * Assign a program to an athlete
 */
export async function assignProgram(formData: FormData) {
  const supabase = await createClient()

  const athleteId = formData.get('athlete_id') as string
  const programId = formData.get('program_id') as string
  const pretestSessionId = formData.get('pretest_session_id') as string | null
  const notes = formData.get('notes') as string | null
  // Default to true (use HR monitoring). If no metabolic results, this can be set to false.
  const useHrMonitoring = formData.get('use_hr_monitoring') !== 'false'

  if (!athleteId || !programId) {
    return { error: 'Athlete and program are required' }
  }

  // Get current trainer
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: trainer } = await supabase
    .from('trainers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single() as { data: { id: string } | null }

  if (!trainer) {
    return { error: 'Trainer profile not found' }
  }

  // Check if athlete already has an active program
  const { data: existingActive } = await supabase
    .from('athlete_programs')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('status', 'active')
    .single() as { data: { id: string } | null }

  if (existingActive) {
    // Pause the existing active program
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('athlete_programs')
      .update({ status: 'paused' })
      .eq('id', existingActive.id)
  }

  // Get the first workout number for this program
  const { data: firstWorkout } = await supabase
    .from('program_workouts')
    .select('workout_number')
    .eq('program_id', parseInt(programId))
    .order('workout_number', { ascending: true })
    .limit(1)
    .single() as { data: { workout_number: number } | null }

  const firstWorkoutNumber = firstWorkout?.workout_number ?? 2 // Default to 2 if not found

  // Create the new program assignment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('athlete_programs')
    .insert({
      athlete_id: athleteId,
      program_id: parseInt(programId),
      assigned_by: trainer.id,
      pretest_session_id: pretestSessionId || null,
      status: 'active',
      current_workout_number: firstWorkoutNumber,
      use_hr_monitoring: useHrMonitoring,
      notes: notes || null,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/athletes/${athleteId}`)
  revalidatePath('/workouts/new')
  return { success: true }
}

/**
 * Update athlete program status
 */
export async function updateProgramStatus(
  athleteProgramId: string,
  status: 'active' | 'paused' | 'completed' | 'cancelled'
) {
  const supabase = await createClient()

  // Get the athlete ID for path revalidation
  const { data: program } = await supabase
    .from('athlete_programs')
    .select('athlete_id')
    .eq('id', athleteProgramId)
    .single() as { data: { athlete_id: string } | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('athlete_programs')
    .update({ 
      status,
      end_date: status === 'completed' || status === 'cancelled' 
        ? new Date().toISOString() 
        : null 
    })
    .eq('id', athleteProgramId)

  if (error) {
    return { error: error.message }
  }

  if (program) {
    revalidatePath(`/athletes/${program.athlete_id}`)
  }
  revalidatePath('/workouts/new')
  return { success: true }
}

/**
 * Start a workout directly for an athlete (from their profile page)
 */
export async function startWorkoutForAthlete(
  athleteProgramId: string,
  programId: number,
  currentWorkoutNumber: number
) {
  const supabase = await createClient()

  // Get current trainer
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: trainer } = await supabase
    .from('trainers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single() as { data: { id: string } | null }

  if (!trainer) {
    return { error: 'Trainer profile not found' }
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

  // Get the program workout for the current workout number
  const { data: programWorkout } = await supabase
    .from('program_workouts')
    .select('id')
    .eq('program_id', programId)
    .eq('workout_number', currentWorkoutNumber)
    .single() as { data: { id: number } | null }

  if (!programWorkout) {
    return { error: `Workout #${currentWorkoutNumber} not found for this program` }
  }

  // Create the workout session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await (supabase as any)
    .from('workout_sessions')
    .insert({
      athlete_program_id: athleteProgramId,
      program_workout_id: programWorkout.id,
      trainer_id: trainer.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !session) {
    return { error: error?.message || 'Failed to create workout session' }
  }

  revalidatePath('/workouts')
  revalidatePath(`/athletes`)
  redirect(`/workouts/session/${session.id}`)
}
