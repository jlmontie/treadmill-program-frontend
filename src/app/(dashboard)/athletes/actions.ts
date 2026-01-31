'use server'

import { withAuth, withAuthRateLimited } from '@/lib/supabase/auth'
import { upsertMetabolicResults } from '@/lib/supabase/metabolic'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { type ActionResult, failure, successVoid } from '@/lib/types/actions'

const AthleteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').transform(s => s.trim()),
  gender: z.enum(['male', 'female'], { message: 'Gender is required' }),
  sport: z.string().max(100, 'Sport must be 100 characters or less').transform(s => s.trim()).optional().nullable(),
  position: z.string().max(100, 'Position must be 100 characters or less').transform(s => s.trim()).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  head_size: z.enum(['small', 'medium', 'large']).optional().nullable(),
  chest_size: z.enum(['small', 'medium', 'large']).optional().nullable(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').transform(s => s.trim()).optional().nullable(),
})

// Validation schemas for other actions
const AssignProgramSchema = z.object({
  athlete_id: z.string().uuid('Invalid athlete ID'),
  program_id: z.coerce.number().int().positive('Program ID must be a positive integer'),
  pretest_session_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).transform(s => s.trim()).optional().nullable(),
  use_hr_monitoring: z.boolean().default(true),
})

const MetabolicTestSchema = z.object({
  athlete_id: z.string().uuid('Invalid athlete ID'),
  at_hr: z.coerce.number().int().min(40, 'AT HR must be at least 40').max(250, 'AT HR must be 250 or less'),
  max_hr: z.coerce.number().int().min(60, 'Max HR must be at least 60').max(250, 'Max HR must be 250 or less'),
  recovery_hr_2min: z.coerce.number().int().min(40).max(250).optional().nullable(),
  speed_only: z.boolean().default(false),
  notes: z.string().max(1000).transform(s => s.trim()).optional().nullable(),
})

/**
 * Create a new athlete
 * Rate limited: 30 requests per minute
 */
export async function createAthlete(
  formData: FormData
): Promise<ActionResult<string>> {
  // Authenticate and get trainer with rate limiting
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate input
  const validated = AthleteSchema.safeParse({
    name: formData.get('name'),
    gender: formData.get('gender'),
    sport: formData.get('sport') || null,
    position: formData.get('position') || null,
    birth_date: formData.get('birth_date') || null,
    head_size: formData.get('head_size') || null,
    chest_size: formData.get('chest_size') || null,
    notes: formData.get('notes') || null,
  })

  if (!validated.success) {
    const errors = validated.error.flatten()
    const firstError = Object.values(errors.fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError, errors.fieldErrors)
  }

  // Insert athlete
  const { data, error } = await supabase
    .from('athletes')
    .insert(validated.data)
    .select('id')
    .single()

  if (error) {
    return failure('Failed to create athlete: ' + error.message)
  }

  revalidatePath('/athletes')
  revalidatePath(`/athletes/${data.id}`)
  redirect(`/athletes/${data.id}`)
}

/**
 * Update an existing athlete
 * Rate limited: 30 requests per minute
 */
export async function updateAthlete(
  athleteId: string,
  formData: FormData
): Promise<ActionResult<void>> {
  // Authenticate and get trainer with rate limiting
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate athleteId
  const uuidSchema = z.string().uuid('Invalid athlete ID')
  const athleteIdResult = uuidSchema.safeParse(athleteId)
  if (!athleteIdResult.success) {
    return failure('Invalid athlete ID')
  }

  // Validate input
  const validated = AthleteSchema.safeParse({
    name: formData.get('name'),
    gender: formData.get('gender'),
    sport: formData.get('sport') || null,
    position: formData.get('position') || null,
    birth_date: formData.get('birth_date') || null,
    head_size: formData.get('head_size') || null,
    chest_size: formData.get('chest_size') || null,
    notes: formData.get('notes') || null,
  })

  if (!validated.success) {
    const errors = validated.error.flatten()
    const firstError = Object.values(errors.fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError, errors.fieldErrors)
  }

  // Update athlete
  const { error } = await supabase
    .from('athletes')
    .update(validated.data)
    .eq('id', athleteId)

  if (error) {
    return failure('Failed to update athlete: ' + error.message)
  }

  revalidatePath('/athletes')
  revalidatePath(`/athletes/${athleteId}`)
  redirect(`/athletes/${athleteId}`)
}

