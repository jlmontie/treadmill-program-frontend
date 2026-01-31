'use client'

import { useForm, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createAthlete } from '../actions'
import { newAthleteFormSchema, type NewAthleteFormValues } from '@/lib/validations/forms'

export default function NewAthletePage() {

  const form = useForm({
    resolver: zodResolver(newAthleteFormSchema),
    defaultValues: {
      name: '',
      gender: undefined as 'male' | 'female' | undefined,
      sport: '',
      position: '',
      birth_date: '',
      head_size: undefined as 'small' | 'medium' | 'large' | undefined,
      chest_size: undefined as 'small' | 'medium' | 'large' | undefined,
      notes: '',
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: FieldValues) => {
    const formData = new FormData()
    formData.set('name', values.name)
    formData.set('gender', values.gender)
    if (values.sport) formData.set('sport', values.sport)
    if (values.position) formData.set('position', values.position)
    if (values.birth_date) formData.set('birth_date', values.birth_date)
    if (values.head_size) formData.set('head_size', values.head_size)
    if (values.chest_size) formData.set('chest_size', values.chest_size)
    if (values.notes) formData.set('notes', values.notes)

    const result = await createAthlete(formData)
    
    if (!result.success) {
      // Set field-level errors if available
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages) {
            form.setError(field as keyof NewAthleteFormValues, { 
              message: messages.join(', ') 
            })
          }
        })
      }
      // Set general error message
      form.setError('root', { message: result.error })
    }
    // Note: createAthlete redirects on success, so no explicit navigation needed
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
          <Link href="/athletes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Add Athlete</h1>
          <p className="text-slate-400 mt-1">
            Register a new athlete in the training program
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Athlete Information</CardTitle>
          <CardDescription className="text-slate-400">
            Enter the athlete&apos;s details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {form.formState.errors.root && (
                <div 
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  role="alert"
                  aria-live="assertive"
                >
                  {form.formState.errors.root.message}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">
                        Name <span className="text-red-400">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Smith"
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">
                        Gender <span className="text-red-400">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="male" className="text-white focus:bg-slate-800">Male</SelectItem>
                          <SelectItem value="female" className="text-white focus:bg-slate-800">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Sport</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Football, Basketball, etc."
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Position</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Lineman, Guard, etc."
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Birth Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Equipment Sizing */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="head_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">
                        Respirator Mask Size
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="small" className="text-white focus:bg-slate-800">Small</SelectItem>
                          <SelectItem value="medium" className="text-white focus:bg-slate-800">Medium</SelectItem>
                          <SelectItem value="large" className="text-white focus:bg-slate-800">Large</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chest_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">
                        HR Monitor Strap Size
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="small" className="text-white focus:bg-slate-800">Small</SelectItem>
                          <SelectItem value="medium" className="text-white focus:bg-slate-800">Medium</SelectItem>
                          <SelectItem value="large" className="text-white focus:bg-slate-800">Large</SelectItem>
                        </SelectContent>
                      </Select>
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
                        placeholder="Any additional notes about the athlete..."
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
                >
                  {isSubmitting && <span className="sr-only">Creating athlete, please wait</span>}
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Athlete'
                  )}
                </Button>
                <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Link href="/athletes">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
