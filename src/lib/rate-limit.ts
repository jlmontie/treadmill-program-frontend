/**
 * Simple in-memory rate limiting for server actions
 * 
 * Note: This is suitable for single-instance deployments.
 * For multi-instance deployments (e.g., serverless), consider using
 * Redis-based rate limiting or Vercel's built-in rate limiting.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
let cleanupTimer: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupTimer) return
  
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
  
  // Don't prevent process from exiting
  cleanupTimer.unref()
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  /** Number of remaining requests in the current window */
  remaining: number
  /** Unix timestamp when the rate limit resets */
  resetAt: number
  /** Number of seconds until reset */
  retryAfter: number
}

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier for the rate limit (e.g., user ID, IP)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 * 
 * @example
 * ```ts
 * // In a server action
 * const { success, remaining, retryAfter } = rateLimit(user.id, { 
 *   limit: 10, 
 *   windowSeconds: 60 
 * })
 * 
 * if (!success) {
 *   return failure(`Too many requests. Try again in ${retryAfter} seconds.`)
 * }
 * ```
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup()
  
  const now = Date.now()
  const key = `${identifier}:${config.limit}:${config.windowSeconds}`
  const windowMs = config.windowSeconds * 1000
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetAt <= now) {
    // New window
    const resetAt = now + windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    
    return {
      success: true,
      remaining: config.limit - 1,
      resetAt,
      retryAfter: 0,
    }
  }
  
  // Existing window
  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    }
  }
  
  // Increment count
  entry.count++
  
  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
    retryAfter: 0,
  }
}

/**
 * Pre-configured rate limit for standard actions (form submissions, etc.)
 * 30 requests per minute
 */
export function rateLimitStandard(identifier: string): RateLimitResult {
  return rateLimit(identifier, { limit: 30, windowSeconds: 60 })
}

/**
 * Pre-configured rate limit for sensitive actions (login, signup, password reset)
 * 5 requests per minute
 */
export function rateLimitSensitive(identifier: string): RateLimitResult {
  return rateLimit(identifier, { limit: 5, windowSeconds: 60 })
}

/**
 * Pre-configured rate limit for expensive operations (reports, exports)
 * 10 requests per 5 minutes
 */
export function rateLimitExpensive(identifier: string): RateLimitResult {
  return rateLimit(identifier, { limit: 10, windowSeconds: 300 })
}
