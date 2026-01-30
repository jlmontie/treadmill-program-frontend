/**
 * Pre-Test Flow Engine
 * 
 * Handles the non-sequential branching logic for pre-test steps.
 * 
 * Flow diagram:
 * - Steps 1-5: Sequential
 * - Step 6 (Gate):
 *   - FAIL → Steps 10 & 11 → OUTCOME A (Developmental)
 *   - PASS → Step 7
 * - Step 7:
 *   - FAIL → Step 12
 *     - FAIL → OUTCOME A (Developmental)  
 *     - PASS → OUTCOME B (Reduced/Level II)
 *   - PASS → Step 8
 * - Step 8:
 *   - FAIL → Step 13
 *     - FAIL → Step 12 (same as Step 7 fail)
 *     - PASS → OUTCOME C (Standard/Level III)
 *   - PASS → OUTCOME D (Advanced/Elite)
 */

export type CompletionLevel = 'complete' | 'slight_touch' | 'push' | 'failure'

export type PretestOutcome = 
  | 'outcome_a' // Developmental (Step 6 fail, or Step 12 fail)
  | 'outcome_b' // Reduced/Level II (Step 7 fail → Step 12 pass)
  | 'outcome_c' // Standard/Level III (Step 8 fail → Step 13 pass)
  | 'outcome_d' // Advanced/Elite (Step 8 pass)
  | null        // Test not complete

export type PretestTypeCode = 'line' | 'standard' | 'ret' | 'ret_female'

export interface StepResult {
  stepNumber: number
  completionLevel: CompletionLevel
}

export interface FlowState {
  currentStep: number | null
  nextSteps: number[]
  isComplete: boolean
  outcome: PretestOutcome
  completedSteps: number[]
  skippedSteps: number[]
  showDevLegOption: boolean // For Outcome A, trainer can optionally add dev_leg program
}

/**
 * Determines if a step result counts as a "failure" for branching purposes.
 * Only 'failure' completion level triggers the failure branch.
 * 'complete', 'slight_touch', and 'push' all count as passing.
 */
export function isStepFailed(completionLevel: CompletionLevel): boolean {
  return completionLevel === 'failure'
}

/**
 * Get the next step(s) based on current results.
 * Returns the flow state including what step to show next.
 */
