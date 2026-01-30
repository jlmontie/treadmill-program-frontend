/**
 * Workout #3 Program Adjustment Logic
 * 
 * After workout #3, analyze speed column usage to recommend program adjustments:
 * - ≥50% column 1 (lower speeds) → recommend downgrade
 * - ≥50% column 3 (higher speeds) → recommend upgrade  
 * - Otherwise → no adjustment needed
 */

export type AdjustmentRecommendation = 'upgrade' | 'downgrade' | 'no_change'

export interface SpeedColumnAnalysis {
  totalExercises: number
  column1Count: number
  column2Count: number
  column3Count: number
  column1Percent: number
  column2Percent: number
  column3Percent: number
  recommendation: AdjustmentRecommendation
  recommendationText: string
}

/**
 * Analyze speed column usage from workout results
 */
export function analyzeSpeedColumnUsage(
  exerciseResults: Array<{ speed_column_used: number | null }>
): SpeedColumnAnalysis {
  const resultsWithColumn = exerciseResults.filter(r => r.speed_column_used !== null)
  const totalExercises = resultsWithColumn.length

  if (totalExercises === 0) {
    return {
      totalExercises: 0,
      column1Count: 0,
      column2Count: 0,
      column3Count: 0,
      column1Percent: 0,
      column2Percent: 0,
      column3Percent: 0,
      recommendation: 'no_change',
      recommendationText: 'No speed data available for analysis',
    }
  }

  const column1Count = resultsWithColumn.filter(r => r.speed_column_used === 1).length
  const column2Count = resultsWithColumn.filter(r => r.speed_column_used === 2).length
  const column3Count = resultsWithColumn.filter(r => r.speed_column_used === 3).length

  const column1Percent = Math.round((column1Count / totalExercises) * 100)
  const column2Percent = Math.round((column2Count / totalExercises) * 100)
  const column3Percent = Math.round((column3Count / totalExercises) * 100)

  let recommendation: AdjustmentRecommendation = 'no_change'
  let recommendationText = ''

  if (column1Percent >= 50) {
    recommendation = 'downgrade'
    recommendationText = `Athlete used lower speeds (column 1) for ${column1Percent}% of exercises. Consider moving to a less challenging program.`
  } else if (column3Percent >= 50) {
    recommendation = 'upgrade'
    recommendationText = `Athlete used higher speeds (column 3) for ${column3Percent}% of exercises. Consider moving to a more challenging program.`
  } else {
    recommendation = 'no_change'
    recommendationText = 'Current program level appears appropriate. No adjustment recommended.'
  }

  return {
    totalExercises,
    column1Count,
    column2Count,
    column3Count,
    column1Percent,
    column2Percent,
    column3Percent,
    recommendation,
    recommendationText,
  }
}

/**
 * Get the next program level (upgrade/downgrade)
 * Returns the program code prefix that should be used
 */
export function getAdjustedProgramPrefix(
  currentPrefix: string,
  direction: 'upgrade' | 'downgrade'
): string | null {
  // Program level hierarchy (lowest to highest)
  const levelHierarchy = [
    'dev_leg',
    'dev_line',
    'dev_standard',
    'red_line',
    'red_standard',
    'standard_line',
    'standard_standard',
    'adv_line',
    'adv_standard',
    'ii_standard',
    'ii_female',
    'iii_standard',
    'iii_female',
  ]

  // Extract the base prefix (without _la, _standard, _low suffix)
  const basePrefixMatch = currentPrefix.match(/^(.+?)(?:_la|_standard|_low)?$/)
  if (!basePrefixMatch) return null
  
  const basePrefix = basePrefixMatch[1]
  const currentIndex = levelHierarchy.indexOf(basePrefix)
  
  if (currentIndex === -1) return null

  if (direction === 'upgrade') {
    // Move up in hierarchy
    const nextIndex = currentIndex + 1
    if (nextIndex < levelHierarchy.length) {
      return levelHierarchy[nextIndex]
    }
    return null // Already at highest level
  } else {
    // Move down in hierarchy
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      return levelHierarchy[prevIndex]
    }
    return null // Already at lowest level
  }
}

/**
 * Check if a workout is workout #3 (requires adjustment analysis)
 */
export function isWorkout3(workoutNumber: number): boolean {
  return workoutNumber === 3
}

/**
 * Get human-readable program name from prefix
 */
export function getProgramLevelName(prefix: string): string {
  const nameMap: Record<string, string> = {
    'dev_leg': 'Developmental Leg Strength',
    'dev_line': 'Developmental Line',
    'dev_standard': 'Developmental',
    'red_line': 'Reduced Line',
    'red_standard': 'Reduced',
    'standard_line': 'Standard Line',
    'standard_standard': 'Standard',
    'adv_line': 'Advanced Line',
    'adv_standard': 'Advanced',
    'ii_standard': 'Level II',
    'ii_female': 'Level II Female',
    'iii_standard': 'Level III',
    'iii_female': 'Level III Female',
  }
  return nameMap[prefix] || prefix
}
