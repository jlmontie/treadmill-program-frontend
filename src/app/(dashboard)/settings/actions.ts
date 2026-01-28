'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTrainerProfile(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const name = formData.get('name') as string

  if (!name || name.trim().length === 0) {
    return { error: 'Name is required' }
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if trainer profile exists
  const { data: existingTrainer } = await supabase
    .from('trainers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single() as { data: { id: string } | null }

  if (existingTrainer) {
    // Update existing trainer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('trainers')
      .update({ name: name.trim() })
      .eq('auth_user_id', user.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Create new trainer profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('trainers')
      .insert({
        auth_user_id: user.id,
        email: user.email,
        name: name.trim(),
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/settings')
  revalidatePath('/') // Refresh header with new name
  return { success: true }
}
