import { z } from 'zod'

// ============================================================================
// Profile Form
// ============================================================================

export const profileFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform(s => s.trim()),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

// ============================================================================
// Helper for HR fields (string-based for form compatibility)
// ============================================================================

// For optional HR: validates string representation of number
const optionalHrField = z
  .string()
  .refine((val) => {
    if (val === '') return true
    const num = parseInt(val, 10)
    return !isNaN(num) && num >= 60 && num <= 220
  }, { message: 'Must be a whole number between 60 and 220' })

// For required HR: validates string representation of number  
const requiredHrField = z
  .string()
  .min(1, { message: 'Required' })
  .refine((val) => {
    const num = parseInt(val, 10)
    return !isNaN(num) && num >= 60 && num <= 220
  }, { message: 'Must be a whole number between 60 and 220' })

// ============================================================================
// Metabolic Test Form (Athlete Detail Page)
// ============================================================================

export const metabolicTestFormSchema = z.object({
  at_hr: requiredHrField,
  max_hr: requiredHrField,
  recovery_hr_2min: optionalHrField,
  speed_only: z.boolean().default(false),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .transform(s => s.trim())
    .optional()
    .default(''),
})

export type MetabolicTestFormValues = z.infer<typeof metabolicTestFormSchema>

// ============================================================================
// Assign Program Form
// ============================================================================

export const assignProgramFormSchema = z.object({
  program_id: z.string().min(1, 'Please select a program'),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .transform(s => s.trim())
    .optional()
    .default(''),
})

export type AssignProgramFormValues = z.infer<typeof assignProgramFormSchema>

// ============================================================================
// New Athlete Form
// ============================================================================

export const newAthleteFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform(s => s.trim()),
  gender: z.enum(['male', 'female'], { message: 'Gender is required' }),
  sport: z
    .string()
    .max(100, 'Sport must be 100 characters or less')
    .transform(s => s.trim())
    .optional()
    .default(''),
  position: z
    .string()
    .max(100, 'Position must be 100 characters or less')
    .transform(s => s.trim())
    .optional()
    .default(''),
  birth_date: z.string().optional().default(''),
  head_size: z.enum(['small', 'medium', 'large']).optional(),
  chest_size: z.enum(['small', 'medium', 'large']).optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .transform(s => s.trim())
    .optional()
    .default(''),
})

export type NewAthleteFormValues = z.infer<typeof newAthleteFormSchema>

// ============================================================================
// Workout Complete Form
// ============================================================================

export const workoutCompleteFormSchema = z.object({
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less'),
})

export type WorkoutCompleteFormValues = z.infer<typeof workoutCompleteFormSchema>
export type WorkoutCompleteFormInput = z.input<typeof workoutCompleteFormSchema>

// ============================================================================
// Metabolic Results Form (Pretest completion)
// ============================================================================

export const metabolicResultsFormSchema = z.object({
  at_hr: optionalHrField,
  max_hr: optionalHrField,
  recovery_hr_2min: optionalHrField,
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less'),
})

export type MetabolicResultsFormValues = z.infer<typeof metabolicResultsFormSchema>

// ============================================================================
// Edit Metabolic Form
// ============================================================================

export const editMetabolicFormSchema = z.object({
  at_hr: optionalHrField,
  max_hr: optionalHrField,
  recovery_hr_2min: optionalHrField,
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less'),
})

export type EditMetabolicFormValues = z.infer<typeof editMetabolicFormSchema>
