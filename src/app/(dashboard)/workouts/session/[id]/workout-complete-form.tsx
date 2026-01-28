'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Trophy, Clock, Dumbbell, CheckCircle2, Loader2 } from 'lucide-react'
import { completeWorkout } from '../../actions'

interface WorkoutCompleteFormProps {
  sessionId: string
  athleteName: string
  workoutNumber: number
  exerciseCount: number
  elapsedMinutes: number
}

export function WorkoutCompleteForm({ 
  sessionId, 
  athleteName, 
  workoutNumber,
  exerciseCount,
  elapsedMinutes 
}: WorkoutCompleteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState('')

  const handleComplete = () => {
    startTransition(async () => {
      await completeWorkout(sessionId, notes || undefined)
      router.refresh()
    })
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border-emerald-500/30">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <Trophy className="h-8 w-8 text-emerald-400" />
        </div>
        <CardTitle className="text-white text-2xl">
          All Exercises Complete! 🎉
        </CardTitle>
        <CardDescription className="text-slate-300 text-lg">
          {athleteName} has completed Workout {workoutNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <Dumbbell className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{exerciseCount}</div>
            <div className="text-sm text-slate-400">Exercises</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <Clock className="h-6 w-6 text-violet-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{elapsedMinutes}</div>
            <div className="text-sm text-slate-400">Minutes</div>
          </div>
        </div>

        {/* Session Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-slate-300">
            Session Notes (optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Overall observations, athlete feedback, or notes for next session..."
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
            rows={3}
            disabled={isPending}
          />
        </div>

        {/* Complete Button */}
        <Button
          onClick={handleComplete}
          disabled={isPending}
          size="lg"
          className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-lg py-6 shadow-lg shadow-emerald-500/25"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Complete Workout
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