/**
 * Delete an athlete
 * Rate limited: 30 requests per minute
 */
export async function deleteAthlete(athleteId: string): Promise<ActionResult<void>> {
  // Authenticate and get trainer with rate limiting
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate athleteId
  const uuidSchema = z.string().uuid('Invalid athlete ID')
  const athleteIdResult = uuidSchema.safeParse(athleteId)
  if (!athleteIdResult.success) {
    return failure('Invalid athlete ID')
  }

  // Delete athlete
  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', athleteId)

  if (error) {
    return failure('Failed to delete athlete: ' + error.message)
  }

  revalidatePath('/athletes')
  redirect('/athletes')
}

/**
 * Assign a program to an athlete
 * Rate limited: 30 requests per minute
 * 
 * Uses an atomic RPC function to ensure:
 * - Any existing active program is paused
 * - The new program is assigned
 * - Both operations succeed or fail together (no partial state)
 */
export async function assignProgram(formData: FormData): Promise<ActionResult<void>> {
  // Authenticate and get trainer with rate limiting
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase, trainer } = authResult.data

  // Validate input
  const validated = AssignProgramSchema.safeParse({
    athlete_id: formData.get('athlete_id'),
    program_id: formData.get('program_id'),
    pretest_session_id: formData.get('pretest_session_id') || null,
    notes: formData.get('notes') || null,
    use_hr_monitoring: formData.get('use_hr_monitoring') !== 'false',
  })

  if (!validated.success) {
    const errors = validated.error.flatten()
    const firstError = Object.values(errors.fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError, errors.fieldErrors)
  }

  const { athlete_id, program_id, pretest_session_id, notes, use_hr_monitoring } = validated.data

  // Use atomic RPC function to assign program
  // This ensures pause + insert happen in a single transaction
  const { error } = await supabase.rpc('assign_program_to_athlete', {
    p_athlete_id: athlete_id,
    p_program_id: program_id,
    p_trainer_id: trainer.id,
    p_pretest_session_id: pretest_session_id || null,
    p_use_hr_monitoring: use_hr_monitoring,
    p_notes: notes || null,
  })

  if (error) {
    return failure('Failed to assign program: ' + error.message)
  }

  revalidatePath(`/athletes/${athlete_id}`)
  revalidatePath('/workouts/new')
  return successVoid()
}

/**
 * Update athlete program status
 * Rate limited: 30 requests per minute
 */
export async function updateProgramStatus(
  athleteProgramId: string,
  status: 'active' | 'paused' | 'completed' | 'cancelled'
): Promise<ActionResult<void>> {
  // Authenticate and get trainer with rate limiting
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate athleteProgramId
  const uuidSchema = z.string().uuid('Invalid athlete program ID')
  const idResult = uuidSchema.safeParse(athleteProgramId)
  if (!idResult.success) {
    return failure('Invalid athlete program ID')
  }

  // Validate status
  const statusSchema = z.enum(['active', 'paused', 'completed', 'cancelled'])
  const statusResult = statusSchema.safeParse(status)
  if (!statusResult.success) {
    return failure('Invalid status')
  }

  // Get the athlete ID for path revalidation
  const { data: program } = await supabase
    .from('athlete_programs')
    .select('athlete_id')
    .eq('id', athleteProgramId)
    .single()

  // Update program status
  const { error } = await supabase
    .from('athlete_programs')
    .update({ 
      status,
      end_date: status === 'completed' || status === 'cancelled' 
        ? new Date().toISOString() 
        : null 
    })
    .eq('id', athleteProgramId)

  if (error) {
    return failure('Failed to update program status: ' + error.message)
  }

  if (program) {
    revalidatePath(`/athletes/${program.athlete_id}`)
  }
  revalidatePath('/workouts/new')
  return successVoid()
}

/**
 * Start a workout directly for an athlete (from their profile page)
 */
