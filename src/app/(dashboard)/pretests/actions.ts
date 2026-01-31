'use server'

import { createClient } from '@/lib/supabase/server'
import { withAuth, getAuthenticatedClient } from '@/lib/supabase/auth'
import { upsertMetabolicResults } from '@/lib/supabase/metabolic'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { type ActionResult, failure, successVoid } from '@/lib/types/actions'

// Validation schemas
const StartPretestSchema = z.object({
  athlete_id: z.string().uuid('Invalid athlete ID'),
  pretest_type_id: z.coerce.number().int().positive('Pretest type ID must be a positive integer'),
})

const MetabolicResultsSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  at_hr: z.coerce.number().int().min(40).max(250).optional().nullable(),
  max_hr: z.coerce.number().int().min(60).max(250).optional().nullable(),
  recovery_hr_2min: z.coerce.number().int().min(40).max(250).optional().nullable(),
  notes: z.string().max(1000).transform(s => s.trim()).optional().nullable(),
})

const StepResultSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  stepId: z.number().int().positive('Step ID must be a positive integer'),
  completionLevel: z.enum(['complete', 'slight_touch', 'push', 'failure']),
  notes: z.string().max(500).transform(s => s.trim()).optional(),
})

/**
 * Start a new pre-test session
 */
export async function startPretest(formData: FormData): Promise<void> {
  // Authenticate and get trainer
  const authResult = await withAuth()
  if (!authResult.success) {
    redirect('/login')
  }
  const { supabase, trainer } = authResult.data

  // Validate input
  const validated = StartPretestSchema.safeParse({
    athlete_id: formData.get('athlete_id'),
    pretest_type_id: formData.get('pretest_type_id'),
  })

  if (!validated.success) {
    redirect('/pretests/new?error=invalid_input')
  }

  const { athlete_id, pretest_type_id } = validated.data

  // Create the pre-test session
  const { data: session, error } = await supabase
    .from('pretest_sessions')
    .insert({
      athlete_id,
      trainer_id: trainer.id,
      pretest_type_id,
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
): Promise<ActionResult<void>> {
  // Authenticate
  const authResult = await withAuth()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate input
  const validated = StepResultSchema.safeParse({
    sessionId,
    stepId,
    completionLevel,
    notes: notes?.trim() || undefined,
  })

  if (!validated.success) {
    const firstError = Object.values(validated.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError)
  }

  const { error } = await supabase
    .from('pretest_step_results')
    .upsert({
      pretest_session_id: validated.data.sessionId,
      pretest_step_id: validated.data.stepId,
      completion_level: validated.data.completionLevel,
      notes: validated.data.notes || null,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'pretest_session_id,pretest_step_id'
    })

  if (error) {
    return failure(error.message)
  }

  revalidatePath(`/pretests/session/${sessionId}`)
  return successVoid()
}

/**
 * Save metabolic results and complete the pre-test
 */
export async function completePretest(formData: FormData): Promise<void> {
  // Authenticate
  try {
    const { supabase } = await getAuthenticatedClient()

    // Validate input - allow null/empty HR values since they're optional
    const sessionId = formData.get('session_id') as string
    const atHrRaw = formData.get('at_hr') as string
    const maxHrRaw = formData.get('max_hr') as string
    const recoveryHrRaw = formData.get('recovery_hr_2min') as string
    const notes = (formData.get('notes') as string)?.trim() || null

    // Validate session ID
    const sessionIdSchema = z.string().uuid('Invalid session ID')
    const sessionIdResult = sessionIdSchema.safeParse(sessionId)
    if (!sessionIdResult.success) {
      redirect('/pretests')
    }

    // Parse HR values safely with Zod
    const hrSchema = z.coerce.number().int().min(40).max(250).optional()
    const atHrNum = atHrRaw ? hrSchema.safeParse(atHrRaw).data ?? null : null
    const maxHrNum = maxHrRaw ? hrSchema.safeParse(maxHrRaw).data ?? null : null
    const recoveryHrNum = recoveryHrRaw ? hrSchema.safeParse(recoveryHrRaw).data ?? null : null

    // Use the shared upsert utility for metabolic results
    const result = await upsertMetabolicResults(supabase, sessionId, {
      atHr: atHrNum,
      maxHr: maxHrNum,
      recoveryHr2min: recoveryHrNum,
      notes,
    })

    if (!result.success) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save metabolic results:', result.error)
      }
      redirect(`/pretests/session/${sessionId}?error=metabolic_failed`)
    }

    // Update session status to completed
    const { error: sessionError } = await supabase
      .from('pretest_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId)

    if (sessionError && process.env.NODE_ENV === 'development') {
      console.error('Failed to update session status:', sessionError)
    }

    revalidatePath('/pretests')
    revalidatePath(`/pretests/${sessionId}`)
    redirect(`/pretests/${sessionId}`)
  } catch {
    redirect('/login')
  }
}

/**
 * Update metabolic results for a completed pre-test
 */
export async function updateMetabolicResults(formData: FormData): Promise<ActionResult<void>> {
  // Authenticate
  const authResult = await withAuth()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate input
  const validated = MetabolicResultsSchema.safeParse({
    session_id: formData.get('session_id'),
    at_hr: formData.get('at_hr') || null,
    max_hr: formData.get('max_hr') || null,
    recovery_hr_2min: formData.get('recovery_hr_2min') || null,
    notes: formData.get('notes') || null,
  })

  if (!validated.success) {
    const firstError = Object.values(validated.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError)
  }

  const { session_id, at_hr, max_hr, recovery_hr_2min, notes } = validated.data

  // Use the shared upsert utility for metabolic results
  const result = await upsertMetabolicResults(supabase, session_id, {
    atHr: at_hr ?? null,
    maxHr: max_hr ?? null,
    recoveryHr2min: recovery_hr_2min ?? null,
    notes: notes || null,
  })

  if (!result.success) {
    return failure(result.error || 'Failed to update metabolic results')
  }

  revalidatePath(`/pretests/${session_id}`)
  return successVoid()
}

/**
 * Update a pre-test step result
 */
export async function updateStepResult(
  sessionId: string,
  stepId: number,
  completionLevel: string,
  notes?: string
): Promise<ActionResult<void>> {
  // Authenticate
  const authResult = await withAuth()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate input
  const validated = StepResultSchema.safeParse({
    sessionId,
    stepId,
    completionLevel,
    notes: notes?.trim() || undefined,
  })

  if (!validated.success) {
    const firstError = Object.values(validated.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError)
  }

  const { error } = await supabase
    .from('pretest_step_results')
    .update({
      completion_level: validated.data.completionLevel,
      notes: validated.data.notes || null,
    })
    .eq('pretest_session_id', validated.data.sessionId)
    .eq('pretest_step_id', validated.data.stepId)

  if (error) {
    return failure(error.message)
  }

  revalidatePath(`/pretests/${sessionId}`)
  return successVoid()
}

/**
 * Cancel/delete a pre-test session
 */
export async function cancelPretest(sessionId: string): Promise<ActionResult<void>> {
  // Authenticate
  const authResult = await withAuth()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data

  // Validate session ID
  const sessionIdSchema = z.string().uuid('Invalid session ID')
  const result = sessionIdSchema.safeParse(sessionId)
  if (!result.success) {
    return failure('Invalid session ID')
  }

  const { error } = await supabase
    .from('pretest_sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/pretests')
  redirect('/pretests')
}
