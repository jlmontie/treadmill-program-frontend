import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { calculateMetabolicData } from '@/lib/metabolic'

/**
 * Input data for metabolic results
 */
export interface MetabolicInput {
  atHr: number | null
  maxHr: number | null
  recoveryHr2min?: number | null
  speedOnly?: boolean
  notes?: string | null
}

/**
 * Upsert metabolic results for a pretest session.
 * Automatically calculates derived values (percentages, category) from input.
 * 
 * @param supabase - The typed Supabase client
 * @param sessionId - The pretest session ID
 * @param input - The metabolic input data
 * @returns Object with success status and optional error message
 * 
 * @example
 * ```ts
 * const result = await upsertMetabolicResults(supabase, sessionId, {
 *   atHr: 150,
 *   maxHr: 180,
 *   recoveryHr2min: 120,
 *   notes: 'Good recovery'
 * })
 * ```
 */
export async function upsertMetabolicResults(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  input: MetabolicInput
): Promise<{ success: boolean; error?: string }> {
  const { atHr, maxHr, recoveryHr2min, speedOnly, notes } = input
  
  // Calculate derived values using centralized utility
  const { atMaxPercent, recoveryAtPercent, metabolicCategory, recoveryHr } = calculateMetabolicData({
    atHr,
    maxHr,
    recoveryHr2min: recoveryHr2min ?? null,
    speedOnly
  })

  const metabolicData = {
    at_hr: atHr,
    max_hr: maxHr,
    at_max_percent: atMaxPercent,
    recovery_hr_2min: recoveryHr2min ?? null,
    recovery_at_percent: recoveryAtPercent,
    recovery_hr: recoveryHr,
    metabolic_category: metabolicCategory,
    notes: notes || null,
  }

  // Check if metabolic results already exist for this session
  const { data: existingResults } = await supabase
    .from('metabolic_results')
    .select('id')
    .eq('pretest_session_id', sessionId)
    .single()

  if (existingResults) {
    // Update existing results
    const { error: updateError } = await supabase
      .from('metabolic_results')
      .update(metabolicData)
      .eq('id', existingResults.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }
  } else {
    // Insert new results
    const { error: insertError } = await supabase
      .from('metabolic_results')
      .insert({
        pretest_session_id: sessionId,
        ...metabolicData,
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }
  }

  return { success: true }
}

/**
 * Get existing metabolic results for a pretest session
 */
export async function getMetabolicResults(
  supabase: SupabaseClient<Database>,
  sessionId: string
) {
  const { data, error } = await supabase
    .from('metabolic_results')
    .select('*')
    .eq('pretest_session_id', sessionId)
    .single()

  return { data, error }
}