export async function startWorkoutForAthlete(
  athleteProgramId: string,
  programId: number,
  currentWorkoutNumber: number
): Promise<ActionResult<{ sessionId: string }>> {
  // Authenticate and get trainer
  const authResult = await withAuth()
  if (!authResult.success) return authResult
  const { supabase, trainer } = authResult.data

  // Validate inputs
  const inputSchema = z.object({
    athleteProgramId: z.string().uuid('Invalid athlete program ID'),
    programId: z.number().int().positive('Program ID must be a positive integer'),
    currentWorkoutNumber: z.number().int().positive('Workout number must be a positive integer'),
  })

  const validated = inputSchema.safeParse({ athleteProgramId, programId, currentWorkoutNumber })
  if (!validated.success) {
    const firstError = Object.values(validated.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError)
  }

  // Check if there's already an in-progress session for this athlete program
  const { data: existingSession } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('athlete_program_id', athleteProgramId)
    .eq('status', 'in_progress')
    .single()

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
    .single()

  if (!programWorkout) {
    return failure(`Workout #${currentWorkoutNumber} not found for this program`)
  }

  // Create the workout session
  const { data: session, error } = await supabase
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
    return failure(error?.message || 'Failed to create workout session')
  }

  revalidatePath('/workouts')
  revalidatePath(`/athletes`)
  redirect(`/workouts/session/${session.id}`)
}

/**
 * Save metabolic test results for an athlete
 * Creates a standalone pretest session specifically for metabolic data
 */
export async function saveMetabolicTest(formData: FormData): Promise<ActionResult<void>> {
  // Authenticate and get trainer
  const authResult = await withAuth()
  if (!authResult.success) return authResult
  const { supabase, trainer } = authResult.data

  // Validate input
  const validated = MetabolicTestSchema.safeParse({
    athlete_id: formData.get('athlete_id'),
    at_hr: formData.get('at_hr'),
    max_hr: formData.get('max_hr'),
    recovery_hr_2min: formData.get('recovery_hr_2min') || null,
    speed_only: formData.get('speed_only') === 'true',
    notes: formData.get('notes') || null,
  })

  if (!validated.success) {
    const errors = validated.error.flatten()
    const firstError = Object.values(errors.fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError, errors.fieldErrors)
  }

  const { athlete_id, at_hr, max_hr, recovery_hr_2min, speed_only, notes } = validated.data

  // Get the "Standard" pretest type for metabolic-only tests
  // This is a workaround since metabolic_results requires a pretest_session
  const { data: pretestType } = await supabase
    .from('pretest_types')
    .select('id')
    .eq('code', 'standard')
    .single()

  if (!pretestType) {
    return failure('Could not find pretest type for metabolic test')
  }

  // Check if athlete already has a metabolic-only pretest session
  // Look for a completed pretest that has metabolic results
  const { data: existingSession } = await supabase
    .from('pretest_sessions')
    .select(`
      id,
      metabolic_results (id)
    `)
    .eq('athlete_id', athlete_id)
    .eq('status', 'completed')
    .order('session_date', { ascending: false })
    .limit(1)
    .single()

  let sessionId: string

  // Type the existingSession properly
  const typedExistingSession = existingSession as { id: string; metabolic_results: { id: string }[] | null } | null

  if (typedExistingSession?.metabolic_results?.length) {
    // Update existing metabolic results
    sessionId = typedExistingSession.id
  } else {
    // Create a new pretest session for metabolic data
    const { data: newSession, error: sessionError } = await supabase
      .from('pretest_sessions')
      .insert({
        athlete_id,
        pretest_type_id: pretestType.id,
        trainer_id: trainer.id,
        session_date: new Date().toISOString().split('T')[0],
        status: 'completed', // Mark as completed since this is metabolic-only
      })
      .select()
      .single()

    if (sessionError || !newSession) {
      return failure(sessionError?.message || 'Failed to create metabolic test session')
    }

    sessionId = newSession.id
  }

  // Use the shared upsert utility for metabolic results
  const result = await upsertMetabolicResults(supabase, sessionId, {
    atHr: at_hr,
    maxHr: max_hr,
    recoveryHr2min: recovery_hr_2min ?? null,
    speedOnly: speed_only,
    notes: notes || null,
  })

  if (!result.success) {
    return failure(result.error || 'Failed to save metabolic results')
  }

  revalidatePath(`/athletes/${athlete_id}`)
  return successVoid()
}
