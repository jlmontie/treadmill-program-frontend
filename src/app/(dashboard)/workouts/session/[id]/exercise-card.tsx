'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Check, AlertTriangle, ThumbsUp, X, Loader2, Gauge, Timer, TrendingUp } from 'lucide-react'
import { recordExerciseResult } from '../../actions'
import { useRouter } from 'next/navigation'

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

interface ExerciseCardProps {
  sessionId: string
  exercise: WorkoutExercise
  athleteGender: string
  isCurrentExercise?: boolean
}

const COMPLETION_LEVELS = [
  {
    value: 'complete',
    label: 'Complete',
    description: 'Completed without assistance',
    icon: Check,
    color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    activeColor: 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900',
  },
  {
    value: 'slight_touch',
    label: 'Slight Touch',
    description: 'Light rail touch for balance',
    icon: ThumbsUp,
    color: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    activeColor: 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900',
  },
  {
    value: 'push',
    label: 'Push',
    description: 'Pushed on rails for support',
    icon: AlertTriangle,
    color: 'bg-amber-600 hover:bg-amber-500 text-white',
    activeColor: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900',
  },
  {
    value: 'failure',
    label: 'Failure',
    description: 'Could not complete',
    icon: X,
    color: 'bg-red-600 hover:bg-red-500 text-white',
    activeColor: 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-900',
  },
]

export function ExerciseCard({ sessionId, exercise, athleteGender, isCurrentExercise }: ExerciseCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Get available speed columns
  const speedColumns = [
    { col: 1, speed: exercise.speed_col1 },
    { col: 2, speed: exercise.speed_col2 },
    { col: 3, speed: exercise.speed_col3 },
  ].filter(s => s.speed !== null)

  const hasMultipleSpeeds = speedColumns.length > 1
  const singleSpeed = speedColumns.length === 1 ? speedColumns[0].speed : null

  const handleSubmit = () => {
    if (!selectedLevel) return
    if (hasMultipleSpeeds && !selectedColumn) return

    setError(null)
    
    const actualSpeed = hasMultipleSpeeds
      ? speedColumns.find(s => s.col === selectedColumn)?.speed || null
      : singleSpeed

    startTransition(async () => {
      const result = await recordExerciseResult(
        sessionId,
        exercise.id,
        selectedLevel,
        selectedColumn,
        actualSpeed,
        notes || undefined
      )
      
      if (!result.success) {
        setError(result.error)
      } else {
        setSelectedLevel(null)
        setSelectedColumn(null)
        setNotes('')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Exercise Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
          <div className="text-3xl font-bold text-white">{exercise.num_runs}x</div>
          <div className="text-sm text-slate-400">Runs</div>
        </div>
        
        {exercise.incline !== null && (
          <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <Gauge className="h-5 w-5 text-violet-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{exercise.incline}%</div>
            <div className="text-sm text-slate-400">Incline</div>
          </div>
        )}
        
        <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="h-5 w-5 text-cyan-400 mx-auto mb-2 flex items-center justify-center font-bold">
            ⚡
          </div>
          <div className="text-3xl font-bold text-cyan-400">
            {hasMultipleSpeeds 
              ? speedColumns.map(s => s.speed).join('/') 
              : singleSpeed || '—'}
          </div>
          <div className="text-sm text-slate-400">Speed (mph)</div>
        </div>
        
        {exercise.time_pattern && (
          <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <Timer className="h-5 w-5 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{exercise.time_pattern}</div>
            <div className="text-sm text-slate-400">Time Pattern</div>
          </div>
        )}
      </div>

      {/* Exercise Notes */}
      {exercise.notes && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          <strong>Note:</strong> {exercise.notes}
        </div>
      )}

      {/* Speed Column Selection */}
      {hasMultipleSpeeds && (
        <div className="space-y-2">
          <Label className="text-slate-300">Speed Column</Label>
          <div className="grid grid-cols-3 gap-3">
            {speedColumns.map(({ col, speed }) => (
              <button
                key={col}
                type="button"
                onClick={() => setSelectedColumn(col)}
                disabled={isPending}
                className={`p-4 rounded-lg text-center transition-all border ${
                  selectedColumn === col
                    ? 'border-cyan-500 bg-cyan-500/20 ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-xs text-slate-400 mb-1">Column {col}</div>
                <div className={`text-2xl font-bold ${selectedColumn === col ? 'text-cyan-400' : 'text-white'}`}>
                  {speed}
                </div>
                <div className="text-xs text-slate-500">mph</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completion Level Buttons */}
      <div className="space-y-2">
        <Label className="text-slate-300">Completion Level</Label>
        <div className="grid grid-cols-2 gap-3">
          {COMPLETION_LEVELS.map((level) => {
            const Icon = level.icon
            const isSelected = selectedLevel === level.value

            return (
              <button
                key={level.value}
                type="button"
                onClick={() => setSelectedLevel(level.value)}
                disabled={isPending}
                className={`p-4 rounded-lg text-left transition-all ${level.color} ${
                  isSelected ? level.activeColor : 'opacity-80'
                } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6" />
                  <div>
                    <div className="font-semibold text-lg">{level.label}</div>
                    <div className="text-xs opacity-80">{level.description}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-slate-300">
          Notes (optional)
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations about this exercise..."
          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
          rows={2}
          disabled={isPending}
        />
      </div>

      {/* Error */}
      {error && (
        <div 
          className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedLevel || (hasMultipleSpeeds && !selectedColumn) || isPending}
        aria-busy={isPending}
        size="lg"
        className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-lg py-6"
      >
        {isPending && <span className="sr-only">Recording exercise result, please wait</span>}
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Recording...
          </>
        ) : (
          <>
            <Check className="mr-2 h-5 w-5" />
            Record Exercise {exercise.sequence}
          </>
        )}
      </Button>
    </div>
  )
}
