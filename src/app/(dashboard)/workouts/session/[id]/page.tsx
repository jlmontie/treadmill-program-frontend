import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Dumbbell, Clock, User, Activity } from 'lucide-react'
import { ExerciseCard } from './exercise-card'
import { WorkoutCompleteForm } from './workout-complete-form'
import { RealtimeSession } from './realtime-session'
import { CancelWorkoutButton } from './cancel-workout-button'

export const dynamic = 'force-dynamic'

interface WorkoutExercise {
  id: number
  sequence: number
  num_runs: number
  incline: number | null
  speed_col1: number | null
  speed_col2: number | null
  speed_col3: number | null
  time_pattern: string | null
  exercise_type: string
  notes: string | null
}

interface ExerciseResult {
  workout_exercise_id: number
  completion_level: string
  speed_column_used: number | null
  actual_speed: number | null
  notes: string | null
}

interface WorkoutSession {
  id: string
  status: string
  started_at: string | null
  athlete_programs: {
    id: string
    athletes: { id: string; name: string; gender: string }
  } | null
  program_workouts: {
    id: number
    workout_number: number
    name: string | null
    programs: { name: string }
    workout_exercises: WorkoutExercise[]
  } | null
  exercise_results: ExerciseResult[]
}

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch session with all related data
  const { data: session, error } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      status,
      started_at,
      athlete_programs (
        id,
        athletes (id, name, gender)
      ),
      program_workouts (
        id,
        workout_number,
        name,
        programs (name),
        workout_exercises (
          id,
          sequence,
          num_runs,
          incline,
          speed_col1,
          speed_col2,
          speed_col3,
          time_pattern,
          exercise_type,
          notes
        )
      ),
      exercise_results (
        workout_exercise_id,
        completion_level,
        speed_column_used,
        actual_speed,
        notes
      )
    `)
    .eq('id', id)
    .single()

  if (error || !session) {
    notFound()
  }

  const typedSession = session as unknown as WorkoutSession

  // If completed, redirect to results page
  if (typedSession.status === 'completed') {
    redirect(`/workouts/${id}`)
  }

  const athlete = typedSession.athlete_programs?.athletes
  const workout = typedSession.program_workouts
  const exercises = workout?.workout_exercises?.sort((a, b) => a.sequence - b.sequence) || []
  const results = typedSession.exercise_results || []

  // Create a map of exercise results
  const resultsByExercise = new Map(results.map((r) => [r.workout_exercise_id, r]))

  // Calculate progress
  const completedCount = results.length
  const totalCount = exercises.length
  const allComplete = completedCount === totalCount && totalCount > 0

  // Get the current exercise (first uncompleted)
  const currentExerciseIndex = exercises.findIndex((ex) => !resultsByExercise.has(ex.id))
  const currentExercise = currentExerciseIndex >= 0 ? exercises[currentExerciseIndex] : null

  // Calculate elapsed time
  const startTime = typedSession.started_at ? new Date(typedSession.started_at) : null
  const elapsedMinutes = startTime 
    ? Math.floor((Date.now() - startTime.getTime()) / 60000)
    : 0

  return (
    <RealtimeSession sessionId={id}>
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Link href="/workouts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Workout {workout?.workout_number}
                {workout?.name && `: ${workout.name}`}
              </h1>
              <Badge 
                variant="outline" 
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              >
                In Progress
              </Badge>
            </div>
            <p className="text-slate-400 mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {athlete?.name || 'Unknown'}
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="h-4 w-4" />
                {workout?.programs?.name}
              </span>
            </p>
          </div>
        </div>
        
        {/* Cancel Button */}
        <CancelWorkoutButton
          sessionId={id}
          athleteName={athlete?.name || 'Unknown'}
          workoutNumber={workout?.workout_number || 0}
          completedExercises={completedCount}
          totalExercises={totalCount}
        />
      </div>

      {/* Progress Bar */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <span className="text-slate-300">
                  Progress: {completedCount} / {totalCount} exercises
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-violet-400" />
                <span className="text-slate-300">
                  {elapsedMinutes} min elapsed
                </span>
              </div>
            </div>
            <span className="text-slate-400">
              {Math.round((completedCount / totalCount) * 100) || 0}%
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100 || 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* All Exercises Complete - Show Completion Form */}
      {allComplete ? (
        <WorkoutCompleteForm 
          sessionId={id} 
          athleteName={athlete?.name || 'Athlete'} 
          workoutNumber={workout?.workout_number || 0}
          exerciseCount={totalCount}
          elapsedMinutes={elapsedMinutes}
        />
      ) : (
        <>
          {/* Current Exercise Highlight */}
          {currentExercise && (
            <Card className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-emerald-400" />
                    Exercise {currentExercise.sequence}
                  </span>
                  <Badge className="bg-slate-800 text-slate-300">
                    {formatExerciseType(currentExercise.exercise_type)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExerciseCard
                  sessionId={id}
                  exercise={currentExercise}
                  athleteGender={athlete?.gender || 'male'}
                  isCurrentExercise
                />
              </CardContent>
            </Card>
          )}

          {/* All Exercises List */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-slate-400" />
                All Exercises
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exercises.map((exercise, index) => {
                  const result = resultsByExercise.get(exercise.id)
                  const isCurrent = currentExerciseIndex === index
                  const isPast = result !== undefined
                  const isFuture = !isPast && !isCurrent

                  return (
                    <div
                      key={exercise.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isCurrent
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : isPast
                          ? 'border-cyan-500/30 bg-cyan-500/5'
                          : 'border-slate-700 bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isPast
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : isCurrent
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {exercise.sequence}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className={isFuture ? 'text-slate-500' : 'text-white'}>
                              {exercise.num_runs}x
                            </span>
                            {exercise.incline !== null && (
                              <span className={isFuture ? 'text-slate-500' : 'text-slate-300'}>
                                {exercise.incline}%
                              </span>
                            )}
                            <span className={isFuture ? 'text-slate-500' : 'text-cyan-400'}>
                              {formatSpeed(exercise, athlete?.gender || 'male')}
                            </span>
                            {exercise.time_pattern && (
                              <span className={isFuture ? 'text-slate-500' : 'text-violet-400'}>
                                {exercise.time_pattern}
                              </span>
                            )}
                            <Badge 
                              variant="outline" 
                              className={isFuture ? 'text-slate-600 border-slate-700' : 'text-slate-400 border-slate-600'}
                            >
                              {formatExerciseType(exercise.exercise_type)}
                            </Badge>
                          </div>
                        </div>
                        {result && (
                          <div className="flex items-center gap-2">
                            {result.speed_column_used && (
                              <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-600">
                                Col {result.speed_column_used}
                              </Badge>
                            )}
                            <Badge 
                              variant="outline"
                              className={getCompletionBadgeStyle(result.completion_level)}
                            >
                              {getCompletionLabel(result.completion_level)}
                            </Badge>
                          </div>
                        )}
                        {isCurrent && (
                          <Badge 
                            variant="outline" 
                            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          >
                            Current
                          </Badge>
                        )}
                        {isFuture && (
                          <Badge variant="outline" className="bg-slate-800 text-slate-500 border-slate-700">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
    </RealtimeSession>
  )
}

function formatExerciseType(type: string): string {
  const typeMap: Record<string, string> = {
    run: 'Run',
    hold: 'Hold',
    run_hold: 'Run/Hold',
    run_hold_run: 'Run/Hold/Run',
    run_rest_run: 'Run/Rest/Run',
    box_runs: 'Box Runs',
    speedwork: 'Speedwork',
    hip_flexion: 'Hip Flexion',
    hip_extension: 'Hip Extension',
  }
  return typeMap[type] || type
}

function formatSpeed(exercise: WorkoutExercise, gender: string): string {
  const speeds = [exercise.speed_col1, exercise.speed_col2, exercise.speed_col3].filter(s => s !== null)
  if (speeds.length === 0) return '—'
  if (speeds.length === 1) return `${speeds[0]} mph`
  return `${speeds.join('/')} mph`
}

function getCompletionLabel(level: string): string {
  switch (level) {
    case 'complete':
      return 'Complete'
    case 'slight_touch':
      return 'Slight Touch'
    case 'push':
      return 'Push'
    case 'failure':
      return 'Failure'
    default:
      return level
  }
}

function getCompletionBadgeStyle(level: string): string {
  switch (level) {
    case 'complete':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'slight_touch':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    case 'push':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'failure':
      return 'bg-red-500/10 text-red-400 border-red-500/30'
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  }
}
