/**
 * Retry utility for server actions and async operations
 * 
 * Provides automatic retry with exponential backoff for transient failures
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number
  /** Function to determine if error is retryable (default: all errors are retryable) */
  isRetryable?: (error: unknown) => boolean
  /** Callback fired on each retry attempt */
  onRetry?: (attempt: number, error: unknown) => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'isRetryable'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attempt: number, options: Required<Omit<RetryOptions, 'onRetry' | 'isRetryable'>>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1)
  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() - 0.5)
  return Math.min(delay + jitter, options.maxDelay)
}

/**
 * Default function to determine if an error is retryable
 * Network errors and 5xx errors are typically retryable
 */
function defaultIsRetryable(error: unknown): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  
  // Server errors (if we have a status)
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status
    return status >= 500 && status < 600
  }
  
  // Generic errors are assumed retryable
  return true
}

/**
 * Execute an async function with automatic retry
 * 
 * @example
 * const result = await withRetry(
 *   () => saveExerciseResult(data),
 *   { maxRetries: 3, onRetry: (attempt) => console.log(`Retry ${attempt}`) }
 * )
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const isRetryable = options.isRetryable ?? defaultIsRetryable
  
  let lastError: unknown
  
  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Check if we should retry
      if (attempt > opts.maxRetries || !isRetryable(error)) {
        throw error
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts)
      
      // Notify about retry
      options.onRetry?.(attempt, error)
      
      await sleep(delay)
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError
}

/**
 * Result type for retry operations that return { error } or { success }
 */
export type ActionResult<T = unknown> = 
  | { success: true; data?: T }
  | { error: string }

/**
 * Retry a server action that returns { error } or { success }
 * Returns the last error message if all retries fail
 * 
 * @example
 * const result = await retryAction(
 *   () => completeExercise(formData),
 *   { maxRetries: 2 }
 * )
 * if (result.error) {
 *   toast.error(result.error)
 * }
 */
export async function retryAction<T>(
  fn: () => Promise<ActionResult<T> | void>,
  options: RetryOptions = {}
): Promise<ActionResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  let lastError: string = 'Unknown error'
  
  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      const result = await fn()
      
      // If no result or success, we're done
      if (!result || 'success' in result) {
        return result || { success: true }
      }
      
      // If error, check if we should retry
      if ('error' in result) {
        lastError = result.error
        
        if (attempt > opts.maxRetries) {
          return { error: lastError }
        }
        
        // Notify and wait
        options.onRetry?.(attempt, new Error(result.error))
        const delay = calculateDelay(attempt, opts)
        await sleep(delay)
      }
    } catch (error) {
      // Unexpected error (network, etc)
      lastError = error instanceof Error ? error.message : 'Network error'
      
      if (attempt > opts.maxRetries) {
        return { error: lastError }
      }
      
      options.onRetry?.(attempt, error)
      const delay = calculateDelay(attempt, opts)
      await sleep(delay)
    }
  }
  
  return { error: lastError }
}
