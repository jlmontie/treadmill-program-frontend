import { createClient } from './server'
import { failure } from '@/lib/types/actions'
import { rateLimitStandard, type RateLimitConfig, rateLimit } from '@/lib/rate-limit'

/**
 * Custom error class for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Custom error class for trainer profile not found
 */
export class TrainerNotFoundError extends Error {
  constructor(message: string = 'Trainer profile not found') {
    super(message)
    this.name = 'TrainerNotFoundError'
  }
}

/**
 * Get an authenticated Supabase client with the current user.
 * Throws AuthenticationError if no user is logged in.
 * 
 * @example
 * ```ts
 * const { supabase, user } = await getAuthenticatedClient()
 * ```
 */
export async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new AuthenticationError()
  }
  
  return { supabase, user }
}

/**
 * Get the current trainer's profile with an authenticated client.
 * Throws AuthenticationError if not logged in.
 * Throws TrainerNotFoundError if no trainer profile exists.
 * 
 * @example
 * ```ts
 * const { supabase, trainer } = await getCurrentTrainer()
 * // trainer.id is now available
 * ```
 */
export async function getCurrentTrainer() {
  const { supabase, user } = await getAuthenticatedClient()
  
  const { data: trainer, error } = await supabase
    .from('trainers')
    .select('id, name, email')
    .eq('auth_user_id', user.id)
    .single()
  
  if (error || !trainer) {
    throw new TrainerNotFoundError()
  }
  
  return { supabase, trainer, user }
}

/**
 * Helper type for the result of getCurrentTrainer
 */
export type CurrentTrainerResult = Awaited<ReturnType<typeof getCurrentTrainer>>

/**
 * Wrapper that handles auth errors and returns ActionResult format.
 * Use this in server actions for consistent error handling.
 * 
 * @example
 * ```ts
 * export async function myAction(formData: FormData) {
 *   const authResult = await withAuth()
 *   if (!authResult.success) return authResult
 *   const { supabase, trainer } = authResult.data
 *   // ... rest of action
 * }
 * ```
 */
export async function withAuth() {
  try {
    const result = await getCurrentTrainer()
    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return failure('You must be logged in to perform this action')
    }
    if (error instanceof TrainerNotFoundError) {
      return failure('Trainer profile not found. Please complete your profile setup.')
    }
    return failure('An unexpected authentication error occurred')
  }
}

/**
 * Wrapper that handles auth AND rate limiting.
 * Use this for actions that should be rate limited.
 * 
 * @param rateLimitConfig - Optional custom rate limit config (defaults to 30 req/min)
 * 
 * @example
 * ```ts
 * export async function createSomething(formData: FormData) {
 *   const authResult = await withAuthRateLimited()
 *   if (!authResult.success) return authResult
 *   const { supabase, trainer } = authResult.data
 *   // ... rest of action
 * }
 * 
 * // With custom rate limit
 * const authResult = await withAuthRateLimited({ limit: 5, windowSeconds: 60 })
 * ```
 */
export async function withAuthRateLimited(rateLimitConfig?: RateLimitConfig) {
  try {
    const result = await getCurrentTrainer()
    
    // Apply rate limiting based on user ID
    const rateLimitResult = rateLimitConfig 
      ? rateLimit(result.user.id, rateLimitConfig)
      : rateLimitStandard(result.user.id)
    
    if (!rateLimitResult.success) {
      return failure(`Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`)
    }
    
    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return failure('You must be logged in to perform this action')
    }
    if (error instanceof TrainerNotFoundError) {
      return failure('Trainer profile not found. Please complete your profile setup.')
    }
    return failure('An unexpected authentication error occurred')
  }
}
