import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  Dumbbell,
  CheckCircle2,
  TrendingUp,
  BarChart3
} from 'lucide-react'

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
  completed_at: string
  workout_exercises: WorkoutExercise
}

interface WorkoutSession {
  id: string
  status: string
  started_at: string | null
  completed_at: string | null
  session_notes: string | null
  athlete_programs: {
    id: string
    athletes: { id: string; name: string; gender: string; sport: string | null }
    programs: { name: string }
  } | null
  program_workouts: {
    id: number
    workout_number: number
    name: string | null
  } | null
  trainers: { name: string } | null
  exercise_results: ExerciseResult[]
}

export default async function WorkoutDetailPage({
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
      completed_at,
      session_notes,
      athlete_programs (
        id,
        athletes (id, name, gender, sport),
        programs (name)
      ),
      program_workouts (
        id,
        workout_number,
        name
      ),
      trainers (name),
      exercise_results (
        workout_exercise_id,
        completion_level,
        speed_column_used,
        actual_speed,
        notes,
        completed_at,
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
      )
    `)
    .eq('id', id)
    .single()

  if (error || !session) {
    notFound()
  }

  const typedSession = session as unknown as WorkoutSession

  const athlete = typedSession.athlete_programs?.athletes
  const program = typedSession.athlete_programs?.programs
  const workout = typedSession.program_workouts
  const results = typedSession.exercise_results?.sort((a, b) => 
    a.workout_exercises.sequence - b.workout_exercises.sequence
  ) || []

  // Calculate stats
  const completeCount = results.filter(r => r.completion_level === 'complete').length
  const slightTouchCount = results.filter(r => r.completion_level === 'slight_touch').length
  const pushCount = results.filter(r => r.completion_level === 'push').length
  const failureCount = results.filter(r => r.completion_level === 'failure').length
  const totalExercises = results.length

  // Calculate duration
  const startTime = typedSession.started_at ? new Date(typedSession.started_at) : null
  const endTime = typedSession.completed_at ? new Date(typedSession.completed_at) : null
  const durationMinutes = startTime && endTime
    ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
    : null

  const statusColor = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
  }[typedSession.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'

  return (
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
                Workout {workout?.workout_number} Results
              </h1>
              <Badge variant="outline" className={statusColor}>
                {typedSession.status === 'completed' ? 'Completed' : 
                 typedSession.status === 'in_progress' ? 'In Progress' : 
                 'Cancelled'}
              </Badge>
            </div>
            <p className="text-slate-400 mt-1">
              {athlete?.name} • {program?.name}
            </p>
          </div>
        </div>
        {typedSession.status === 'in_progress' && (
          <Button asChild className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500">
            <Link href={`/workouts/session/${id}`}>
              Continue Workout
            </Link>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <User className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Athlete</p>
                <p className="text-lg font-semibold text-white">{athlete?.name}</p>
                {athlete?.sport && (
                  <p className="text-xs text-slate-500">{athlete.sport}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Dumbbell className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Exercises</p>
                <p className="text-lg font-semibold text-white">{totalExercises} completed</p>
                <p className="text-xs text-slate-500">
                  {completeCount} clean, {slightTouchCount + pushCount} assisted
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-violet-500/10">
                <Clock className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Duration</p>
                <p className="text-lg font-semibold text-white">
                  {durationMinutes ? `${durationMinutes} min` : '—'}
                </p>
                {startTime && (
                  <p className="text-xs text-slate-500">
                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Calendar className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Date</p>
                <p className="text-lg font-semibold text-white">
                  {startTime?.toLocaleDateString() || '—'}
                </p>
                <p className="text-xs text-slate-500">
                  Trainer: {typedSession.trainers?.name || 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-3xl font-bold text-emerald-400">{completeCount}</div>
              <div className="text-sm text-slate-400">Complete</div>
              <div className="text-xs text-slate-500">{Math.round((completeCount/totalExercises)*100) || 0}%</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <div className="text-3xl font-bold text-cyan-400">{slightTouchCount}</div>
              <div className="text-sm text-slate-400">Slight Touch</div>
              <div className="text-xs text-slate-500">{Math.round((slightTouchCount/totalExercises)*100) || 0}%</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-3xl font-bold text-amber-400">{pushCount}</div>
              <div className="text-sm text-slate-400">Push</div>
              <div className="text-xs text-slate-500">{Math.round((pushCount/totalExercises)*100) || 0}%</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-3xl font-bold text-red-400">{failureCount}</div>
              <div className="text-sm text-slate-400">Failure</div>
              <div className="text-xs text-slate-500">{Math.round((failureCount/totalExercises)*100) || 0}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Notes */}
      {typedSession.session_notes && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Session Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">{typedSession.session_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Exercise Results */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Exercise Results
          </CardTitle>
          <CardDescription className="text-slate-400">
            Detailed results for each exercise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {results.map((result) => {
              const exercise = result.workout_exercises
              
              return (
                <div
                  key={result.workout_exercise_id}
                  className={`p-4 rounded-lg border ${getCompletionBorder(result.completion_level)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        getCompletionBg(result.completion_level)
                      }`}>
                        {exercise.sequence}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-white font-medium">
                          {exercise.num_runs}x
                        </span>
                        {exercise.incline !== null && (
                          <span className="text-slate-300">
                            {exercise.incline}%
                          </span>
                        )}
                        <span className="text-cyan-400">
                          {result.actual_speed 
                            ? `${result.actual_speed} mph`
                            : formatSpeed(exercise)}
                        </span>
                        {exercise.time_pattern && (
                          <span className="text-violet-400">
                            {exercise.time_pattern}
                          </span>
                        )}
                        <Badge 
                          variant="outline" 
                          className="text-slate-400 border-slate-600"
                        >
                          {formatExerciseType(exercise.exercise_type)}
                        </Badge>
                      </div>
                    </div>
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
                  </div>
                  {result.notes && (
                    <p className="mt-2 text-sm text-slate-400 ml-12">
                      Note: {result.notes}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <Link href={`/athletes/${athlete?.id}`}>
            View Athlete Profile
          </Link>
        </Button>
        <Button asChild className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500">
          <Link href="/workouts/new">
            Start Another Workout
          </Link>
        </Button>
      </div>
    </div>
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

function formatSpeed(exercise: WorkoutExercise): string {
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

function getCompletionBorder(level: string): string {
  switch (level) {
    case 'complete':
      return 'border-emerald-500/30 bg-emerald-500/5'
    case 'slight_touch':
      return 'border-cyan-500/30 bg-cyan-500/5'
    case 'push':
      return 'border-amber-500/30 bg-amber-500/5'
    case 'failure':
      return 'border-red-500/30 bg-red-500/5'
    default:
      return 'border-slate-700 bg-slate-800/30'
  }
}

function getCompletionBg(level: string): string {
  switch (level) {
    case 'complete':
      return 'bg-emerald-500/20 text-emerald-400'
    case 'slight_touch':
      return 'bg-cyan-500/20 text-cyan-400'
    case 'push':
      return 'bg-amber-500/20 text-amber-400'
    case 'failure':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-slate-700 text-slate-400'
  }
}
