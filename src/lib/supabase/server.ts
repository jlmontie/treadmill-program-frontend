import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'
import { config } from '@/lib/env'

/**
 * Creates a typed Supabase client for server-side operations.
 * 
 * The Database type is generated from the actual database schema.
 * To regenerate types:
 * npx supabase gen types typescript --project-id gsrtyjlsdnmocrdjeypw > src/lib/types/database.ts
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
