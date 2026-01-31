'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { cancelWorkout } from '../../actions'

interface CancelWorkoutButtonProps {
  sessionId: string
  athleteName: string
  workoutNumber: number
  completedExercises: number
  totalExercises: number
}

export function CancelWorkoutButton({
  sessionId,
  athleteName,
  workoutNumber,
  completedExercises,
  totalExercises,
}: CancelWorkoutButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await cancelWorkout(sessionId)
        // If we reach here without redirect, show success
        toast.success('Workout cancelled', {
          description: `${athleteName}'s workout #${workoutNumber} has been cancelled.`,
        })
      } catch (error) {
        // Only show error if it's not a redirect (NEXT_REDIRECT)
        if (error instanceof Error && !error.message.includes('NEXT_REDIRECT')) {
          toast.error('Failed to cancel workout', {
            description: error.message,
          })
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Workout
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Cancel Workout?
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Are you sure you want to cancel this workout session?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Athlete:</span>
                <span className="text-white ml-2">{athleteName}</span>
              </div>
              <div>
                <span className="text-slate-400">Workout:</span>
                <span className="text-white ml-2">#{workoutNumber}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Progress:</span>
                <span className="text-white ml-2">
                  {completedExercises} / {totalExercises} exercises completed
                </span>
              </div>
            </div>
          </div>
          
          {completedExercises > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              This workout has {completedExercises} recorded exercise(s). 
              Canceling will discard all progress.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Keep Workout
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Canceling...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Workout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
