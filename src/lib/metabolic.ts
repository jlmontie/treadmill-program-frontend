/**
 * Metabolic calculation utilities
 * Centralizes all heart rate and metabolic category calculations
 */

export interface MetabolicInput {
  atHr: number | null
  maxHr: number | null
  recoveryHr2min?: number | null
  /** If true, use speed-only mode (low metabolic need) - Recovery HR = maxHr × 75% */
  speedOnly?: boolean
}

export interface MetabolicCalculations {
  atMaxPercent: number | null
  recoveryAtPercent: number | null
  metabolicCategory: 'la' | 'standard' | 'low' | null
  /** 
   * Recovery HR - the target HR at which athlete returns to treadmill for next exercise.
   * Calculated from Recovery/AT% and Max HR, or overridden with speedOnly mode.
   */
  recoveryHr: number | null
}

/**
 * Calculate metabolic data from heart rate inputs
 * 
 * @param input - Heart rate values (AT, Max, Recovery) and optional speedOnly flag
 * @returns Calculated percentages, metabolic category, and recovery HR target
 * 
 * Metabolic Category Thresholds:
 * - High Lactic Acid (la): AT/Max < 88%
 * - Standard: AT/Max 88-93%
 * - Low Metabolic (low): AT/Max >= 94%
 * 
 * Recovery HR Calculation (target HR to return to treadmill):
 * - Recovery/AT% < 85%: maxHr × 82% (rounded up)
 * - Recovery/AT% 85-92%: maxHr × 80% (rounded up)
 * - Recovery/AT% > 92%: maxHr × 78% (rounded up)
 * - Speed only override: maxHr × 75% (rounded up)
 */
export function calculateMetabolicData(input: MetabolicInput): MetabolicCalculations {
  const { atHr, maxHr, recoveryHr2min, speedOnly } = input
  
  // AT/Max percentage - indicates anaerobic threshold relative to max capacity
  const atMaxPercent = atHr && maxHr 
    ? (atHr / maxHr) * 100 
    : null
  
  // Recovery/AT percentage - indicates cardiovascular conditioning
  // Lower values = better recovery (heart rate drops faster)
  const recoveryAtPercent = recoveryHr2min && atHr 
    ? (recoveryHr2min / atHr) * 100 
    : null
  
  // Metabolic category determines program suffix (LA, Standard, Low)
  let metabolicCategory: 'la' | 'standard' | 'low' | null = null
  if (atMaxPercent !== null) {
    if (atMaxPercent < 88) {
      metabolicCategory = 'la'
    } else if (atMaxPercent >= 94) {
      metabolicCategory = 'low'
    } else {
      metabolicCategory = 'standard'
    }
  }
  
  // Recovery HR - target HR for returning to treadmill between exercises
  const recoveryHr = calculateRecoveryHr(maxHr, recoveryAtPercent, speedOnly)
  
  return { atMaxPercent, recoveryAtPercent, metabolicCategory, recoveryHr }
}

/**
 * Calculate the Recovery HR target (HR at which athlete returns to treadmill)
 * 
 * @param maxHr - Maximum heart rate
 * @param recoveryAtPercent - Recovery HR (2min) / AT HR percentage
 * @param speedOnly - If true, use speed-only mode (low metabolic need)
 * @returns Recovery HR target, rounded up to nearest integer
 */
export function calculateRecoveryHr(
  maxHr: number | null, 
  recoveryAtPercent: number | null,
  speedOnly?: boolean
): number | null {
  if (!maxHr) return null
  
  // Speed-only override (low metabolic need) - use 75% of max HR
  if (speedOnly) {
    return Math.ceil(maxHr * 0.75)
  }
  
  // If no recovery percentage available, can't calculate
  if (recoveryAtPercent === null) return null
  
  // Determine multiplier based on recovery conditioning
  let multiplier: number
  if (recoveryAtPercent < 85) {
    // Poorer recovery - higher target HR (82%)
    multiplier = 0.82
  } else if (recoveryAtPercent <= 92) {
    // Moderate recovery - standard target HR (80%)
    multiplier = 0.80
  } else {
    // Better recovery - lower target HR (78%)
    multiplier = 0.78
  }
  
  return Math.ceil(maxHr * multiplier)
}

/**
 * Get human-readable label for metabolic category
 */
export function getMetabolicCategoryLabel(category: 'la' | 'standard' | 'low' | null): string {
  switch (category) {
    case 'la': return 'High Lactic Acid'
    case 'low': return 'Low Metabolic'
    case 'standard': return 'Standard'
    default: return '—'
  }
}

/**
 * Get short label for metabolic category (for compact displays)
 */
export function getMetabolicCategoryShortLabel(category: 'la' | 'standard' | 'low' | null): string {
  switch (category) {
    case 'la': return 'High LA'
    case 'low': return 'Low Met'
    case 'standard': return 'Standard'
    default: return '—'
  }
}
