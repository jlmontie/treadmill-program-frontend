'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Pencil, Loader2, Save, Heart, Activity, Timer } from 'lucide-react'
import { updateMetabolicResults } from '../actions'

interface EditMetabolicFormProps {
  sessionId: string
  currentData: {
    at_hr: number | null
    max_hr: number | null
    recovery_hr_2min: number | null
    notes: string | null
  } | null
}

export function EditMetabolicForm({ sessionId, currentData }: EditMetabolicFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [atHr, setAtHr] = useState(currentData?.at_hr?.toString() || '')
  const [maxHr, setMaxHr] = useState(currentData?.max_hr?.toString() || '')
  const [recoveryHr, setRecoveryHr] = useState(currentData?.recovery_hr_2min?.toString() || '')
  const [notes, setNotes] = useState(currentData?.notes || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.set('session_id', sessionId)
    formData.set('at_hr', atHr)
    formData.set('max_hr', maxHr)
    formData.set('recovery_hr_2min', recoveryHr)
    formData.set('notes', notes)

    startTransition(async () => {
      const result = await updateMetabolicResults(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Metabolic Data
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Metabolic Results</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update the heart rate measurements for this pre-test.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="at_hr" className="text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                AT HR (bpm)
              </Label>
              <Input
                id="at_hr"
                type="number"
                min="60"
                max="220"
                value={atHr}
                onChange={(e) => setAtHr(e.target.value)}
                placeholder="165"
                className="bg-slate-800/50 border-slate-700 text-white"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_hr" className="text-slate-300 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400" />
                Max HR (bpm)
              </Label>
              <Input
                id="max_hr"
                type="number"
                min="60"
                max="220"
                value={maxHr}
                onChange={(e) => setMaxHr(e.target.value)}
                placeholder="185"
                className="bg-slate-800/50 border-slate-700 text-white"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recovery_hr" className="text-slate-300 flex items-center gap-2">
                <Timer className="h-4 w-4 text-violet-400" />
                Recovery HR (2m)
              </Label>
              <Input
                id="recovery_hr"
                type="number"
                min="60"
                max="220"
                value={recoveryHr}
                onChange={(e) => setRecoveryHr(e.target.value)}
                placeholder="120"
                className="bg-slate-800/50 border-slate-700 text-white"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations..."
              className="bg-slate-800/50 border-slate-700 text-white"
              rows={2}
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
