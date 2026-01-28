import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Play, Users, Dumbbell, AlertCircle } from 'lucide-react'
import { startWorkout } from '../actions'

export const dynamic = 'force-dynamic'

interface AthleteWithProgram {
  id: string
  name: string
  gender: string
  sport: string | null
  athlete_programs: Array<{
    id: string
    status: string
    current_workout_number: number
    programs: {
      id: number
      name: string
      total_workouts: number
      program_workouts: Array<{
        id: number
        workout_number: number
        name: string | null
      }>
    }
  }>
}

export default async function NewWorkoutPage() {
  const supabase = await createClient()

  // Fetch athletes with active programs and their current workout info
  const { data, error } = await supabase
    .from('athletes')
    .select(`
      id,
      name,
      gender,
      sport,
      athlete_programs!inner (
        id,
        status,
        current_workout_number,
        programs (
          id,
          name,
          total_workouts,
          program_workouts (
            id,
            workout_number,
            name
          )
        )
      )
    `)
    .eq('athlete_programs.status', 'active')
    .order('name')

  const athletes = (data || []) as unknown as AthleteWithProgram[]

  // Check if there are any in-progress sessions
  const { data: inProgressSessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      athlete_programs (
        athletes (name)
      ),
      program_workouts (
        workout_number,
        name
      )
    `)
    .eq('status', 'in_progress')

  const activeSessions = (inProgressSessions || []) as unknown as Array<{
    id: string
    athlete_programs: { athletes: { name: string } } | null
    program_workouts: { workout_number: number; name: string | null } | null
  }>

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
          <Link href="/workouts">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Start Workout</h1>
          <p className="text-slate-400 mt-1">
            Select an athlete to begin their next workout session
          </p>
        </div>
      </div>

      {/* In-Progress Sessions Alert */}
      {activeSessions.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-400 flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5" />
              In-Progress Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/workouts/session/${session.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <span className="text-white font-medium">
                      {session.athlete_programs?.athletes?.name || 'Unknown'}
                    </span>
                    <span className="text-slate-400 ml-2">
                      — Workout {session.program_workouts?.workout_number}
                      {session.program_workouts?.name && `: ${session.program_workouts.name}`}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20">
                    Resume
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Athlete Selection */}
      {athletes.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-white">No athletes with active programs</h3>
              <p className="mt-2 text-slate-400">
                Athletes need an assigned program before starting workouts.
              </p>
              <Button asChild className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                <Link href="/athletes">View Athletes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {athletes.map((athlete) => {
            const activeProgram = athlete.athlete_programs[0]
            const program = activeProgram?.programs
            const currentWorkoutNum = activeProgram?.current_workout_number || 1
            const totalWorkouts = program?.total_workouts || 0
            
            // Find the next workout
            const nextWorkout = program?.program_workouts?.find(
              (w) => w.workout_number === currentWorkoutNum
            )
            
            const isComplete = currentWorkoutNum > totalWorkouts
            const progress = totalWorkouts > 0 
              ? Math.min(((currentWorkoutNum - 1) / totalWorkouts) * 100, 100)
              : 0

            return (
              <Card 
                key={athlete.id} 
                className={`bg-slate-900/50 border-slate-800 ${isComplete ? 'opacity-60' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">{athlete.name}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {athlete.sport || athlete.gender}
                      </CardDescription>
                    </div>
                    {isComplete ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        Complete
                      </Badge>
                    ) : (
                      <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                        Workout {currentWorkoutNum}/{totalWorkouts}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Program Info */}
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-sm text-slate-400">Current Program</p>
                    <p className="text-white font-medium">{program?.name || 'Unknown'}</p>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Start Button */}
                  {!isComplete && nextWorkout ? (
                    <form action={startWorkout}>
                      <input type="hidden" name="athlete_program_id" value={activeProgram.id} />
                      <input type="hidden" name="program_workout_id" value={nextWorkout.id} />
                      <Button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Workout {currentWorkoutNum}
                        {nextWorkout.name && `: ${nextWorkout.name}`}
                      </Button>
                    </form>
                  ) : isComplete ? (
                    <div className="text-center py-2 text-emerald-400 text-sm">
                      <Dumbbell className="inline-block mr-2 h-4 w-4" />
                      Program completed!
                    </div>
                  ) : (
                    <div className="text-center py-2 text-slate-500 text-sm">
                      No workouts available
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
