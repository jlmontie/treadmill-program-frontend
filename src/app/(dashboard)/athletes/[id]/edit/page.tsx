'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateAthlete, deleteAthlete } from '../../actions'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Athlete } from '@/lib/types/database'
import { newAthleteFormSchema, type NewAthleteFormValues } from '@/lib/validations/forms'

export default function EditAthletePage() {
  const params = useParams()
  const athleteId = params.id as string
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
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

  useEffect(() => {
    async function fetchAthlete() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', athleteId)
        .single()
      
      if (!error && data) {
        setAthlete(data)
        // Populate form with athlete data
        form.reset({
          name: data.name,
          gender: data.gender,
          sport: data.sport || '',
          position: data.position || '',
          birth_date: data.birth_date || '',
          head_size: data.head_size || undefined,
          chest_size: data.chest_size || undefined,
          notes: data.notes || '',
        })
      }
      setLoading(false)
    }
    
    fetchAthlete()
  }, [athleteId, form])

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
    
    const result = await updateAthlete(athleteId, formData)
    
    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages) {
            form.setError(field as keyof NewAthleteFormValues, { 
              message: messages.join(', ') 
            })
          }
        })
      }
      form.setError('root', { message: result.error })
      toast.error(result.error)
    }
    // Note: updateAthlete redirects on success
  }

  async function handleDelete() {
    setDeleteLoading(true)
    
    const result = await deleteAthlete(athleteId)
    
    if (!result.success) {
      setDeleteLoading(false)
      toast.error(result.error)
    }
    // Note: deleteAthlete redirects on success
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Athlete not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
          <Link href={`/athletes/${athleteId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Edit Athlete</h1>
          <p className="text-slate-400 mt-1">
            Update {athlete.name}&apos;s information
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Athlete Information</CardTitle>
          <CardDescription className="text-slate-400">
            Make changes to the athlete&apos;s profile
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
                  {isSubmitting && <span className="sr-only">Saving changes, please wait</span>}
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Link href={`/athletes/${athleteId}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="max-w-2xl border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
          <CardDescription className="text-slate-400">
            Irreversible actions for this athlete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Athlete
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Delete Athlete</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Are you sure you want to delete {athlete.name}? This action cannot be undone.
                  All associated workout sessions and pre-tests will also be deleted.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  aria-busy={deleteLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteLoading && <span className="sr-only">Deleting athlete, please wait</span>}
                  {deleteLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
