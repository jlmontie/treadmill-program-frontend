import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Activity, Gauge, Timer, ChevronRight } from 'lucide-react'
import { PretestStepCard } from './pretest-step-card'
import { MetabolicResultsForm } from './metabolic-results-form'

export const dynamic = 'force-dynamic'

interface PretestStep {
  id: number
  step_number: number
  incline: number
  speed: number
  time_pattern: string
  gate_instruction: string | null
}

interface StepResult {
  pretest_step_id: number
  completion_level: string
  notes: string | null
  completed_at: string | null
}

interface PretestSession {
  id: string
  status: string
  session_date: string
  athletes: { id: string; name: string; gender: string } | null
  pretest_types: { 
    id: number
    name: string 
    pretest_steps: PretestStep[] 
  } | null
  pretest_step_results: StepResult[]
}

export default async function PretestSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch session with athlete, type, steps, and existing results
  const { data: session, error } = await supabase
    .from('pretest_sessions')
    .select(`
      id,
      status,
      session_date,
      athletes!athlete_id (id, name, gender),
      pretest_types!pretest_type_id (
        id,
        name,
        pretest_steps (
          id,
          step_number,
          incline,
          speed,
          time_pattern,
          gate_instruction
        )
      ),
      pretest_step_results!pretest_session_id (
        pretest_step_id,
        completion_level,
        notes,
        completed_at
      )
    `)
    .eq('id', id)
    .single()

  if (error || !session) {
    notFound()
  }

  const typedSession = session as unknown as PretestSession

  // If completed, redirect to results page
  if (typedSession.status === 'completed') {
    redirect(`/pretests/${id}`)
  }

  const athlete = typedSession.athletes
  const pretestType = typedSession.pretest_types
  const steps = pretestType?.pretest_steps?.sort((a, b) => a.step_number - b.step_number) || []
  const results = typedSession.pretest_step_results || []

  // Create a map of step results
  const resultsByStep = new Map(results.map((r) => [r.pretest_step_id, r]))

  // Check if all steps are completed
  const allStepsCompleted = steps.every((step) => resultsByStep.has(step.id))

  // Get the current step (first uncompleted)
  const currentStepIndex = steps.findIndex((step) => !resultsByStep.has(step.id))
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Link href="/pretests">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {pretestType?.name || 'Pre-Test'}
              </h1>
              <Badge 
                variant="outline" 
                className="bg-amber-500/10 text-amber-400 border-amber-500/30"
              >
                In Progress
              </Badge>
            </div>
            <p className="text-slate-400 mt-1">
              {athlete?.name || 'Unknown Athlete'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <span className="text-slate-300">
                  Progress: {results.length} / {steps.length} steps
                </span>
              </div>
              {currentStep && (
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-violet-400" />
                  <span className="text-slate-300">
                    Current: Step {currentStep.step_number}
                  </span>
                </div>
              )}
            </div>
            <div className="h-2 w-48 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-300"
                style={{ width: `${(results.length / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Steps Completed - Show Metabolic Form */}
      {allStepsCompleted ? (
        <MetabolicResultsForm sessionId={id} athleteName={athlete?.name || 'Athlete'} />
      ) : (
        <>
          {/* Current Step Highlight */}
          {currentStep && (
            <Card className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 border-violet-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-violet-400" />
                  Current Step: {currentStep.step_number}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Record the athlete&apos;s performance for this step
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{currentStep.incline}%</div>
                    <div className="text-sm text-slate-400">Incline</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400">{currentStep.speed}</div>
                    <div className="text-sm text-slate-400">Speed (mph)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-violet-400">{currentStep.time_pattern}</div>
                    <div className="text-sm text-slate-400">Time Pattern</div>
                  </div>
                  {currentStep.gate_instruction && (
                    <div className="text-center">
                      <div className="text-xl font-bold text-amber-400">{currentStep.gate_instruction}</div>
                      <div className="text-sm text-slate-400">Gate</div>
                    </div>
                  )}
                </div>
                
                <PretestStepCard
                  sessionId={id}
                  step={currentStep}
                  isCurrentStep
                />
              </CardContent>
            </Card>
          )}

          {/* All Steps List */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Timer className="h-5 w-5 text-slate-400" />
                All Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const result = resultsByStep.get(step.id)
                  const isCurrent = currentStepIndex === index
                  const isPast = result !== undefined
                  const isFuture = !isPast && !isCurrent

                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-lg border ${
                        isCurrent
                          ? 'border-violet-500/50 bg-violet-500/10'
                          : isPast
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-slate-700 bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isPast
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isCurrent
                              ? 'bg-violet-500/20 text-violet-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {step.step_number}
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <span className={isFuture ? 'text-slate-500' : 'text-white'}>
                              {step.incline}% incline
                            </span>
                            <span className={isFuture ? 'text-slate-500' : 'text-cyan-400'}>
                              {step.speed} mph
                            </span>
                            <span className={isFuture ? 'text-slate-500' : 'text-slate-300'}>
                              {step.time_pattern}
                            </span>
                            {step.gate_instruction && (
                              <span className={isFuture ? 'text-slate-500' : 'text-amber-400'}>
                                Gate: {step.gate_instruction}
                              </span>
                            )}
                          </div>
                        </div>
                        {result && (
                          <Badge 
                            variant="outline"
                            className={getCompletionBadgeStyle(result.completion_level)}
                          >
                            {getCompletionLabel(result.completion_level)}
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge 
                            variant="outline" 
                            className="bg-violet-500/10 text-violet-400 border-violet-500/30"
                          >
                            Current
                          </Badge>
                        )}
                        {isFuture && (
                          <Badge variant="outline" className="bg-slate-800 text-slate-500 border-slate-700">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function getCompletionLabel(level: string): string {
  switch (level) {
    case 'complete':
      return 'Complete'
    case 'slight_touch':
      return 'Slight Touch'
    case 'push':
      return 'Push'
    case 'failure':
      return 'Failure'
    default:
      return level
  }
}

function getCompletionBadgeStyle(level: string): string {
  switch (level) {
    case 'complete':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'slight_touch':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    case 'push':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'failure':
      return 'bg-red-500/10 text-red-400 border-red-500/30'
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  }
}
