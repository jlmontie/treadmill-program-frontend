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
  notes: z.string().optional().nullable(),
})

export type AthleteFormState = {
  errors?: {
    name?: string[]
    gender?: string[]
    sport?: string[]
    position?: string[]
    birth_date?: string[]
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
      current_workout_number: 1,
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