export function calculateFlowState(
  allSteps: { id: number; step_number: number }[],
  results: Map<number, { stepNumber: number; completionLevel: CompletionLevel }>
): FlowState {
  const completedStepNumbers = Array.from(results.values()).map(r => r.stepNumber)
  const getResult = (stepNum: number) => {
    for (const [, result] of results) {
      if (result.stepNumber === stepNum) return result
    }
    return null
  }

  // Helper to check if a step is done
  const isDone = (stepNum: number) => completedStepNumbers.includes(stepNum)
  const isFailed = (stepNum: number) => {
    const result = getResult(stepNum)
    return result ? isStepFailed(result.completionLevel) : false
  }

  // Track skipped steps
  const skippedSteps: number[] = []
  
  // Steps 1-5 are always sequential
  for (let i = 1; i <= 5; i++) {
    if (!isDone(i)) {
      return {
        currentStep: i,
        nextSteps: [i],
        isComplete: false,
        outcome: null,
        completedSteps: completedStepNumbers,
        skippedSteps,
        showDevLegOption: false,
      }
    }
  }

  // Step 6 - Gate step
  if (!isDone(6)) {
    return {
      currentStep: 6,
      nextSteps: [6],
      isComplete: false,
      outcome: null,
      completedSteps: completedStepNumbers,
      skippedSteps,
      showDevLegOption: false,
    }
  }

  // Step 6 completed - check result
  if (isFailed(6)) {
    // Step 6 failed → do steps 10 & 11 → Outcome A
    skippedSteps.push(7, 8, 9, 12, 13)
    
    if (!isDone(10)) {
      return {
        currentStep: 10,
        nextSteps: [10, 11], // Show both 10 and 11 as they're done together
        isComplete: false,
        outcome: null,
        completedSteps: completedStepNumbers,
        skippedSteps,
        showDevLegOption: false,
      }
    }
    
    if (!isDone(11)) {
      return {
        currentStep: 11,
        nextSteps: [11],
        isComplete: false,
        outcome: null,
        completedSteps: completedStepNumbers,
        skippedSteps,
        showDevLegOption: false,
      }
    }

    // Steps 10 & 11 complete → Outcome A
    return {
      currentStep: null,
      nextSteps: [],
      isComplete: true,
      outcome: 'outcome_a',
      completedSteps: completedStepNumbers,
      skippedSteps,
      showDevLegOption: true, // Trainer can optionally add dev_leg program
    }
  }

  // Step 6 passed → Step 7
  if (!isDone(7)) {
    return {
      currentStep: 7,
      nextSteps: [7],
      isComplete: false,
      outcome: null,
      completedSteps: completedStepNumbers,
      skippedSteps,
      showDevLegOption: false,
    }
  }

  // Step 7 completed - check result
  if (isFailed(7)) {
    // Step 7 failed → go to Step 12
    skippedSteps.push(8, 9, 10, 11, 13)
    
    if (!isDone(12)) {
      return {
        currentStep: 12,
        nextSteps: [12],
        isComplete: false,
        outcome: null,
        completedSteps: completedStepNumbers,
        skippedSteps,
        showDevLegOption: false,
      }
    }

    // Step 12 completed
    if (isFailed(12)) {
      // Step 12 failed → Outcome A (need steps 10 & 11)
      if (!isDone(10)) {
        return {
          currentStep: 10,
          nextSteps: [10, 11],
          isComplete: false,
          outcome: null,
          completedSteps: completedStepNumbers,
          skippedSteps: [...skippedSteps.filter(s => s !== 10 && s !== 11)],
          showDevLegOption: false,
        }
      }
      
      if (!isDone(11)) {
        return {
          currentStep: 11,
          nextSteps: [11],
          isComplete: false,
          outcome: null,
          completedSteps: completedStepNumbers,
          skippedSteps: [...skippedSteps.filter(s => s !== 10 && s !== 11)],
          showDevLegOption: false,
        }
      }

      return {
        currentStep: null,
        nextSteps: [],
        isComplete: true,
        outcome: 'outcome_a',
        completedSteps: completedStepNumbers,
        skippedSteps: [...skippedSteps.filter(s => s !== 10 && s !== 11)],
        showDevLegOption: true,
      }
    } else {
      // Step 12 passed → Outcome B
      return {
        currentStep: null,
        nextSteps: [],
        isComplete: true,
        outcome: 'outcome_b',
        completedSteps: completedStepNumbers,
        skippedSteps,
        showDevLegOption: false,
      }
    }
  }

  // Step 7 passed → Step 8
  if (!isDone(8)) {
    skippedSteps.push(9, 10, 11, 12, 13) // These may be used later based on result
    return {
      currentStep: 8,
      nextSteps: [8],
      isComplete: false,
      outcome: null,
      completedSteps: completedStepNumbers,
      skippedSteps: [], // Don't show as skipped yet
      showDevLegOption: false,
    }
  }

  // Step 8 completed - check result  
  if (isFailed(8)) {
    // Step 8 failed → go to Step 13
    skippedSteps.push(9, 10, 11)
    
    if (!isDone(13)) {
      return {
        currentStep: 13,
        nextSteps: [13],
        isComplete: false,
        outcome: null,
        completedSteps: completedStepNumbers,
        skippedSteps,
        showDevLegOption: false,
      }
    }

    // Step 13 completed
    if (isFailed(13)) {
      // Step 13 failed → go to Step 12
      if (!isDone(12)) {
        return {
          currentStep: 12,
          nextSteps: [12],
          isComplete: false,
          outcome: null,
          completedSteps: completedStepNumbers,
          skippedSteps: [...skippedSteps.filter(s => s !== 12)],
          showDevLegOption: false,
        }
      }

      // Step 12 completed (after Step 13 fail)
      if (isFailed(12)) {
        // Step 12 failed → Outcome A (need steps 10 & 11)
        if (!isDone(10)) {
          return {
            currentStep: 10,
            nextSteps: [10, 11],
            isComplete: false,
            outcome: null,
            completedSteps: completedStepNumbers,
            skippedSteps: [...skippedSteps.filter(s => s !== 10 && s !== 11 && s !== 12)],
            showDevLegOption: false,
          }
        }
        
        if (!isDone(11)) {
          return {
            currentStep: 11,
            nextSteps: [11],
            isComplete: false,
            outcome: null,
            completedSteps: completedStepNumbers,
            skippedSteps: [...skippedSteps.filter(s => s !== 10 && s !== 11 && s !== 12)],
            showDevLegOption: false,
          }
        }

        return {
          currentStep: null,
          nextSteps: [],
          isComplete: true,
          outcome: 'outcome_a',
          completedSteps: completedStepNumbers,
          skippedSteps: [...skippedSteps.filter(s => s !== 10 && s !== 11 && s !== 12)],
          showDevLegOption: true,
        }
      } else {
        // Step 12 passed (after Step 13 fail) → Outcome B
        return {
          currentStep: null,
          nextSteps: [],
          isComplete: true,
          outcome: 'outcome_b',
          completedSteps: completedStepNumbers,
          skippedSteps: [...skippedSteps.filter(s => s !== 12)],
          showDevLegOption: false,
        }
      }
    } else {
      // Step 13 passed → Outcome C
      return {
        currentStep: null,
        nextSteps: [],
        isComplete: true,
        outcome: 'outcome_c',
        completedSteps: completedStepNumbers,
        skippedSteps,
        showDevLegOption: false,
      }
    }
  }

  // Step 8 passed → Outcome D (Advanced/Elite)
  return {
    currentStep: null,
    nextSteps: [],
    isComplete: true,
    outcome: 'outcome_d',
    completedSteps: completedStepNumbers,
    skippedSteps: [9, 10, 11, 12, 13],
    showDevLegOption: false,
  }
}

