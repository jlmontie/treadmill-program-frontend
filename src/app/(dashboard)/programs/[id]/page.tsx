import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import type { Metadata } from 'next'

interface ProgramDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProgramDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const programId = parseInt(id, 10)
  
  if (isNaN(programId)) {
    return { title: 'Invalid Program | TreadTrack' }
  }
  
  const supabase = await createClient()
  
  const { data: program } = await supabase
    .from('programs')
    .select('name, athlete_type, level')
    .eq('id', programId)
    .single()

  if (!program) {
    return {
      title: 'Program Not Found | TreadTrack',
    }
  }

  return {
    title: `${program.name} | TreadTrack`,
    description: `${program.athlete_type} ${program.level} training program`,
  }
}

interface ProgramWorkout {
  id: number
  workout_number: number
  name: string | null
  workout_exercises: Array<{
    id: number
    sequence: number
    num_runs: number
    incline: number | null
    speed_col1: number | null
    speed_col2: number | null
    speed_col3: number | null
    time_pattern: string | null
    exercise_type: string
    notes: string | null
  }>
}

interface ProgramWithWorkouts {
  id: number
  code: string
  name: string
  athlete_type: string
  level: string
  metabolic_category: string
  total_workouts: number
  program_workouts: ProgramWorkout[]
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { id } = await params
  const programId = parseInt(id, 10)
  
  if (isNaN(programId)) {
    notFound()
  }
  
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      program_workouts (
        id,
        workout_number,
        name,
        workout_exercises (
          id,
          sequence,
          num_runs,
          incline,
          speed_col1,
          speed_col2,
          speed_col3,
          time_pattern,
          exercise_type,
          notes
        )
      )
    `)
    .eq('id', programId)
    .single()

  if (error || !data) {
    notFound()
  }

  const program = data as unknown as ProgramWithWorkouts

  // Sort workouts by number
  const sortedWorkouts = [...(program.program_workouts || [])].sort(
    (a, b) => a.workout_number - b.workout_number
  )

  const levelColors: Record<string, string> = {
    'dev': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'red': 'bg-red-500/10 text-red-400 border-red-500/20',
    'standard': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'adv': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'ii': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'iii': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="mt-1 text-slate-400 hover:text-white">
            <Link href="/programs">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-white">{program.name}</h1>
              <Badge variant="secondary" className={levelColors[program.level] || levelColors['standard']}>
                {program.level.toUpperCase()}
              </Badge>
            </div>
            <p className="text-slate-400 mt-1">
              {program.total_workouts} workouts • {program.athlete_type} • {program.metabolic_category} metabolic
            </p>
          </div>
        </div>
      </div>

      {/* Workouts */}
      <div className="space-y-6">
        {sortedWorkouts.map((workout: {
          id: number
          workout_number: number
          name: string | null
          workout_exercises: Array<{
            id: number
            sequence: number
            num_runs: number
            incline: number | null
            speed_col1: number | null
            speed_col2: number | null
            speed_col3: number | null
            time_pattern: string | null
            exercise_type: string
            notes: string | null
          }>
        }) => {
          const sortedExercises = workout.workout_exercises?.sort(
            (a, b) => a.sequence - b.sequence
          )

          return (
            <Card key={workout.id} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-cyan-400" />
                  Workout #{workout.workout_number}
                  {workout.name && <span className="text-slate-400 font-normal">— {workout.name}</span>}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {workout.workout_exercises?.length || 0} exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400 w-12">#</TableHead>
                        <TableHead className="text-slate-400">Runs</TableHead>
                        <TableHead className="text-slate-400">Incline</TableHead>
                        <TableHead className="text-slate-400">Speed 1</TableHead>
                        <TableHead className="text-slate-400">Speed 2</TableHead>
                        <TableHead className="text-slate-400">Speed 3</TableHead>
                        <TableHead className="text-slate-400">Time</TableHead>
                        <TableHead className="text-slate-400">Type</TableHead>
                        <TableHead className="text-slate-400">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedExercises?.map((exercise) => (
                        <TableRow key={exercise.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="text-slate-500 font-mono">
                            {exercise.sequence}
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            {exercise.num_runs}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {exercise.incline !== null ? `${exercise.incline}%` : '—'}
                          </TableCell>
                          <TableCell className="text-emerald-400 font-mono">
                            {exercise.speed_col1 || '—'}
                          </TableCell>
                          <TableCell className="text-amber-400 font-mono">
                            {exercise.speed_col2 || '—'}
                          </TableCell>
                          <TableCell className="text-red-400 font-mono">
                            {exercise.speed_col3 || '—'}
                          </TableCell>
                          <TableCell className="text-slate-300 font-mono">
                            {exercise.time_pattern || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className="bg-slate-700/50 text-slate-300 border-slate-600"
                            >
                              {exercise.exercise_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm max-w-[200px] truncate">
                            {exercise.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
