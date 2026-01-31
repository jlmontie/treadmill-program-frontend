import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'
import { config } from '@/lib/env'

export function createClient() {
  return createBrowserClient<Database>(
    config.supabase.url,
    config.supabase.anonKey
  )
}
