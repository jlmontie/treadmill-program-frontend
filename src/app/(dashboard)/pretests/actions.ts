'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Start a new pre-test session
 */
export async function startPretest(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const athleteId = formData.get('athlete_id') as string
  const pretestTypeId = formData.get('pretest_type_id') as string

  if (!athleteId || !pretestTypeId) {
    redirect('/pretests/new?error=missing_fields')
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
    redirect('/pretests/new?error=no_trainer')
  }

  // Create the pre-test session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await (supabase as any)
    .from('pretest_sessions')
    .insert({
      athlete_id: athleteId,
      trainer_id: trainer.id,
      pretest_type_id: parseInt(pretestTypeId),
      status: 'in_progress',
    })
    .select()
    .single()

  if (error || !session) {
    redirect('/pretests/new?error=create_failed')
  }

  revalidatePath('/pretests')
  redirect(`/pretests/session/${session.id}`)
}

/**
 * Record result for a pre-test step
 */
export async function recordStepResult(
  sessionId: string,
  stepId: number,
  completionLevel: string,
  notes?: string
) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('pretest_step_results')
    .upsert({
      pretest_session_id: sessionId,
      pretest_step_id: stepId,
      completion_level: completionLevel,
      notes: notes || null,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'pretest_session_id,pretest_step_id'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/pretests/session/${sessionId}`)
  return { success: true }
}

/**
 * Save metabolic results and complete the pre-test
 */
export async function completePretest(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const sessionId = formData.get('session_id') as string
  const atHr = formData.get('at_hr') as string
  const maxHr = formData.get('max_hr') as string
  const recoveryHr = formData.get('recovery_hr_2min') as string
  const notes = formData.get('notes') as string

  if (!sessionId) {
    redirect('/pretests')
  }

  // Calculate percentages
  const atHrNum = atHr ? parseInt(atHr) : null
  const maxHrNum = maxHr ? parseInt(maxHr) : null
  const recoveryHrNum = recoveryHr ? parseInt(recoveryHr) : null

  let atMaxPercent = null
  let recoveryAtPercent = null

  if (atHrNum && maxHrNum) {
    atMaxPercent = (atHrNum / maxHrNum) * 100
  }

  if (recoveryHrNum && atHrNum) {
    recoveryAtPercent = (recoveryHrNum / atHrNum) * 100
  }

  // Determine metabolic category based on recovery percentage
  let metabolicCategory = 'standard'
  if (recoveryAtPercent !== null) {
    if (recoveryAtPercent > 85) {
      metabolicCategory = 'la' // High lactate acid, needs more conditioning
    } else if (recoveryAtPercent < 70) {
      metabolicCategory = 'low'
    }
  }

  // Insert metabolic results
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('metabolic_results')
    .insert({
      pretest_session_id: sessionId,
      at_hr: atHrNum,
      max_hr: maxHrNum,
      at_max_percent: atMaxPercent,
      recovery_hr_2min: recoveryHrNum,
      recovery_at_percent: recoveryAtPercent,
      metabolic_category: metabolicCategory,
      notes: notes || null,
    })

  // Update session status to completed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('pretest_sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)

  revalidatePath('/pretests')
  revalidatePath(`/pretests/${sessionId}`)
  redirect(`/pretests/${sessionId}`)
}

/**
 * Cancel/delete a pre-test session
 */
export async function cancelPretest(sessionId: string): Promise<void> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('pretest_sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)

  revalidatePath('/pretests')
  redirect('/pretests')
}
