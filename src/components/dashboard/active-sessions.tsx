'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Activity, 
  Clock, 
  Dumbbell, 
  Play, 
  ChevronRight,
  Wifi,
  WifiOff
} from 'lucide-react'

interface ActiveSession {
  id: string
  status: string
  started_at: string | null
  athlete_program_id: string
  program_workout_id: number
  athlete_name: string
  workout_number: number
  program_name: string
  total_exercises: number
  completed_exercises: number
}

interface ActiveSessionsProps {
  initialSessions: ActiveSession[]
}

export function ActiveSessions({ initialSessions }: ActiveSessionsProps) {
  const [sessions, setSessions] = useState<ActiveSession[]>(initialSessions)
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  const refreshSessions = useCallback(async () => {
    const { data } = await supabase
      .from('workout_sessions')
      .select(`
        id,
        status,
        started_at,
        athlete_program_id,
        program_workout_id,
        athlete_programs (
          athletes (name)
        ),
        program_workouts (
          workout_number,
          programs (name),
          workout_exercises (id)
        ),
        exercise_results (id)
      `)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(6)

    if (data) {
      // Type the session data properly
      type SessionData = {
        id: string
        status: string
        started_at: string | null
        athlete_program_id: string
        program_workout_id: number
        athlete_programs: { athletes: { name: string } | null } | null
        program_workouts: {
          workout_number: number
          programs: { name: string } | null
          workout_exercises: { id: number }[] | null
        } | null
        exercise_results: { id: string }[] | null
      }
      
      const formatted = (data as SessionData[]).map((s) => ({
        id: s.id,
        status: s.status,
        started_at: s.started_at,
        athlete_program_id: s.athlete_program_id,
        program_workout_id: s.program_workout_id,
        athlete_name: s.athlete_programs?.athletes?.name || 'Unknown',
        workout_number: s.program_workouts?.workout_number || 0,
        program_name: s.program_workouts?.programs?.name || 'Unknown',
        total_exercises: s.program_workouts?.workout_exercises?.length || 0,
        completed_exercises: s.exercise_results?.length || 0,
      }))
      setSessions(formatted)
    }
  }, [supabase])

  useEffect(() => {
    // Set up real-time subscription for workout sessions
    const channel = supabase
      .channel('active-workouts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_sessions',
          filter: 'status=eq.in_progress',
        },
        async () => {
          // Refresh sessions on any change
          await refreshSessions()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_results',
        },
        async () => {
          // Refresh to update exercise counts
          await refreshSessions()
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, refreshSessions])

  const getElapsedTime = useCallback((startedAt: string | null) => {
    if (!startedAt) return '0 min'
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000)
    if (elapsed < 60) return `${elapsed} min`
    const hours = Math.floor(elapsed / 60)
    const mins = elapsed % 60
    return `${hours}h ${mins}m`
  }, [])

  const getProgressPercent = useCallback((completed: number, total: number) => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }, [])

  if (sessions.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                Active Sessions
              </CardTitle>
              <CardDescription className="text-slate-400">
                Monitor athletes currently in workout
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Connecting...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Dumbbell className="mx-auto h-16 w-16 text-slate-600" />
            <p className="mt-4 text-lg text-slate-400">No active workout sessions</p>
            <p className="text-sm text-slate-500 mt-1">
              Start a workout to see it here in real-time
            </p>
            <Button asChild className="mt-6 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500">
              <Link href="/workouts/new">
                <Play className="mr-2 h-4 w-4" />
                Start Workout
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400 animate-pulse" aria-hidden="true" />
              Active Sessions
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {sessions.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Real-time workout monitoring
            </CardDescription>
            {/* Screen reader announcement for real-time updates */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {sessions.length} active workout {sessions.length === 1 ? 'session' : 'sessions'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                <WifiOff className="h-3 w-3 mr-1" />
                Reconnecting...
              </Badge>
            )}
            <Button asChild variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <Link href="/workouts/new">
                <Play className="mr-1 h-3 w-3" />
                New
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session, index) => {
            const progress = getProgressPercent(session.completed_exercises, session.total_exercises)
            const colors = [
              { bg: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', accent: 'text-cyan-400' },
              { bg: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', accent: 'text-emerald-400' },
              { bg: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30', accent: 'text-violet-400' },
              { bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', accent: 'text-amber-400' },
              { bg: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30', accent: 'text-rose-400' },
              { bg: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/30', accent: 'text-indigo-400' },
            ][index % 6]

            return (
              <Link
                key={session.id}
                href={`/workouts/session/${session.id}`}
                className={`block p-4 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} hover:scale-[1.02] transition-all duration-200 group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center ${colors.accent} font-bold border border-slate-700`}>
                      {session.athlete_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {session.athlete_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Workout {session.workout_number}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>

                <div className="space-y-3">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Progress</span>
                      <span className={colors.accent}>
                        {session.completed_exercises}/{session.total_exercises} exercises
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${colors.bg.replace('/20', '')} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3 w-3" />
                      {getElapsedTime(session.started_at)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className="bg-slate-800/50 text-slate-300 border-slate-700 text-xs"
                    >
                      {progress}% complete
                    </Badge>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {sessions.length >= 6 && (
          <div className="mt-4 text-center">
            <Button asChild variant="ghost" className="text-slate-400 hover:text-white">
              <Link href="/workouts">
                View all workouts
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
