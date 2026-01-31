'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { calculateMetabolicData } from '@/lib/metabolic'

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

  // Calculate percentages using centralized utility
  const atHrNum = atHr ? parseInt(atHr) : null
  const maxHrNum = maxHr ? parseInt(maxHr) : null
  const recoveryHrNum = recoveryHr ? parseInt(recoveryHr) : null

  const { atMaxPercent, recoveryAtPercent, metabolicCategory, recoveryHr: calculatedRecoveryHr } = calculateMetabolicData({
    atHr: atHrNum,
    maxHr: maxHrNum,
    recoveryHr2min: recoveryHrNum
  })

  // Check if metabolic results already exist (for editing)
  const { data: existingMetabolic } = await supabase
    .from('metabolic_results')
    .select('id')
    .eq('pretest_session_id', sessionId)
    .single() as { data: { id: string } | null }

  if (existingMetabolic) {
    // Update existing metabolic results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('metabolic_results')
      .update({
        at_hr: atHrNum,
        max_hr: maxHrNum,
        at_max_percent: atMaxPercent,
        recovery_hr_2min: recoveryHrNum,
        recovery_at_percent: recoveryAtPercent,
        recovery_hr: calculatedRecoveryHr,
        metabolic_category: metabolicCategory,
        notes: notes || null,
      })
      .eq('id', existingMetabolic.id)

    if (updateError) {
      console.error('Failed to update metabolic results:', updateError)
      redirect(`/pretests/session/${sessionId}?error=metabolic_update_failed`)
    }
  } else {
    // Insert new metabolic results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('metabolic_results')
      .insert({
        pretest_session_id: sessionId,
        at_hr: atHrNum,
        max_hr: maxHrNum,
        at_max_percent: atMaxPercent,
        recovery_hr_2min: recoveryHrNum,
        recovery_at_percent: recoveryAtPercent,
        recovery_hr: calculatedRecoveryHr,
        metabolic_category: metabolicCategory,
        notes: notes || null,
      })

    if (insertError) {
      console.error('Failed to insert metabolic results:', insertError)
      redirect(`/pretests/session/${sessionId}?error=metabolic_insert_failed`)
    }
  }

  // Update session status to completed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: sessionError } = await (supabase as any)
    .from('pretest_sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)

  if (sessionError) {
    console.error('Failed to update session status:', sessionError)
  }

  revalidatePath('/pretests')
  revalidatePath(`/pretests/${sessionId}`)
  redirect(`/pretests/${sessionId}`)
}

/**
 * Update metabolic results for a completed pre-test
 */
export async function updateMetabolicResults(formData: FormData) {
  const supabase = await createClient()

  const sessionId = formData.get('session_id') as string
  const atHr = formData.get('at_hr') as string
  const maxHr = formData.get('max_hr') as string
  const recoveryHr = formData.get('recovery_hr_2min') as string
  const notes = formData.get('notes') as string

  if (!sessionId) {
    return { error: 'Session ID is required' }
  }

  // Calculate percentages using centralized utility
  const atHrNum = atHr ? parseInt(atHr) : null
  const maxHrNum = maxHr ? parseInt(maxHr) : null
  const recoveryHrNum = recoveryHr ? parseInt(recoveryHr) : null

  const { atMaxPercent, recoveryAtPercent, metabolicCategory, recoveryHr: calculatedRecoveryHr } = calculateMetabolicData({
    atHr: atHrNum,
    maxHr: maxHrNum,
    recoveryHr2min: recoveryHrNum
  })

  // Check if metabolic results exist
  const { data: existingMetabolic } = await supabase
    .from('metabolic_results')
    .select('id')
    .eq('pretest_session_id', sessionId)
    .single() as { data: { id: string } | null }

  if (existingMetabolic) {
    // Update existing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('metabolic_results')
      .update({
        at_hr: atHrNum,
        max_hr: maxHrNum,
        at_max_percent: atMaxPercent,
        recovery_hr_2min: recoveryHrNum,
        recovery_at_percent: recoveryAtPercent,
        recovery_hr: calculatedRecoveryHr,
        metabolic_category: metabolicCategory,
        notes: notes || null,
      })
      .eq('id', existingMetabolic.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Insert new
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('metabolic_results')
      .insert({
        pretest_session_id: sessionId,
        at_hr: atHrNum,
        max_hr: maxHrNum,
        at_max_percent: atMaxPercent,
        recovery_hr_2min: recoveryHrNum,
        recovery_at_percent: recoveryAtPercent,
        recovery_hr: calculatedRecoveryHr,
        metabolic_category: metabolicCategory,
        notes: notes || null,
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath(`/pretests/${sessionId}`)
  return { success: true }
}

/**
 * Update a pre-test step result
 */
export async function updateStepResult(
  sessionId: string,
  stepId: number,
  completionLevel: string,
  notes?: string
) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('pretest_step_results')
    .update({
      completion_level: completionLevel,
      notes: notes || null,
    })
    .eq('pretest_session_id', sessionId)
    .eq('pretest_step_id', stepId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/pretests/${sessionId}`)
  return { success: true }
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
