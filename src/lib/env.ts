import { z } from 'zod'

/**
 * Environment variable validation schema
 * Validates at build-time to catch configuration errors early
 */
const envSchema = z.object({
  // Supabase - Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL format'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

/**
 * Validate environment variables at module load time
 * Throws clear error if validation fails
 *
 * Note: In development with Turbopack, NEXT_PUBLIC_* vars may not be available
 * on first client-side load. They become available after the first server compilation.
 * This is a known Turbopack behavior - the server always has them.
 */
function validateEnv() {
  const isClient = typeof window !== 'undefined'
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    if (isClient) {
      // Client-side: Turbopack may not have injected vars yet on first load
      // Return process.env values as-is (they'll be available after first compile)
      console.warn(
        '⚠️  Environment variables validation failed on client (this is normal on first load with Turbopack)'
      )
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      }
    }

    // Server-side: Fail hard - these MUST be present
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    throw new Error(
      'Environment variable validation failed. Check your .env.local file and ensure all required variables are set.'
    )
  }

  return parsed.data
}

// Validate immediately on import
export const env = validateEnv()

/**
 * Type-safe configuration object
 * Provides centralized access to all environment variables
 */
export const config = {
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const

/**
 * Runtime environment checks
 */
export function requireProduction() {
  if (!config.isProduction) {
    throw new Error('This operation is only available in production')
  }
}

export function requireDevelopment() {
  if (!config.isDevelopment) {
    throw new Error('This operation is only available in development')
  }
}
