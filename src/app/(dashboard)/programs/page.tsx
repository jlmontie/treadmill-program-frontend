import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Library } from 'lucide-react'

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
    .order('athlete_type', { ascending: true })
    .order('level', { ascending: true })

  if (error) {
    console.error('Error fetching programs:', error)
  }

  const programs = (data || []) as unknown as Program[]

  // Group programs by athlete type
  const groupedPrograms = programs.reduce((acc, program) => {
    const type = program.athlete_type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(program)
    return acc
  }, {} as Record<string, Program[]>)

  const athleteTypeLabels: Record<string, string> = {
    'line': 'Lineman Programs',
    'standard': 'Standard Programs',
    'female': 'Female Programs',
  }

  const levelColors: Record<string, string> = {
    'dev': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'red': 'bg-red-500/10 text-red-400 border-red-500/20',
    'standard': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'adv': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'ii': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'iii': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }

  const metabolicColors: Record<string, string> = {
    'la': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'standard': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'low': 'bg-green-500/10 text-green-400 border-green-500/20',
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Programs</h1>
        <p className="text-slate-400 mt-1">
          Browse all available training programs ({programs?.length || 0} total)
        </p>
      </div>

      {/* Programs by Type */}
      {Object.entries(groupedPrograms).map(([type, typePrograms]) => (
        <Card key={type} className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Library className="h-5 w-5 text-cyan-400" />
              {athleteTypeLabels[type] || type}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {typePrograms?.length} programs available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {typePrograms?.map((program) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.id}`}
                  className="block p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                      {program.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className={levelColors[program.level] || levelColors['standard']}>
                      {program.level.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className={metabolicColors[program.metabolic_category] || metabolicColors['standard']}>
                      {program.metabolic_category === 'la' ? 'High LA' : program.metabolic_category}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {program.total_workouts} workouts
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {(!programs || programs.length === 0) && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12">
            <div className="text-center">
              <Library className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-white">No programs found</h3>
              <p className="mt-2 text-slate-400">
                Programs haven&apos;t been imported yet. Run the seed migration to populate programs.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
