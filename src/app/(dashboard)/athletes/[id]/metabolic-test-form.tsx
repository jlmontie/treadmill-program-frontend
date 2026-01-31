'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog'
import { Heart, Activity, Timer, Loader2, Beaker, AlertCircle, Zap, RefreshCw } from 'lucide-react'
import { saveMetabolicTest } from '../actions'
import { calculateMetabolicData, getMetabolicCategoryLabel } from '@/lib/metabolic'
import { useRetryAction } from '@/hooks/use-retry-action'
import { metabolicTestFormSchema, type MetabolicTestFormValues } from '@/lib/validations/forms'

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
  const [open, setOpen] = useState(false)
  
  // Detect if existing results used speed-only mode (recovery_hr = maxHr * 0.75)
  const existingSpeedOnly = existingResults?.recovery_hr && existingResults?.max_hr 
    ? existingResults.recovery_hr === Math.ceil(existingResults.max_hr * 0.75)
    : false

  // Use retry hook for automatic retry on network failures
  const { execute, isPending, retryAttempt, error, clearError } = useRetryAction({
    maxRetries: 2,
    successMessage: `${athleteName}'s metabolic results have been recorded.`,
    showRetryToasts: true,
  })

  const form = useForm({
    resolver: zodResolver(metabolicTestFormSchema),
    defaultValues: {
      at_hr: existingResults?.at_hr?.toString() ?? '',
      max_hr: existingResults?.max_hr?.toString() ?? '',
      recovery_hr_2min: existingResults?.recovery_hr_2min?.toString() ?? '',
      speed_only: existingSpeedOnly,
      notes: existingResults?.notes ?? '',
    },
    mode: 'onChange',
  })

  // Watch values for calculated fields - parse string values to numbers
  const watchedValues = form.watch()
  const atHrNum = watchedValues.at_hr ? parseInt(watchedValues.at_hr, 10) : null
  const maxHrNum = watchedValues.max_hr ? parseInt(watchedValues.max_hr, 10) : null
  const recoveryHr2minNum = watchedValues.recovery_hr_2min ? parseInt(watchedValues.recovery_hr_2min, 10) : null
  
  const { atMaxPercent, recoveryAtPercent, metabolicCategory, recoveryHr } = calculateMetabolicData({
    atHr: atHrNum,
    maxHr: maxHrNum,
    recoveryHr2min: recoveryHr2minNum,
    speedOnly: watchedValues.speed_only
  })
  
  // Round for display
  const atMaxPercentRounded = atMaxPercent ? Math.round(atMaxPercent) : null
  const recoveryAtPercentRounded = recoveryAtPercent ? Math.round(recoveryAtPercent) : null
  const metabolicCategoryLabel = getMetabolicCategoryLabel(metabolicCategory)

  const onSubmit = async (values: FieldValues) => {
    clearError()

    const formData = new FormData()
    formData.set('athlete_id', athleteId)
    formData.set('at_hr', String(values.at_hr))
    formData.set('max_hr', String(values.max_hr))
    if (values.recovery_hr_2min) formData.set('recovery_hr_2min', String(values.recovery_hr_2min))
    if (values.speed_only) formData.set('speed_only', 'true')
    if (values.notes) formData.set('notes', values.notes as string)

    const result = await execute(() => saveMetabolicTest(formData))
    
    if ('success' in result) {
      setOpen(false)
      router.refresh()
    }
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AT Heart Rate */}
              <FormField
                control={form.control}
                name="at_hr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      AT HR (bpm) *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={220}
                        placeholder="e.g., 165"
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        disabled={isPending}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">Anaerobic Threshold</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Max Heart Rate */}
              <FormField
                control={form.control}
                name="max_hr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-400" />
                      Max HR (bpm) *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={220}
                        placeholder="e.g., 185"
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500"
                        disabled={isPending}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">Maximum HR</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 2-Min Recovery HR */}
              <FormField
                control={form.control}
                name="recovery_hr_2min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 flex items-center gap-2">
                      <Timer className="h-4 w-4 text-violet-400" />
                      2-Min Recovery HR
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={220}
                        placeholder="e.g., 120"
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500"
                        disabled={isPending}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">Measured after 2 min rest</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Speed Only Override */}
            <FormField
              control={form.control}
              name="speed_only"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                      className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                  </FormControl>
                  <div className="flex-1 leading-none">
                    <FormLabel className="text-amber-200 cursor-pointer flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Speed only (low metabolic need)
                    </FormLabel>
                    <FormDescription className="text-amber-400/70 mt-1">
                      Skip HR monitoring during workouts. Recovery HR = Max HR × 75%
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

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
                    {watchedValues.speed_only && <div className="text-[10px] text-amber-400 mt-1">Speed only mode</div>}
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
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any observations about the metabolic test..."
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      rows={2}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={isPending || !form.formState.isValid}
                className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500"
              >
                {isPending ? (
                  retryAttempt > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Retrying ({retryAttempt})...
                    </>
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  )
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Save Results
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
