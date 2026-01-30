'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Hand, 
  ArrowUp, 
  X,
  XCircle,
  Clock,
  Dumbbell,
  ExternalLink,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { logExerciseResult, cancelGroupWorkout } from './actions'

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

interface Exercise {
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

interface AthleteWorkoutCardProps {
  workout: ActiveWorkout
  colorIndex: number
  onRefresh: () => void
}

const CARD_COLORS = [
  { bg: 'from-cyan-500/10 to-blue-500/10', border: 'border-cyan-500/30', accent: 'text-cyan-400', ring: 'ring-cyan-500/50' },
  { bg: 'from-emerald-500/10 to-green-500/10', border: 'border-emerald-500/30', accent: 'text-emerald-400', ring: 'ring-emerald-500/50' },
  { bg: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-500/30', accent: 'text-violet-400', ring: 'ring-violet-500/50' },
  { bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/30', accent: 'text-amber-400', ring: 'ring-amber-500/50' },
  { bg: 'from-rose-500/10 to-pink-500/10', border: 'border-rose-500/30', accent: 'text-rose-400', ring: 'ring-rose-500/50' },
]

export function AthleteWorkoutCard({ workout, colorIndex, onRefresh }: AthleteWorkoutCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null)
  const [selectedSpeed, setSelectedSpeed] = useState<1 | 2 | 3>(2)
  const [isLogging, setIsLogging] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [elapsedTime, setElapsedTime] = useState('0:00')
  const supabase = createClient()
  const colors = CARD_COLORS[colorIndex % CARD_COLORS.length]

  // Fetch current exercise details
  useEffect(() => {
    const fetchCurrentExercise = async () => {
      // Get completed exercise IDs
      const { data: results } = await supabase
        .from('exercise_results')
        .select('workout_exercise_id')
        .eq('workout_session_id', workout.id)

      const completedIds = ((results || []) as Array<{ workout_exercise_id: number }>).map(r => r.workout_exercise_id)

      // Get all exercises for this workout
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('program_workout_id', workout.program_workout_id)
        .order('sequence', { ascending: true })

      if (exercises) {
        const typedExercises = exercises as unknown as Exercise[]
        const current = typedExercises.find(ex => !completedIds.includes(ex.id))
        setCurrentExercise(current || null)
      }
    }

    fetchCurrentExercise()
  }, [workout.id, workout.program_workout_id, workout.completed_exercises])

  // Update elapsed time
  useEffect(() => {
    if (!workout.started_at) return

    const updateTime = () => {
      const start = new Date(workout.started_at!).getTime()
      const elapsed = Math.floor((Date.now() - start) / 1000)
      const mins = Math.floor(elapsed / 60)
      const secs = elapsed % 60
      setElapsedTime(`${mins}:${secs.toString().padStart(2, '0')}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [workout.started_at])

  const handleLogResult = async (completionLevel: 'complete' | 'slight_touch' | 'push' | 'failure') => {
    if (!currentExercise || isLogging) return

    setIsLogging(true)
    try {
      const result = await logExerciseResult({
        workoutSessionId: workout.id,
        workoutExerciseId: currentExercise.id,
        completionLevel,
        speedColumnUsed: selectedSpeed,
        actualSpeed: getSpeedForColumn(currentExercise, selectedSpeed),
      })
      
      if (result.success) {
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to log result:', error)
    } finally {
      setIsLogging(false)
    }
  }

  const handleCancel = async () => {
    if (isCanceling) return
    
    if (!confirm(`Cancel ${workout.athlete_name}'s workout? This will discard all progress.`)) {
      return
    }

    setIsCanceling(true)
    try {
      const result = await cancelGroupWorkout(workout.id)
      if (result.success) {
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to cancel workout:', error)
    } finally {
      setIsCanceling(false)
    }
  }

  const getSpeedForColumn = (exercise: Exercise, column: 1 | 2 | 3): number | null => {
    switch (column) {
      case 1: return exercise.speed_col1
      case 2: return exercise.speed_col2
      case 3: return exercise.speed_col3
    }
  }

  const formatExerciseType = (type: string): string => {
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

  const progressPercent = workout.total_exercises > 0 
    ? Math.round((workout.completed_exercises / workout.total_exercises) * 100) 
    : 0

  const isComplete = workout.completed_exercises >= workout.total_exercises

  return (
    <Card className={`bg-gradient-to-br ${colors.bg} ${colors.border} border-2 overflow-hidden transition-all`}>
      {/* Main Quick-Tap Row */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Athlete Info */}
          <div className="flex items-center gap-3 min-w-[180px]">
            <div className={`h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold ${colors.accent} border-2 ${colors.border}`}>
              {workout.athlete_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-white text-lg">{workout.athlete_name}</p>
              <p className="text-sm text-slate-400">
                Ex. {workout.completed_exercises + 1} / {workout.total_exercises}
              </p>
            </div>
          </div>

          {/* Current Exercise Summary */}
          {currentExercise && !isComplete ? (
            <div className="flex-1 flex items-center gap-4">
              <div className="flex items-center gap-3 text-white">
                <span className="font-mono text-lg font-semibold">{currentExercise.num_runs}x</span>
                {currentExercise.incline !== null && (
                  <span className="text-slate-300">{currentExercise.incline}%</span>
                )}
                <div className="flex gap-1">
                  {[1, 2, 3].map((col) => {
                    const speed = getSpeedForColumn(currentExercise, col as 1 | 2 | 3)
                    if (speed === null) return null
                    return (
                      <button
                        key={col}
                        onClick={() => setSelectedSpeed(col as 1 | 2 | 3)}
                        className={`px-3 py-1 rounded-lg text-sm font-mono transition-all ${
                          selectedSpeed === col
                            ? `${colors.accent} bg-slate-800 ring-2 ${colors.ring}`
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {speed}
                      </button>
                    )
                  })}
                  <span className="text-slate-500 ml-1">mph</span>
                </div>
                {currentExercise.time_pattern && (
                  <Badge variant="outline" className="text-slate-300 border-slate-600">
                    {currentExercise.time_pattern}
                  </Badge>
                )}
              </div>
            </div>
          ) : isComplete ? (
            <div className="flex-1 flex items-center justify-center">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-lg px-4 py-2">
                <Check className="h-5 w-5 mr-2" />
                Workout Complete!
              </Badge>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          )}

          {/* Completion Buttons - Large Touch Targets */}
          {currentExercise && !isComplete && (
            <div className="flex gap-2">
              <button
                onClick={() => handleLogResult('complete')}
                disabled={isLogging}
                className="h-16 w-16 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500/50 flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              >
                <Check className="h-6 w-6 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 mt-0.5">Complete</span>
              </button>
              <button
                onClick={() => handleLogResult('slight_touch')}
                disabled={isLogging}
                className="h-16 w-16 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border-2 border-cyan-500/50 flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              >
                <Hand className="h-6 w-6 text-cyan-400" />
                <span className="text-[10px] text-cyan-400 mt-0.5">Touch</span>
              </button>
              <button
                onClick={() => handleLogResult('push')}
                disabled={isLogging}
                className="h-16 w-16 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500/50 flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              >
                <ArrowUp className="h-6 w-6 text-amber-400" />
                <span className="text-[10px] text-amber-400 mt-0.5">Push</span>
              </button>
              <button
                onClick={() => handleLogResult('failure')}
                disabled={isLogging}
                className="h-16 w-16 rounded-xl bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              >
                <X className="h-6 w-6 text-red-400" />
                <span className="text-[10px] text-red-400 mt-0.5">Fail</span>
              </button>
            </div>
          )}

          {/* Expand Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-10 w-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${colors.bg.replace('/10', '')} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {elapsedTime}
            </span>
            <span>{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <CardContent className="pt-0 pb-4 border-t border-slate-800 mt-2">
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Program</p>
              <p className="text-white font-medium">{workout.program_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Workout</p>
              <p className="text-white font-medium">#{workout.workout_number}</p>
            </div>
            {currentExercise && (
              <>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Exercise Type</p>
                  <p className="text-white font-medium">{formatExerciseType(currentExercise.exercise_type)}</p>
                </div>
                {currentExercise.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-slate-300 text-sm">{currentExercise.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Link href={`/workouts/session/${workout.id}`}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Full View
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Link href={`/athletes/${workout.athlete_id}`}>
                View Athlete
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              disabled={isCanceling}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 ml-auto"
            >
              {isCanceling ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Cancel
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
