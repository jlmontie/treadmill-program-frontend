import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Library } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Programs | TreadTrack',
  description: 'Browse all available training programs',
}

interface Program {
  id: number
  code: string
  name: string
  athlete_type: string
  level: string
  metabolic_category: string
  total_workouts: number
}

export default async function ProgramsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('level', { ascending: true })
    .order('athlete_type', { ascending: true })

  if (error && process.env.NODE_ENV === 'development') {
    console.error('Error fetching programs:', error)
  }

  const programs = (data || []) as unknown as Program[]

  // Group programs by level, treating 'dev' and 'dev_leg' as the same
  const groupedPrograms = programs.reduce(
    (acc, program) => {
      const level = program.level === 'dev_leg' ? 'dev' : program.level
      if (!acc[level]) {
        acc[level] = []
      }
      acc[level].push(program)
      return acc
    },
    {} as Record<string, Program[]>
  )

  const levelLabels: Record<string, string> = {
    dev: 'Developmental',
    red: 'Reduced Speed',
    standard: 'Standard',
    adv: 'Advanced',
    ii: 'Level II',
    iii: 'Level III',
  }

  // Order for displaying levels
  const levelOrder = ['dev', 'red', 'standard', 'adv', 'ii', 'iii']

  const athleteTypeLabels: Record<string, string> = {
    standard: 'Standard',
    female: 'Female',
    line: 'Lineman',
  }

  const metabolicLabels: Record<string, string> = {
    la: 'High LA',
    standard: 'Standard',
    low: 'Low Met',
  }

  const athleteTypeColors: Record<string, string> = {
    standard: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    female: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    line: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  const metabolicColors: Record<string, string> = {
    la: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    standard: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Programs</h1>
        <p className="mt-1 text-slate-400">
          Browse all available training programs ({programs?.length || 0} total)
        </p>
      </div>

      {/* Programs by Level */}
      {levelOrder
        .filter((level) => groupedPrograms[level])
        .map((level) => {
          const levelPrograms = groupedPrograms[level]
          return (
            <Card key={level} className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Library className="h-5 w-5 text-cyan-400" />
                  {levelLabels[level] || level}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {levelPrograms?.length} programs available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {levelPrograms?.map((program) => (
                    <Link
                      key={program.id}
                      href={`/programs/${program.id}`}
                      className="group block rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <h3 className="font-medium text-white transition-colors group-hover:text-cyan-400">
                          {program.name}
                        </h3>
                      </div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className={
                            athleteTypeColors[program.athlete_type] || athleteTypeColors.male
                          }
                        >
                          {athleteTypeLabels[program.athlete_type] || program.athlete_type}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={
                            metabolicColors[program.metabolic_category] || metabolicColors.standard
                          }
                        >
                          {metabolicLabels[program.metabolic_category] ||
                            program.metabolic_category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{program.total_workouts} workouts</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}

      {(!programs || programs.length === 0) && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="py-12">
            <div className="text-center">
              <Library className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-white">No programs found</h3>
              <p className="mt-2 text-slate-400">
                Programs haven&apos;t been imported yet. Run the seed migration to populate
                programs.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
