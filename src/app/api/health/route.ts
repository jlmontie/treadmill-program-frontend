import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Health check endpoint
 * Returns 200 if app and database are healthy
 * Returns 503 if any critical service is down
 *
 * Use this for:
 * - Uptime monitoring (Pingdom, UptimeRobot)
 * - Load balancer health checks
 * - Deployment verification
 */
export async function GET() {
  try {
    // Check database connectivity
    const supabase = await createClient()
    const { error } = await supabase.from('trainers').select('id').limit(1).maybeSingle()

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
