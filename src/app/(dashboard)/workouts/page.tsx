import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Play, Dumbbell } from 'lucide-react'

interface WorkoutSession {
  id: string
  status: string
  started_at: string | null
  completed_at: string | null
  athlete_programs: {
    athletes: { id: string; name: string }
  }
  program_workouts: {
    workout_number: number
    programs: { name: string }
  }
}

export default async function WorkoutsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      status,
      started_at,
      completed_at,
      athlete_programs!inner (
        athletes!inner (id, name)
      ),
      program_workouts!inner (
        workout_number,
        programs!inner (name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const sessions = (data || []) as unknown as WorkoutSession[]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Workouts</h1>
          <p className="text-slate-400 mt-1">
            View and manage workout sessions
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25">
          <Link href="/workouts/new">
            <Play className="mr-2 h-4 w-4" />
            Start Workout
          </Link>
        </Button>
      </div>

      {/* Workouts List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Sessions</CardTitle>
          <CardDescription className="text-slate-400">
            Workout sessions from all athletes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/workouts/session/${session.id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-medium border border-slate-600">
                      <Dumbbell className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                        {session.athlete_programs?.athletes?.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        Workout #{session.program_workouts?.workout_number} • {session.program_workouts?.programs?.name}
                      </p>
                    </div>
                  </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">
                        {session.started_at 
                          ? new Date(session.started_at).toLocaleDateString()
                          : 'Not started'
                        }
                      </span>
                      <Badge 
                        variant="secondary"
                        className={
                          session.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : session.status === 'in_progress'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }
                      >
                        {session.status.replace('_', ' ')}
                      </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Dumbbell className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-white">No workouts yet</h3>
              <p className="mt-2 text-slate-400">
                Start your first workout session with an athlete.
              </p>
              <Button asChild className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                <Link href="/workouts/new">
                  <Play className="mr-2 h-4 w-4" />
                  Start First Workout
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
