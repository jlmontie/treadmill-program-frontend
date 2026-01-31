'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { updateAthlete, deleteAthlete } from '../../actions'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

export default function EditAthletePage() {
  const params = useParams()
  const athleteId = params.id as string
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [loading, setLoading] = useState(true)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

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
      }
      setLoading(false)
    }
    
    fetchAthlete()
  }, [athleteId])

  async function handleUpdate(formData: FormData) {
    setUpdateLoading(true)
    setErrors({})
    
    const result = await updateAthlete(athleteId, formData)
    
    if (!result.success) {
      setUpdateLoading(false)
      if (result.fieldErrors) {
        setErrors(result.fieldErrors)
      }
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
          <form action={handleUpdate} className="space-y-6">

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={athlete.name}
                  placeholder="John Smith"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                />
                {errors.name && (
                  <p className="text-sm text-red-400" role="alert" aria-live="assertive">
                    {errors.name.join(', ')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-slate-300">
                  Gender <span className="text-red-400">*</span>
                </Label>
                <Select name="gender" defaultValue={athlete.gender}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="male" className="text-white focus:bg-slate-800">Male</SelectItem>
                    <SelectItem value="female" className="text-white focus:bg-slate-800">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-400" role="alert" aria-live="assertive">
                    {errors.gender.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sport" className="text-slate-300">Sport</Label>
                <Input
                  id="sport"
                  name="sport"
                  defaultValue={athlete.sport || ''}
                  placeholder="Football, Basketball, etc."
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-slate-300">Position</Label>
                <Input
                  id="position"
                  name="position"
                  defaultValue={athlete.position || ''}
                  placeholder="Lineman, Guard, etc."
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date" className="text-slate-300">Birth Date</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                defaultValue={athlete.birth_date || ''}
                className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500"
              />
            </div>

            {/* Equipment Sizing */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="head_size" className="text-slate-300">
                  Respirator Mask Size
                </Label>
                <Select name="head_size" defaultValue={athlete.head_size || undefined}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="small" className="text-white focus:bg-slate-800">Small</SelectItem>
                    <SelectItem value="medium" className="text-white focus:bg-slate-800">Medium</SelectItem>
                    <SelectItem value="large" className="text-white focus:bg-slate-800">Large</SelectItem>
                  </SelectContent>
                </Select>
                {errors.head_size && (
                  <p className="text-sm text-red-400" role="alert" aria-live="assertive">
                    {errors.head_size.join(', ')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chest_size" className="text-slate-300">
                  HR Monitor Strap Size
                </Label>
                <Select name="chest_size" defaultValue={athlete.chest_size || undefined}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="small" className="text-white focus:bg-slate-800">Small</SelectItem>
                    <SelectItem value="medium" className="text-white focus:bg-slate-800">Medium</SelectItem>
                    <SelectItem value="large" className="text-white focus:bg-slate-800">Large</SelectItem>
                  </SelectContent>
                </Select>
                {errors.chest_size && (
                  <p className="text-sm text-red-400" role="alert" aria-live="assertive">
                    {errors.chest_size.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={athlete.notes || ''}
                placeholder="Any additional notes about the athlete..."
                className="w-full rounded-md bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={updateLoading}
                aria-busy={updateLoading}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
              >
                {updateLoading && <span className="sr-only">Saving changes, please wait</span>}
                {updateLoading ? (
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
