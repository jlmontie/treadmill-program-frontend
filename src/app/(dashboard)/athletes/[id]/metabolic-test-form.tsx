'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog'
import { Heart, Activity, Timer, Loader2, Beaker, AlertCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { saveMetabolicTest } from '../actions'
import { calculateMetabolicData, getMetabolicCategoryLabel } from '@/lib/metabolic'

interface MetabolicTestFormProps {
  athleteId: string
  athleteName: string
  existingResults?: {
    at_hr: number | null
    max_hr: number | null
    recovery_hr_2min: number | null
    recovery_hr: number | null
    at_max_percent: number | null
    recovery_at_percent: number | null
    metabolic_category: string | null
    notes: string | null
  } | null
}

export function MetabolicTestForm({ athleteId, athleteName, existingResults }: MetabolicTestFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [atHr, setAtHr] = useState(existingResults?.at_hr?.toString() || '')
  const [maxHr, setMaxHr] = useState(existingResults?.max_hr?.toString() || '')
  const [recoveryHr2min, setRecoveryHr2min] = useState(existingResults?.recovery_hr_2min?.toString() || '')
  const [notes, setNotes] = useState(existingResults?.notes || '')
  // Detect if existing results used speed-only mode (recovery_hr = maxHr * 0.75)
  const existingSpeedOnly = existingResults?.recovery_hr && existingResults?.max_hr 
    ? existingResults.recovery_hr === Math.ceil(existingResults.max_hr * 0.75)
    : false
  const [speedOnly, setSpeedOnly] = useState(existingSpeedOnly)

  // Calculate derived values using centralized utility
  const atHrNum = atHr ? parseInt(atHr) : null
  const maxHrNum = maxHr ? parseInt(maxHr) : null
  const recoveryHr2minNum = recoveryHr2min ? parseInt(recoveryHr2min) : null
  
  const { atMaxPercent, recoveryAtPercent, metabolicCategory, recoveryHr } = calculateMetabolicData({
    atHr: atHrNum,
    maxHr: maxHrNum,
    recoveryHr2min: recoveryHr2minNum,
    speedOnly
  })
  
  // Round for display
  const atMaxPercentRounded = atMaxPercent ? Math.round(atMaxPercent) : null
  const recoveryAtPercentRounded = recoveryAtPercent ? Math.round(recoveryAtPercent) : null
  const metabolicCategoryLabel = getMetabolicCategoryLabel(metabolicCategory)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!atHr || !maxHr) {
      setError('AT HR and Max HR are required')
      return
    }

    const formData = new FormData()
    formData.set('athlete_id', athleteId)
    formData.set('at_hr', atHr)
    formData.set('max_hr', maxHr)
    if (recoveryHr2min) formData.set('recovery_hr_2min', recoveryHr2min)
    if (speedOnly) formData.set('speed_only', 'true')
    if (notes) formData.set('notes', notes)

    startTransition(async () => {
      const result = await saveMetabolicTest(formData)
      
      if (result.error) {
        setError(result.error)
        toast.error('Failed to save metabolic results', {
          description: result.error,
        })
      } else {
        setOpen(false)
        toast.success('Metabolic test saved', {
          description: `${athleteName}'s metabolic results have been recorded.`,
        })
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-500/25">
          <Beaker className="mr-2 h-4 w-4" />
          {existingResults ? 'Update Metabolic Test' : 'Record Metabolic Test'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-400" />
            Metabolic Test Results
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Record {athleteName}&apos;s heart rate measurements from the metabolic test.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AT Heart Rate */}
            <div className="space-y-2">
              <Label htmlFor="at_hr" className="text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                AT HR (bpm) *
              </Label>
              <Input
                id="at_hr"
                type="number"
                min="60"
                max="220"
                value={atHr}
                onChange={(e) => setAtHr(e.target.value)}
                placeholder="e.g., 165"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                disabled={isPending}
              />
              <p className="text-xs text-slate-500">Anaerobic Threshold</p>
            </div>

            {/* Max Heart Rate */}
            <div className="space-y-2">
              <Label htmlFor="max_hr" className="text-slate-300 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400" />
                Max HR (bpm) *
              </Label>
              <Input
                id="max_hr"
                type="number"
                min="60"
                max="220"
                value={maxHr}
                onChange={(e) => setMaxHr(e.target.value)}
                placeholder="e.g., 185"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500"
                disabled={isPending}
              />
              <p className="text-xs text-slate-500">Maximum HR</p>
            </div>

            {/* 2-Min Recovery HR */}
            <div className="space-y-2">
              <Label htmlFor="recovery_hr_2min" className="text-slate-300 flex items-center gap-2">
                <Timer className="h-4 w-4 text-violet-400" />
                2-Min Recovery HR
              </Label>
              <Input
                id="recovery_hr_2min"
                type="number"
                min="60"
                max="220"
                value={recoveryHr2min}
                onChange={(e) => setRecoveryHr2min(e.target.value)}
                placeholder="e.g., 120"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500"
                disabled={isPending}
              />
              <p className="text-xs text-slate-500">Measured after 2 min rest</p>
            </div>
          </div>

          {/* Speed Only Override */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Checkbox 
              id="speed_only" 
              checked={speedOnly}
              onCheckedChange={(checked) => setSpeedOnly(checked === true)}
              disabled={isPending}
              className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
            />
            <div className="flex-1">
              <Label htmlFor="speed_only" className="text-amber-200 cursor-pointer flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Speed only (low metabolic need)
              </Label>
              <p className="text-xs text-amber-400/70 mt-1">
                Skip HR monitoring during workouts. Recovery HR = Max HR × 75%
              </p>
            </div>
          </div>

          {/* Calculated Values */}
          {(atMaxPercentRounded !== null || metabolicCategory || recoveryHr) && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                Calculated Values
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {atMaxPercentRounded ?? '—'}%
                  </div>
                  <div className="text-xs text-slate-400">AT/Max %</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-400">
                    {recoveryAtPercentRounded ?? '—'}%
                  </div>
                  <div className="text-xs text-slate-400">Recovery/AT %</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${
                    metabolicCategory === 'la' ? 'text-amber-400' :
                    metabolicCategory === 'low' ? 'text-emerald-400' :
                    'text-slate-300'
                  }`}>
                    {metabolicCategoryLabel}
                  </div>
                  <div className="text-xs text-slate-400">Category</div>
                </div>
                <div className="p-2 rounded bg-emerald-500/20 border border-emerald-500/30">
                  <div className="text-2xl font-bold text-emerald-400">
                    {recoveryHr ?? '—'}
                  </div>
                  <div className="text-xs text-emerald-300">Recovery HR Target</div>
                  {speedOnly && <div className="text-[10px] text-amber-400 mt-1">Speed only mode</div>}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Metabolic results determine program suffix: LA (&lt;88%), Standard (88-93%), Low (&gt;94%)
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
              placeholder="Any observations about the metabolic test..."
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              rows={2}
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
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
              disabled={isPending || !atHr || !maxHr}
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Save Results
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
