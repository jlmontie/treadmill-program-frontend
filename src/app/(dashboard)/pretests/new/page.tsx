import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeft, ClipboardCheck, Users } from 'lucide-react'
import { startPretest } from '../actions'

interface PretestType {
  id: number
  code: string
  name: string
  description: string | null
}

interface Athlete {
  id: string
  name: string
  gender: 'male' | 'female'
  sport: string | null
}

export default async function NewPretestPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete?: string }>
}) {
  const { athlete: preselectedAthleteId } = await searchParams
  const supabase = await createClient()

  // Fetch athletes and pre-test types
  const [athletesResult, typesResult] = await Promise.all([
    supabase.from('athletes').select('id, name, gender, sport').order('name'),
    supabase.from('pretest_types').select('*').order('id'),
  ])

  const athletes = (athletesResult.data || []) as unknown as Athlete[]
  const pretestTypes = (typesResult.data || []) as unknown as PretestType[]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
          <Link href="/pretests">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">New Pre-Test</h1>
          <p className="text-slate-400 mt-1">
            Select an athlete and pre-test type to begin
          </p>
        </div>
      </div>

      {athletes.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-white">No athletes found</h3>
              <p className="mt-2 text-slate-400">
                You need to add an athlete before starting a pre-test.
              </p>
              <Button asChild className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                <Link href="/athletes/new">Add Athlete</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-violet-400" />
              Pre-Test Setup
            </CardTitle>
            <CardDescription className="text-slate-400">
              Choose the athlete and type of pre-test to administer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={startPretest} className="space-y-6">
              {/* Athlete Selection */}
              <div className="space-y-2">
                <Label htmlFor="athlete_id" className="text-slate-300">
                  Athlete <span className="text-red-400">*</span>
                </Label>
                <Select name="athlete_id" defaultValue={preselectedAthleteId}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500">
                    <SelectValue placeholder="Select an athlete" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {athletes.map((athlete) => (
                      <SelectItem 
                        key={athlete.id} 
                        value={athlete.id}
                        className="text-white focus:bg-slate-800"
                      >
                        {athlete.name}
                        {athlete.sport && (
                          <span className="text-slate-500 ml-2">• {athlete.sport}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pre-Test Type Selection */}
              <div className="space-y-3">
                <Label className="text-slate-300">
                  Pre-Test Type <span className="text-red-400">*</span>
                </Label>
                <div className="grid gap-3">
                  {pretestTypes.map((type) => (
                    <label
                      key={type.id}
                      className="relative flex cursor-pointer rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:border-slate-600 focus:outline-none has-[:checked]:border-violet-500 has-[:checked]:bg-violet-500/10 transition-colors"
                    >
                      <input
                        type="radio"
                        name="pretest_type_id"
                        value={type.id}
                        className="sr-only"
                      />
                      <div className="flex flex-1 flex-col">
                        <span className="text-white font-medium">{type.name}</span>
                        {type.description && (
                          <span className="text-sm text-slate-400 mt-1">
                            {type.description}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex items-center">
                        <div className="h-5 w-5 rounded-full border-2 border-slate-600 flex items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-violet-500 opacity-0 [[data-state=checked]_&]:opacity-100 peer-checked:opacity-100" />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Start Pre-Test
                </Button>
                <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Link href="/pretests">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pre-Test Type Info */}
      <Card className="max-w-2xl bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">About Pre-Test Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-white">Lineman Pre-Test</h4>
            <p className="text-slate-400">For larger athletes like football linemen with lower aerobic capacity requirements.</p>
          </div>
          <div>
            <h4 className="font-medium text-white">Standard Pre-Test</h4>
            <p className="text-slate-400">Standard pre-test for most athletes.</p>
          </div>
          <div>
            <h4 className="font-medium text-white">Returning Pre-Test</h4>
            <p className="text-slate-400">For returning athletes who have previously completed the program.</p>
          </div>
          <div>
            <h4 className="font-medium text-white">Returning Female Pre-Test</h4>
            <p className="text-slate-400">For returning female athletes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
