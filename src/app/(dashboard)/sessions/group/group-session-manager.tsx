'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog'
import { 
  Plus, 
  Wifi, 
  WifiOff, 
  Play,
  Dumbbell,
  Check,
  AlertCircle,
  Search,
  Loader2
} from 'lucide-react'
import { AthleteWorkoutCard } from './athlete-workout-card'
import { startWorkoutForGroup } from './actions'

interface ActiveWorkout {
  id: string
  status: string
  started_at: string | null
  athlete_program_id: string
  program_workout_id: number
  athlete_name: string
  athlete_id: string
  workout_number: number
  program_name: string
  current_exercise: number
  total_exercises: number
  completed_exercises: number
}

interface AvailableAthlete {
  id: string
  name: string
  gender: string
  current_workout_number: number | null
  program_name: string | null
  program_id: number | null
  athlete_program_id: string | null
}

interface GroupSessionManagerProps {
  activeWorkouts: ActiveWorkout[]
  availableAthletes: AvailableAthlete[]
}

export function GroupSessionManager({ activeWorkouts: initialWorkouts, availableAthletes }: GroupSessionManagerProps) {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<ActiveWorkout[]>(initialWorkouts)
  const [isConnected, setIsConnected] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isStartingWorkouts, setIsStartingWorkouts] = useState(false)
  const supabase = createClient()

  // Filter out athletes who already have active workouts
  const activeAthleteIds = workouts.map(w => w.athlete_id)
  const athletesAvailableToAdd = availableAthletes.filter(
    a => !activeAthleteIds.includes(a.id) && a.athlete_program_id
  )

  // Filter by search query
  const filteredAthletes = useMemo(() => {
    if (!searchQuery.trim()) return athletesAvailableToAdd
    const query = searchQuery.toLowerCase()
    return athletesAvailableToAdd.filter(a => 
      a.name.toLowerCase().includes(query) ||
      a.program_name?.toLowerCase().includes(query)
    )
  }, [athletesAvailableToAdd, searchQuery])

  // Calculate remaining slots
  const remainingSlots = 5 - workouts.length
  const canSelectMore = selectedAthletes.size < remainingSlots

  // Reset selection when dialog closes
  useEffect(() => {
    if (!addDialogOpen) {
      setSelectedAthletes(new Set())
      setSearchQuery('')
    }
  }, [addDialogOpen])

  // Memoize refreshWorkouts to avoid recreating on every render
  const refreshWorkouts = useCallback(async () => {
    const { data } = await supabase
      .from('workout_sessions')
      .select(`
        id,
        status,
        started_at,
        athlete_program_id,
        program_workout_id,
        athlete_programs (
          id,
          athletes (id, name),
          current_workout_number
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
      .limit(5)

    if (data) {
      const formatted = data.map((s: {
        id: string
        status: string
        started_at: string | null
        athlete_program_id: string
        program_workout_id: number
        athlete_programs: { athletes: { id: string; name: string } | null } | null
        program_workouts: { workout_number: number; programs: { name: string } | null; workout_exercises: { id: number }[] | null } | null
        exercise_results: { id: string }[] | null
      }) => ({
        id: s.id,
        status: s.status,
        started_at: s.started_at,
        athlete_program_id: s.athlete_program_id,
        program_workout_id: s.program_workout_id,
        athlete_name: s.athlete_programs?.athletes?.name || 'Unknown',
        athlete_id: s.athlete_programs?.athletes?.id || '',
        workout_number: s.program_workouts?.workout_number || 0,
        program_name: s.program_workouts?.programs?.name || 'Unknown',
        current_exercise: (s.exercise_results?.length || 0) + 1,
        total_exercises: s.program_workouts?.workout_exercises?.length || 0,
        completed_exercises: s.exercise_results?.length || 0,
      }))
      setWorkouts(formatted)
    }
  }, [supabase])

  useEffect(() => {
    // Subscribe to workout session changes
    const channel = supabase
      .channel('group-session')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_sessions',
        },
        () => {
          refreshWorkouts()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_results',
        },
        () => {
          refreshWorkouts()
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, refreshWorkouts])

  const toggleAthleteSelection = (athleteId: string) => {
    setSelectedAthletes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(athleteId)) {
        newSet.delete(athleteId)
      } else if (newSet.size < remainingSlots) {
        newSet.add(athleteId)
      }
      return newSet
    })
  }

  const handleStartSelectedWorkouts = async () => {
    if (selectedAthletes.size === 0) return
    
    setIsStartingWorkouts(true)
    
    try {
      // Start workouts for all selected athletes
      const selectedList = Array.from(selectedAthletes)
      const errors: string[] = []
      
      for (const athleteId of selectedList) {
        const athlete = athletesAvailableToAdd.find(a => a.id === athleteId)
        if (athlete?.athlete_program_id) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Starting workout for:', athlete.name, 'program ID:', athlete.athlete_program_id)
          }
          const result = await startWorkoutForGroup(athlete.athlete_program_id)
          if (process.env.NODE_ENV === 'development') {
            console.log('Result:', result)
          }
          if (!result.success) {
            errors.push(`${athlete.name}: ${result.error}`)
          }
        } else if (process.env.NODE_ENV === 'development') {
          console.log('No athlete_program_id for:', athlete?.name)
        }
      }
      
      if (errors.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Errors starting workouts:', errors)
        }
        alert(`Some workouts failed to start:\n${errors.join('\n')}`)
      }
      
      // Refresh data multiple ways to ensure UI updates
      await refreshWorkouts()
      router.refresh()
      setAddDialogOpen(false)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to start workouts:', error)
      }
      alert('Failed to start workouts. Please try again.')
    } finally {
      setIsStartingWorkouts(false)
    }
  }

  const canAddMore = workouts.length < 5 && athletesAvailableToAdd.length > 0

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge 
            variant="outline" 
            className={`${
              workouts.length >= 5 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {workouts.length} / 5 Athletes
          </Badge>
          {isConnected ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <Wifi className="h-3 w-3 mr-1" />
              Live Updates
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
              <WifiOff className="h-3 w-3 mr-1" />
              Connecting...
            </Badge>
          )}
        </div>

        {/* Add Athlete Button */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={!canAddMore}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Athletes
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center justify-between">
                <span>Add Athletes to Group Session</span>
                <Badge 
                  variant="outline" 
                  className={`${
                    selectedAthletes.size >= remainingSlots 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {selectedAthletes.size} / {remainingSlots} selected
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Select athletes to start their workouts. You can add up to {remainingSlots} more athlete{remainingSlots !== 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Athlete List */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto py-2">
              {athletesAvailableToAdd.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                  <p>No athletes with active programs available</p>
                  <p className="text-sm mt-1">Assign programs to athletes first</p>
                </div>
              ) : filteredAthletes.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Search className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                  <p>No athletes match &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                filteredAthletes.map((athlete) => {
                  const isSelected = selectedAthletes.has(athlete.id)
                  const isDisabled = !isSelected && !canSelectMore
                  
                  return (
                    <button
                      key={athlete.id}
                      onClick={() => toggleAthleteSelection(athlete.id)}
                      disabled={isDisabled}
                      className={`w-full p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500/50 ring-2 ring-cyan-500/30'
                          : isDisabled
                          ? 'bg-slate-800/30 border-slate-800 opacity-50 cursor-not-allowed'
                          : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/30 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold ${
                            athlete.gender === 'male' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                          }`}>
                            {athlete.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-semibold transition-colors ${
                              isSelected ? 'text-cyan-400' : 'text-white'
                            }`}>
                              {athlete.name}
                            </p>
                            <p className="text-sm text-slate-400">
                              {athlete.program_name} • Workout #{athlete.current_workout_number}
                            </p>
                          </div>
                        </div>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {isSelected ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer with Start Button */}
            <DialogFooter className="flex-col sm:flex-row gap-2 border-t border-slate-800 pt-4">
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartSelectedWorkouts}
                disabled={selectedAthletes.size === 0 || isStartingWorkouts}
                aria-busy={isStartingWorkouts}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25 flex-1 sm:flex-initial"
              >
                {isStartingWorkouts && <span className="sr-only">Starting workouts, please wait</span>}
                {isStartingWorkouts ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting {selectedAthletes.size} workout{selectedAthletes.size !== 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start {selectedAthletes.size} Workout{selectedAthletes.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      {workouts.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-800 border-dashed">
          <CardContent className="py-16 text-center">
            <Dumbbell className="h-16 w-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Active Workouts</h3>
            <p className="text-slate-400 mb-6">
              Add athletes to start managing their workouts in this group session.
            </p>
            <Button 
              onClick={() => setAddDialogOpen(true)}
              disabled={!canAddMore}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Athlete
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Athlete Workout Cards */}
      <div className="space-y-4">
        {workouts.map((workout, index) => (
          <AthleteWorkoutCard 
            key={workout.id} 
            workout={workout}
            colorIndex={index}
            onRefresh={refreshWorkouts}
          />
        ))}
      </div>

      {/* Quick Add More */}
      {workouts.length > 0 && workouts.length < 5 && athletesAvailableToAdd.length > 0 && (
        <button
          onClick={() => setAddDialogOpen(true)}
          className="w-full p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add another athlete ({5 - workouts.length} slots remaining)
        </button>
      )}
    </div>
  )
}
