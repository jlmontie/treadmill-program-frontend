'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
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
  DialogTrigger 
} from '@/components/ui/dialog'
import { Pencil, Loader2, Save, Heart, Activity, Timer } from 'lucide-react'
import { updateMetabolicResults } from '../actions'
import { editMetabolicFormSchema, type EditMetabolicFormValues } from '@/lib/validations/forms'

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
  const [open, setOpen] = useState(false)

  const form = useForm<EditMetabolicFormValues>({
    resolver: zodResolver(editMetabolicFormSchema),
    defaultValues: {
      at_hr: currentData?.at_hr?.toString() ?? '',
      max_hr: currentData?.max_hr?.toString() ?? '',
      recovery_hr_2min: currentData?.recovery_hr_2min?.toString() ?? '',
      notes: currentData?.notes ?? '',
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: EditMetabolicFormValues) => {
    const formData = new FormData()
    formData.set('session_id', sessionId)
    formData.set('at_hr', values.at_hr)
    formData.set('max_hr', values.max_hr)
    formData.set('recovery_hr_2min', values.recovery_hr_2min)
    formData.set('notes', values.notes)

    const result = await updateMetabolicResults(formData)
    
    if (!result.success) {
      form.setError('root', { message: result.error })
    } else {
      setOpen(false)
      router.refresh()
    }
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="at_hr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      AT HR (bpm)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={220}
                        placeholder="165"
                        className="bg-slate-800/50 border-slate-700 text-white"
                        disabled={isSubmitting}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_hr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-400" />
                      Max HR (bpm)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={220}
                        placeholder="185"
                        className="bg-slate-800/50 border-slate-700 text-white"
                        disabled={isSubmitting}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recovery_hr_2min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 flex items-center gap-2">
                      <Timer className="h-4 w-4 text-violet-400" />
                      Recovery HR (2m)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={220}
                        placeholder="120"
                        className="bg-slate-800/50 border-slate-700 text-white"
                        disabled={isSubmitting}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional observations..."
                      className="bg-slate-800/50 border-slate-700 text-white"
                      rows={2}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div 
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                role="alert"
                aria-live="assertive"
              >
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              >
                {isSubmitting && <span className="sr-only">Saving metabolic data, please wait</span>}
                {isSubmitting ? (
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
        </Form>
      </DialogContent>
    </Dialog>
  )
}
