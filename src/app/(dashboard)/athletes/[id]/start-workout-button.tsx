'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { startWorkoutForAthlete } from '../actions'

interface StartWorkoutButtonProps {
  athleteProgramId: string
  programId: number
  currentWorkoutNumber: number
}

export function StartWorkoutButton({ 
  athleteProgramId, 
  programId,
  currentWorkoutNumber 
}: StartWorkoutButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const result = await startWorkoutForAthlete(athleteProgramId, programId, currentWorkoutNumber)
      if (!result.success) {
        setError(result.error)
        toast.error('Failed to start workout', {
          description: result.error,
        })
      }
      // If successful, the action will redirect
    })
  }

  return (
    <div>
      <Button 
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
      >
        {isPending && <span className="sr-only">Starting workout, please wait</span>}
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Start Workout
          </>
        )}
      </Button>
      {error && (
        <p className="text-red-400 text-sm mt-2" role="alert" aria-live="assertive">
          {error}
        </p>
      )}
    </div>
  )
}
