'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { calculateMetabolicData } from '@/lib/metabolic'

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

  // Note: Add head_size and chest_size parsing once migration is applied
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

  // Note: Add head_size and chest_size parsing once migration is applied
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

/**
 * Save metabolic test results for an athlete
 * Creates a standalone pretest session specifically for metabolic data
 */
export async function saveMetabolicTest(formData: FormData) {
  const supabase = await createClient()

  const athleteId = formData.get('athlete_id') as string
  const atHr = formData.get('at_hr') as string
  const maxHr = formData.get('max_hr') as string
  const recoveryHr2min = formData.get('recovery_hr_2min') as string
  const speedOnly = formData.get('speed_only') === 'true'
  const notes = formData.get('notes') as string

  if (!athleteId || !atHr || !maxHr) {
    return { error: 'Athlete, AT HR, and Max HR are required' }
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

  // Get the "Standard" pretest type for metabolic-only tests
  // This is a workaround since metabolic_results requires a pretest_session
  const { data: pretestType } = await supabase
    .from('pretest_types')
    .select('id')
    .eq('code', 'standard')
    .single() as { data: { id: number } | null }

  if (!pretestType) {
    return { error: 'Could not find pretest type for metabolic test' }
  }

  // Check if athlete already has a metabolic-only pretest session
  // Look for a completed pretest that has metabolic results
  const { data: existingSession } = await supabase
    .from('pretest_sessions')
    .select(`
      id,
      metabolic_results (id)
    `)
    .eq('athlete_id', athleteId)
    .eq('status', 'completed')
    .order('session_date', { ascending: false })
    .limit(1)
    .single() as { data: { id: string; metabolic_results: { id: string }[] | null } | null }

  let sessionId: string

  if (existingSession?.metabolic_results?.length) {
    // Update existing metabolic results
    sessionId = existingSession.id
  } else {
    // Create a new pretest session for metabolic data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newSession, error: sessionError } = await (supabase as any)
      .from('pretest_sessions')
      .insert({
        athlete_id: athleteId,
        pretest_type_id: pretestType.id,
        trainer_id: trainer.id,
        session_date: new Date().toISOString().split('T')[0],
        status: 'completed', // Mark as completed since this is metabolic-only
      })
      .select()
      .single()

    if (sessionError || !newSession) {
      return { error: sessionError?.message || 'Failed to create metabolic test session' }
    }

    sessionId = newSession.id
  }

  // Calculate percentages using centralized utility
  const atHrNum = parseInt(atHr)
  const maxHrNum = parseInt(maxHr)
  const recoveryHr2minNum = recoveryHr2min ? parseInt(recoveryHr2min) : null

  const { atMaxPercent, recoveryAtPercent, metabolicCategory, recoveryHr } = calculateMetabolicData({
    atHr: atHrNum,
    maxHr: maxHrNum,
    recoveryHr2min: recoveryHr2minNum,
    speedOnly
  })

  // Check if metabolic results already exist for this session
  const { data: existingResults } = await supabase
    .from('metabolic_results')
    .select('id')
    .eq('pretest_session_id', sessionId)
    .single() as { data: { id: string } | null }

  if (existingResults) {
    // Update existing results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('metabolic_results')
      .update({
        at_hr: atHrNum,
        max_hr: maxHrNum,
        at_max_percent: atMaxPercent,
        recovery_hr_2min: recoveryHr2minNum,
        recovery_at_percent: recoveryAtPercent,
        recovery_hr: recoveryHr,
        metabolic_category: metabolicCategory,
        notes: notes || null,
      })
      .eq('id', existingResults.id)

    if (updateError) {
      return { error: updateError.message }
    }
  } else {
    // Insert new results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('metabolic_results')
      .insert({
        pretest_session_id: sessionId,
        at_hr: atHrNum,
        max_hr: maxHrNum,
        at_max_percent: atMaxPercent,
        recovery_hr_2min: recoveryHr2minNum,
        recovery_at_percent: recoveryAtPercent,
        recovery_hr: recoveryHr,
        metabolic_category: metabolicCategory,
        notes: notes || null,
      })

    if (insertError) {
      return { error: insertError.message }
    }
  }

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true }
}
