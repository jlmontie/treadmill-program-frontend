import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Users, Play, Plus } from 'lucide-react'
import { GroupSessionManager } from './group-session-manager'

export const dynamic = 'force-dynamic'

interface ActiveWorkout {
  id: string
  status: string
  started_at: string | null
  athlete_program_id: string
  program_workout_id: number
  athlete_name: string
  athlete_id: string
  workout_number: number
  program_name: string
  current_exercise: number
  total_exercises: number
  completed_exercises: number
}

interface AvailableAthlete {
  id: string
  name: string
  gender: string
  current_workout_number: number | null
  program_name: string | null
  program_id: number | null
  athlete_program_id: string | null
}

export default async function GroupSessionPage() {
  const supabase = await createClient()

  // Fetch active workout sessions (already in progress)
  const { data: activeSessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      status,
      started_at,
      athlete_program_id,
      program_workout_id,
      athlete_programs (
        id,
        athletes (id, name),
        current_workout_number
      ),
      program_workouts (
        workout_number,
        programs (name),
        workout_exercises (id)
      ),
      exercise_results (id)
    `)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(5)

  const activeWorkouts: ActiveWorkout[] = ((activeSessions || []) as any[]).map((s) => ({
    id: s.id,
    status: s.status,
    started_at: s.started_at,
    athlete_program_id: s.athlete_program_id,
    program_workout_id: s.program_workout_id,
    athlete_name: s.athlete_programs?.athletes?.name || 'Unknown',
    athlete_id: s.athlete_programs?.athletes?.id || '',
    workout_number: s.program_workouts?.workout_number || 0,
    program_name: s.program_workouts?.programs?.name || 'Unknown',
    current_exercise: (s.exercise_results?.length || 0) + 1,
    total_exercises: s.program_workouts?.workout_exercises?.length || 0,
    completed_exercises: s.exercise_results?.length || 0,
  }))

  // Fetch athletes with active programs who don't have an in-progress workout
  const activeAthleteIds = activeWorkouts.map(w => w.athlete_id)
  
  const { data: availableAthletes } = await supabase
    .from('athlete_programs')
    .select(`
      id,
      current_workout_number,
      athletes (id, name, gender),
      programs (id, name)
    `)
    .eq('status', 'active')
    .not('athletes.id', 'in', activeAthleteIds.length > 0 ? `(${activeAthleteIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')

  const available: AvailableAthlete[] = ((availableAthletes || []) as any[])
    .filter(ap => ap.athletes && !activeAthleteIds.includes(ap.athletes.id))
    .map((ap) => ({
      id: ap.athletes.id,
      name: ap.athletes.name,
      gender: ap.athletes.gender,
      current_workout_number: ap.current_workout_number,
      program_name: ap.programs?.name || null,
      program_id: ap.programs?.id || null,
      athlete_program_id: ap.id,
    }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-cyan-400" />
              Group Session
            </h1>
            <p className="text-slate-400 mt-1">
              Manage up to 5 athletes simultaneously
            </p>
          </div>
        </div>
      </div>

      {/* Group Session Manager */}
      <GroupSessionManager 
        activeWorkouts={activeWorkouts}
        availableAthletes={available}
      />
    </div>
  )
}