/**
 * Get the program prefix based on pre-test outcome and type
 */
export function getProgramPrefix(
  outcome: PretestOutcome,
  pretestTypeCode: PretestTypeCode
): string[] {
  if (!outcome) return []

  switch (outcome) {
    case 'outcome_a': // Developmental
      switch (pretestTypeCode) {
        case 'line':
          return ['dev_line'] // + optional dev_leg
        case 'standard':
          return ['dev_standard'] // + optional dev_leg  
        case 'ret':
        case 'ret_female':
          return ['red_standard']
      }
      break

    case 'outcome_b': // Reduced/Level II
      switch (pretestTypeCode) {
        case 'line':
          return ['red_line']
        case 'standard':
          return ['red_standard']
        case 'ret':
          return ['ii_standard']
        case 'ret_female':
          return ['ii_female']
      }
      break

    case 'outcome_c': // Standard/Level III
      switch (pretestTypeCode) {
        case 'line':
          return ['standard_line']
        case 'standard':
          return ['standard_standard']
        case 'ret':
        case 'ret_female':
          return ['adv_standard']
      }
      break

    case 'outcome_d': // Advanced/Elite
      switch (pretestTypeCode) {
        case 'line':
          return ['adv_line']
        case 'standard':
          return ['adv_standard']
        case 'ret':
          return ['iii_standard']
        case 'ret_female':
          return ['iii_female']
      }
      break
  }

  return []
}

/**
 * Get the metabolic suffix based on at_mx_percent
 */
export function getMetabolicSuffix(atMxPercent: number | null): '_la' | '_standard' | '_low' {
  if (atMxPercent === null) return '_standard' // Default if no metabolic data
  
  if (atMxPercent < 88) {
    return '_la' // High lactic acid
  } else if (atMxPercent < 94) {
    return '_standard'
  } else {
    return '_low' // Low metabolic need
  }
}

/**
 * Build the full program code(s) from outcome, pretest type, and metabolic data
 */
export function buildProgramCodes(
  outcome: PretestOutcome,
  pretestTypeCode: PretestTypeCode,
  atMxPercent: number | null,
  includeDevLeg: boolean = false
): string[] {
  const prefixes = getProgramPrefix(outcome, pretestTypeCode)
  const suffix = getMetabolicSuffix(atMxPercent)
  
  const codes = prefixes.map(prefix => `${prefix}${suffix}`)
  
  // Add dev_leg option if applicable
  if (includeDevLeg && outcome === 'outcome_a' && 
      (pretestTypeCode === 'line' || pretestTypeCode === 'standard')) {
    codes.push(`dev_leg${suffix}`)
  }
  
  return codes
}

/**
 * Get human-readable outcome description
 */
export function getOutcomeDescription(outcome: PretestOutcome): string {
  switch (outcome) {
    case 'outcome_a':
      return 'Developmental Program'
    case 'outcome_b':
      return 'Reduced Speed / Level II Program'
    case 'outcome_c':
      return 'Standard / Level III Program'
    case 'outcome_d':
      return 'Advanced / Elite Program'
    default:
      return 'Test in progress'
  }
}

/**
 * Map program code prefix to human-readable name
 */
export function getProgramPrefixName(prefix: string): string {
  const prefixMap: Record<string, string> = {
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
  return prefixMap[prefix] || prefix
}

/**
 * Get human-readable metabolic category name
 */
export function getMetabolicCategoryName(suffix: '_la' | '_standard' | '_low' | string): string {
  switch (suffix) {
    case '_la':
      return 'High Lactic Acid'
    case '_standard':
      return 'Standard'
    case '_low':
      return 'Low Metabolic'
    default:
      return 'Standard'
  }
}

/**
 * Build human-readable program recommendation
 * Returns array of { name: string, code: string } for display
 */
export function buildProgramRecommendations(
  outcome: PretestOutcome,
  pretestTypeCode: PretestTypeCode,
  atMxPercent: number | null,
  includeDevLeg: boolean = false
): { name: string; metabolicCategory: string }[] {
  const prefixes = getProgramPrefix(outcome, pretestTypeCode)
  const suffix = getMetabolicSuffix(atMxPercent)
  const metabolicName = getMetabolicCategoryName(suffix)
  
  const recommendations = prefixes.map(prefix => ({
    name: getProgramPrefixName(prefix),
    metabolicCategory: metabolicName,
  }))
  
  // Add dev_leg option if applicable
  if (includeDevLeg && outcome === 'outcome_a' && 
      (pretestTypeCode === 'line' || pretestTypeCode === 'standard')) {
    recommendations.push({
      name: getProgramPrefixName('dev_leg'),
      metabolicCategory: metabolicName,
    })
  }
  
  return recommendations
}

/**
 * Get outcome color for UI
 */
export function getOutcomeColor(outcome: PretestOutcome): string {
  switch (outcome) {
    case 'outcome_a':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    case 'outcome_b':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    case 'outcome_c':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'outcome_d':
      return 'text-violet-400 bg-violet-500/10 border-violet-500/30'
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
  }
}
