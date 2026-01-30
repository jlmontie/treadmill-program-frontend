'use client'

import { useActionState } from 'react'
import { createAthlete, type AthleteFormState } from '../actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const initialState: AthleteFormState = {}

export default function NewAthletePage() {
  const [state, formAction, isPending] = useActionState(createAthlete, initialState)

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
          <form action={formAction} className="space-y-6">
            {state.errors?._form && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {state.errors._form.join(', ')}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Smith"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                />
                {state.errors?.name && (
                  <p className="text-sm text-red-400">{state.errors.name.join(', ')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-slate-300">
                  Gender <span className="text-red-400">*</span>
                </Label>
                <Select name="gender">
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="male" className="text-white focus:bg-slate-800">Male</SelectItem>
                    <SelectItem value="female" className="text-white focus:bg-slate-800">Female</SelectItem>
                  </SelectContent>
                </Select>
                {state.errors?.gender && (
                  <p className="text-sm text-red-400">{state.errors.gender.join(', ')}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sport" className="text-slate-300">Sport</Label>
                <Input
                  id="sport"
                  name="sport"
                  placeholder="Football, Basketball, etc."
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-slate-300">Position</Label>
                <Input
                  id="position"
                  name="position"
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
                className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500"
              />
            </div>

            {/* Equipment Sizing */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="head_size" className="text-slate-300">
                  Respirator Mask Size
                </Label>
                <Select name="head_size">
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="small" className="text-white focus:bg-slate-800">Small</SelectItem>
                    <SelectItem value="medium" className="text-white focus:bg-slate-800">Medium</SelectItem>
                    <SelectItem value="large" className="text-white focus:bg-slate-800">Large</SelectItem>
                  </SelectContent>
                </Select>
                {state.errors?.head_size && (
                  <p className="text-sm text-red-400">{state.errors.head_size.join(', ')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chest_size" className="text-slate-300">
                  HR Monitor Strap Size
                </Label>
                <Select name="chest_size">
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="small" className="text-white focus:bg-slate-800">Small</SelectItem>
                    <SelectItem value="medium" className="text-white focus:bg-slate-800">Medium</SelectItem>
                    <SelectItem value="large" className="text-white focus:bg-slate-800">Large</SelectItem>
                  </SelectContent>
                </Select>
                {state.errors?.chest_size && (
                  <p className="text-sm text-red-400">{state.errors.chest_size.join(', ')}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Any additional notes about the athlete..."
                className="w-full rounded-md bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
              >
                {isPending ? (
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
        </CardContent>
      </Card>
    </div>
  )
}
