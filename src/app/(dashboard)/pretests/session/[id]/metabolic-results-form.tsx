'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Heart, Activity, Timer, CheckCircle2, Loader2 } from 'lucide-react'
import { completePretest } from '../../actions'
import { metabolicResultsFormSchema, type MetabolicResultsFormValues } from '@/lib/validations/forms'

interface MetabolicResultsFormProps {
  sessionId: string
  athleteName: string
}

export function MetabolicResultsForm({ sessionId, athleteName }: MetabolicResultsFormProps) {
  const router = useRouter()

  const form = useForm<MetabolicResultsFormValues>({
    resolver: zodResolver(metabolicResultsFormSchema),
    defaultValues: {
      at_hr: '',
      max_hr: '',
      recovery_hr_2min: '',
      notes: '',
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: MetabolicResultsFormValues) => {
    const formData = new FormData()
    formData.set('session_id', sessionId)
    if (values.at_hr) formData.set('at_hr', values.at_hr)
    if (values.max_hr) formData.set('max_hr', values.max_hr)
    if (values.recovery_hr_2min) formData.set('recovery_hr_2min', values.recovery_hr_2min)
    if (values.notes) formData.set('notes', values.notes)

    await completePretest(formData)
    router.refresh()
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-400" />
          Metabolic Results
        </CardTitle>
        <CardDescription className="text-slate-300">
          All steps completed! Record {athleteName}&apos;s heart rate measurements to finish the pre-test.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AT Heart Rate */}
              <FormField
                control={form.control}
                name="at_hr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      AT Heart Rate (bpm)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={220}
                        placeholder="e.g., 165"
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        disabled={isSubmitting}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">Anaerobic Threshold HR</FormDescription>
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
                      Max Heart Rate (bpm)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={220}
                        placeholder="e.g., 185"
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500"
                        disabled={isSubmitting}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">Maximum HR achieved</FormDescription>
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
                      Recovery HR (2 min)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={220}
                        placeholder="e.g., 120"
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500"
                        disabled={isSubmitting}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">HR after 2 min recovery</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h4 className="font-medium text-white mb-2">How Metabolic Data is Used</h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• <strong>AT/Max %</strong>: Calculated automatically from AT and Max HR</li>
                <li>• <strong>Recovery %</strong>: Recovery HR / AT HR indicates conditioning level</li>
                <li>• <strong>Metabolic Category</strong>: Determines if athlete needs extra conditioning work</li>
              </ul>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">
                    Notes (optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Overall observations, athlete feedback, or recommendations..."
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                      rows={3}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25"
              >
                {isSubmitting && <span className="sr-only">Completing pretest, please wait</span>}
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Pre-Test
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
