export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Edit, Play, ClipboardCheck, Calendar, User, Dumbbell } from 'lucide-react'
import { AssignProgramForm } from './assign-program-form'

interface AthleteDetailPageProps {
  params: Promise<{ id: string }>
}

interface Program {
  id: number
  name: string
  athlete_type: string
  level: string
  metabolic_category: string
  total_workouts: number
}

// Type for the joined athlete data
interface AthleteWithRelations {
  id: string
  name: string
  gender: 'male' | 'female'
  sport: string | null
  position: string | null
  birth_date: string | null
  notes: string | null
  created_at: string
  athlete_programs: Array<{
    id: string
    status: string
    start_date: string
    current_workout_number: number
    programs: { id: number; name: string; level: string; total_workouts: number } | null
  }> | null
  pretest_sessions: Array<{
    id: string
    session_date: string
    status: string
    pretest_types: { name: string } | null
  }> | null
}

export default async function AthleteDetailPage({ params }: AthleteDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('athletes')
    .select(`
      *,
      athlete_programs (
        id,
        status,
        start_date,
        current_workout_number,
        programs (
          id,
          name,
          level,
          total_workouts
        )
      ),
      pretest_sessions (
        id,
        session_date,
        status,
        pretest_types (name)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const athlete = data as unknown as AthleteWithRelations

  // Fetch all programs for assignment
  const { data: programsData } = await supabase
    .from('programs')
    .select('id, name, athlete_type, level, metabolic_category, total_workouts')
    .order('athlete_type')
    .order('level')

  const programs = (programsData || []) as unknown as Program[]

  const activeProgram = athlete.athlete_programs?.find(
    (ap) => ap.status === 'active'
  )
  
  const hasActiveProgram = !!activeProgram
  
  // Get most recent completed pre-test
  const latestPretest = athlete.pretest_sessions
    ?.filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="mt-1 text-slate-400 hover:text-white">
            <Link href="/athletes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{athlete.name}</h1>
              <Badge 
                variant="secondary"
                className={athlete.gender === 'male' 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                  : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                }
              >
                {athlete.gender}
              </Badge>
            </div>
            <p className="text-slate-400 mt-1">
              {athlete.sport ? `${athlete.sport}${athlete.position ? ` • ${athlete.position}` : ''}` : 'No sport specified'}
            </p>
          </div>
        </div>
        <div className="flex gap-3 ml-12 md:ml-0">
          <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Link href={`/athletes/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AssignProgramForm 
            athleteId={id}
            athleteName={athlete.name}
            athleteGender={athlete.gender}
            programs={programs}
            hasActiveProgram={hasActiveProgram}
            pretestSessionId={latestPretest?.id}
          />
          {activeProgram && (
            <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25">
              <Link href="/workouts/new">
                <Play className="mr-2 h-4 w-4" />
                Start Workout
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Athlete Details */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-cyan-400" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Birth Date</p>
              <p className="text-white">
                {athlete.birth_date 
                  ? new Date(athlete.birth_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Added</p>
              <p className="text-white">
                {new Date(athlete.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            {athlete.notes && (
              <div>
                <p className="text-sm text-slate-500">Notes</p>
                <p className="text-slate-300">{athlete.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Program */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
              Current Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeProgram ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Program</p>
                  <p className="text-white font-medium">
                    {activeProgram.programs?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Progress</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">
                        Workout {activeProgram.current_workout_number} of {activeProgram.programs?.total_workouts}
                      </span>
                      <span className="text-cyan-400">
                        {activeProgram.programs?.total_workouts 
                          ? Math.round((activeProgram.current_workout_number / activeProgram.programs.total_workouts) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                        style={{ 
                          width: `${activeProgram.programs?.total_workouts 
                            ? (activeProgram.current_workout_number / activeProgram.programs.total_workouts) * 100
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Started</p>
                  <p className="text-white">
                    {new Date(activeProgram.start_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Dumbbell className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <p className="text-slate-400 mb-3">No active program</p>
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Link href={`/pretests/new?athlete=${id}`}>
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Start Pre-Test
                    </Link>
                  </Button>
                  <p className="text-xs text-slate-500">or use Assign Program button above</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pre-Test History */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-violet-400" />
              Pre-Tests
            </CardTitle>
            <CardDescription className="text-slate-400">
              {athlete.pretest_sessions?.length || 0} pre-tests completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {athlete.pretest_sessions && athlete.pretest_sessions.length > 0 ? (
              <div className="space-y-3">
                {athlete.pretest_sessions.slice(0, 3).map((session) => (
                  <Link
                    key={session.id}
                    href={`/pretests/${session.id}`}
                    className="block p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">
                          {session.pretest_types?.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(session.session_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={
                          session.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400">No pre-tests yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Program History */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Program History</CardTitle>
          <CardDescription className="text-slate-400">
            All training programs for this athlete
          </CardDescription>
        </CardHeader>
        <CardContent>
          {athlete.athlete_programs && athlete.athlete_programs.length > 0 ? (
            <div className="space-y-3">
              {athlete.athlete_programs.map((program) => (
                <div
                  key={program.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50"
                >
                  <div>
                    <p className="text-white font-medium">{program.programs?.name}</p>
                    <p className="text-sm text-slate-500">
                      Started {new Date(program.start_date).toLocaleDateString()} • 
                      Workout {program.current_workout_number} of {program.programs?.total_workouts}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={
                      program.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : program.status === 'completed'
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }
                  >
                    {program.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No programs assigned yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
