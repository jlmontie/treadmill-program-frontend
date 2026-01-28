import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Users, Dumbbell, ClipboardCheck, TrendingUp, Plus, Play } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface RecentAthlete {
  id: string
  name: string
  sport: string | null
  gender: 'male' | 'female'
}

interface RecentWorkout {
  id: string
  status: string
  started_at: string | null
  athlete_programs: {
    athletes: { name: string }
  }
  program_workouts: {
    workout_number: number
    programs: { name: string }
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch stats
  const [
    { count: athleteCount },
    { count: activeWorkoutCount },
    athletesResult,
    workoutsResult,
  ] = await Promise.all([
    supabase.from('athletes').select('*', { count: 'exact', head: true }),
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('athletes').select('id, name, sport, gender').order('created_at', { ascending: false }).limit(5),
    supabase
      .from('workout_sessions')
      .select(`
        id,
        status,
        started_at,
        athlete_programs!inner (
          athletes!inner (name)
        ),
        program_workouts!inner (
          workout_number,
          programs!inner (name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const recentAthletes = (athletesResult.data || []) as unknown as RecentAthlete[]
  const recentWorkouts = (workoutsResult.data || []) as unknown as RecentWorkout[]

  const stats = [
    {
      name: 'Total Athletes',
      value: athleteCount || 0,
      icon: Users,
      color: 'from-cyan-500 to-blue-600',
      shadowColor: 'shadow-cyan-500/20',
    },
    {
      name: 'Active Workouts',
      value: activeWorkoutCount || 0,
      icon: Dumbbell,
      color: 'from-emerald-500 to-green-600',
      shadowColor: 'shadow-emerald-500/20',
    },
    {
      name: 'Programs Available',
      value: 36,
      icon: ClipboardCheck,
      color: 'from-violet-500 to-purple-600',
      shadowColor: 'shadow-violet-500/20',
    },
    {
      name: 'Completion Rate',
      value: '94%',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      shadowColor: 'shadow-amber-500/20',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back! Here&apos;s an overview of your training program.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
            <Link href="/pretests/new">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              New Pre-Test
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25">
            <Link href="/workouts/new">
              <Play className="mr-2 h-4 w-4" />
              Start Workout
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {stat.name}
              </CardTitle>
              <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadowColor}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Athletes */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Athletes</CardTitle>
              <CardDescription className="text-slate-400">
                Newly added athletes in your program
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800">
              <Link href="/athletes">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentAthletes && recentAthletes.length > 0 ? (
              <div className="space-y-3">
                {recentAthletes.map((athlete) => (
                  <Link
                    key={athlete.id}
                    href={`/athletes/${athlete.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-medium border border-slate-600">
                        {athlete.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {athlete.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {athlete.sport || 'No sport specified'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={athlete.gender === 'male' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                      }
                    >
                      {athlete.gender}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-slate-600" />
                <p className="mt-2 text-slate-400">No athletes yet</p>
                <Button asChild variant="link" className="mt-2 text-cyan-400 hover:text-cyan-300">
                  <Link href="/athletes/new">
                    <Plus className="mr-1 h-4 w-4" />
                    Add your first athlete
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Workouts</CardTitle>
              <CardDescription className="text-slate-400">
                Latest workout sessions
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800">
              <Link href="/workouts">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentWorkouts.length > 0 ? (
              <div className="space-y-3">
                {recentWorkouts.map((workout) => (
                  <Link
                    key={workout.id}
                    href={`/workouts/session/${workout.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                  >
                    <div>
                      <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                        {workout.athlete_programs?.athletes?.name || 'Unknown Athlete'}
                      </p>
                      <p className="text-sm text-slate-500">
                        Workout #{workout.program_workouts?.workout_number} • {workout.program_workouts?.programs?.name}
                      </p>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={
                        workout.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : workout.status === 'in_progress'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }
                    >
                      {workout.status.replace('_', ' ')}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Dumbbell className="mx-auto h-12 w-12 text-slate-600" />
                <p className="mt-2 text-slate-400">No workouts yet</p>
                <Button asChild variant="link" className="mt-2 text-cyan-400 hover:text-cyan-300">
                  <Link href="/workouts/new">
                    <Play className="mr-1 h-4 w-4" />
                    Start a workout
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-slate-400">
            Common tasks for your training session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto py-4 border-slate-700 hover:bg-slate-800 hover:border-slate-600 justify-start">
              <Link href="/athletes/new" className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-white">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Add Athlete</span>
                </div>
                <span className="text-xs text-slate-500">Register a new athlete</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 border-slate-700 hover:bg-slate-800 hover:border-slate-600 justify-start">
              <Link href="/pretests/new" className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-white">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="font-medium">New Pre-Test</span>
                </div>
                <span className="text-xs text-slate-500">Evaluate athlete capacity</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 border-slate-700 hover:bg-slate-800 hover:border-slate-600 justify-start">
              <Link href="/workouts/new" className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-white">
                  <Play className="h-4 w-4" />
                  <span className="font-medium">Start Workout</span>
                </div>
                <span className="text-xs text-slate-500">Begin a training session</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 border-slate-700 hover:bg-slate-800 hover:border-slate-600 justify-start">
              <Link href="/programs" className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-white">
                  <Dumbbell className="h-4 w-4" />
                  <span className="font-medium">Browse Programs</span>
                </div>
                <span className="text-xs text-slate-500">View all training programs</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
