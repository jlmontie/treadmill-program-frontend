'use server'

import { getAuthenticatedClient } from '@/lib/supabase/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { type ActionResult, failure, successVoid } from '@/lib/types/actions'

const TrainerProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform(s => s.trim()),
})

export async function updateTrainerProfile(formData: FormData): Promise<ActionResult<void>> {
  // Authenticate (note: we use getAuthenticatedClient here since the trainer profile may not exist yet)
  let supabase, user
  try {
    const result = await getAuthenticatedClient()
    supabase = result.supabase
    user = result.user
  } catch {
    return failure('You must be logged in to update your profile')
  }

  // Validate input
  const validated = TrainerProfileSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validated.success) {
    const firstError = Object.values(validated.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError)
  }

  const { name } = validated.data

  // Check if trainer profile exists
  const { data: existingTrainer } = await supabase
    .from('trainers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (existingTrainer) {
    // Update existing trainer
    const { error } = await supabase
      .from('trainers')
      .update({ name })
      .eq('auth_user_id', user.id)

    if (error) {
      return failure(error.message)
    }
  } else {
    // Create new trainer profile
    if (!user.email) {
      return failure('User email is required to create a trainer profile')
    }
    
    const { error } = await supabase
      .from('trainers')
      .insert({
        auth_user_id: user.id,
        email: user.email,
        name,
      })

    if (error) {
      return failure(error.message)
    }
  }

  revalidatePath('/settings')
  revalidatePath('/') // Refresh header with new name
  return successVoid()
}
