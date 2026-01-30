'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Check, AlertTriangle, ThumbsUp, X, Loader2, GitBranch } from 'lucide-react'
import { recordStepResult } from '../../actions'
import { useRouter } from 'next/navigation'

interface PretestStep {
  id: number
  step_number: number
  num_runs?: number
  incline: number | null
  speed: number | null
  time_pattern: string | null
  gate_instruction: string | null
}

interface PretestStepCardProps {
  sessionId: string
  step: PretestStep
  isCurrentStep?: boolean
  isGateStep?: boolean
}

const COMPLETION_LEVELS = [
  {
    value: 'complete',
    label: 'Complete',
    description: 'Athlete completed the step without assistance',
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
    description: 'Needed to push on rails for support',
    icon: AlertTriangle,
    color: 'bg-amber-600 hover:bg-amber-500 text-white',
    activeColor: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900',
  },
  {
    value: 'failure',
    label: 'Failure',
    description: 'Could not complete the step',
    icon: X,
    color: 'bg-red-600 hover:bg-red-500 text-white',
    activeColor: 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-900',
  },
]

export function PretestStepCard({ sessionId, step, isCurrentStep, isGateStep }: PretestStepCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!selectedLevel) return

    setError(null)
    startTransition(async () => {
      const result = await recordStepResult(sessionId, step.id, selectedLevel, notes || undefined)
      
      if (result.error) {
        setError(result.error)
      } else {
        setSelectedLevel(null)
        setNotes('')
        router.refresh()
      }
    })
  }

  // Get gate step branching info
  const getGateInfo = (stepNum: number) => {
    switch (stepNum) {
      case 6:
        return {
          passPath: 'Continue to Step 7',
          failPath: 'Skip to Steps 10 & 11 → Developmental Program',
        }
      case 7:
        return {
          passPath: 'Continue to Step 8',
          failPath: 'Go to Step 12 for further assessment',
        }
      case 8:
        return {
          passPath: 'Advanced/Elite Program',
          failPath: 'Go to Step 13 for further assessment',
        }
      case 12:
        return {
          passPath: 'Reduced Speed / Level II Program',
          failPath: 'Developmental Program (Steps 10 & 11)',
        }
      case 13:
        return {
          passPath: 'Standard / Level III Program',
          failPath: 'Go to Step 12 for assessment',
        }
      default:
        return null
    }
  }

  const gateInfo = isGateStep ? getGateInfo(step.step_number) : null

  return (
    <div className="space-y-4">
      {/* Gate Step Branching Info */}
      {gateInfo && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="h-4 w-4 text-amber-400" />
            <span className="text-amber-400 font-medium">Gate Step - Result affects test path</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 font-medium">Pass:</span>
              <p className="text-slate-300 mt-1">{gateInfo.passPath}</p>
            </div>
            <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 font-medium">Fail:</span>
              <p className="text-slate-300 mt-1">{gateInfo.failPath}</p>
            </div>
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
                  <Icon className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">{level.label}</div>
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
          placeholder="Any observations about this step..."
          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500"
          rows={2}
          disabled={isPending}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedLevel || isPending}
        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Recording...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Record Step {step.step_number} Result
          </>
        )}
      </Button>
    </div>
  )
}
