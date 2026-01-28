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
