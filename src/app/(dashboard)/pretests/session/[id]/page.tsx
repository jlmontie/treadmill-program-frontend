import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Activity, Gauge, ChevronRight, AlertTriangle, CheckCircle2, SkipForward } from 'lucide-react'
import { PretestStepCard } from './pretest-step-card'
import { MetabolicResultsForm } from './metabolic-results-form'
import { RealtimePretest } from './realtime-pretest'
import { PretestOutcomeCard } from './pretest-outcome-card'
import { 
  calculateFlowState, 
  type CompletionLevel,
  type FlowState 
} from '@/lib/pretest-flow'

export const dynamic = 'force-dynamic'

interface PretestStep {
  id: number
  step_number: number
  num_runs: number
  incline: number | null
  speed: number | null
  time_pattern: string | null
  gate_instruction: string | null
}

interface StepResult {
  pretest_step_id: number
  completion_level: string
  notes: string | null
  completed_at: string | null
}

interface PretestType {
  id: number
  code: string
  name: string
  pretest_steps: PretestStep[]
}

interface PretestSession {
  id: string
  status: string
  session_date: string
  athletes: { id: string; name: string; gender: string } | null
  pretest_types: PretestType | null
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
        code,
        name,
        pretest_steps (
          id,
          step_number,
          num_runs,
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

  // Create a map of step results by step ID
  const resultsByStepId = new Map(results.map((r) => [r.pretest_step_id, r]))
  
  // Create a map for the flow engine (by step number)
  const resultsForFlow = new Map<number, { stepNumber: number; completionLevel: CompletionLevel }>()
  for (const step of steps) {
    const result = resultsByStepId.get(step.id)
    if (result) {
      resultsForFlow.set(step.id, {
        stepNumber: step.step_number,
        completionLevel: result.completion_level as CompletionLevel
      })
    }
  }

  // Calculate flow state using the engine
  const flowState = calculateFlowState(
    steps.map(s => ({ id: s.id, step_number: s.step_number })),
    resultsForFlow
  )

  // Find the current step object
  const currentStep = flowState.currentStep 
    ? steps.find(s => s.step_number === flowState.currentStep) 
    : null

  // Check if we need to show steps 10 & 11 together
  const showBothSteps10And11 = flowState.nextSteps.includes(10) && flowState.nextSteps.includes(11)

  return (
    <RealtimePretest sessionId={id}>
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
                  Completed: {flowState.completedSteps.length} steps
                </span>
              </div>
              {currentStep && (
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-violet-400" />
                  <span className="text-slate-300">
                    Current: Step {currentStep.step_number}
                    {showBothSteps10And11 && ' & 11'}
                  </span>
                </div>
              )}
              {flowState.skippedSteps.length > 0 && (
                <div className="flex items-center gap-2">
                  <SkipForward className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-500 text-sm">
                    {flowState.skippedSteps.length} skipped
                  </span>
                </div>
              )}
            </div>
            {flowState.isComplete && (
              <Badge 
                variant="outline" 
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Pre-test Complete
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pre-test Complete - Show Outcome */}
      {flowState.isComplete ? (
        <PretestOutcomeCard 
          sessionId={id}
          athleteId={athlete?.id || ''}
          athleteName={athlete?.name || 'Athlete'}
          outcome={flowState.outcome}
          pretestTypeCode={pretestType?.code || 'standard'}
          showDevLegOption={flowState.showDevLegOption}
        />
      ) : (
        <>
          {/* Current Step Highlight */}
          {currentStep && (
            <Card className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 border-violet-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-violet-400" />
                  {showBothSteps10And11 
                    ? 'Step 10' 
                    : `Step ${currentStep.step_number}`}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Record the athlete&apos;s performance for this step
                  {currentStep.gate_instruction && (
                    <span className="ml-2 text-amber-400">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Gate step - failure changes test path
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6 mb-6">
                  {currentStep.num_runs > 0 && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{currentStep.num_runs}</div>
                      <div className="text-sm text-slate-400">Runs</div>
                    </div>
                  )}
                  {currentStep.incline !== null && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{currentStep.incline}%</div>
                      <div className="text-sm text-slate-400">Incline</div>
                    </div>
                  )}
                  {currentStep.speed !== null && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cyan-400">{currentStep.speed}</div>
                      <div className="text-sm text-slate-400">Speed (mph)</div>
                    </div>
                  )}
                  {currentStep.time_pattern && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-violet-400">{currentStep.time_pattern}</div>
                      <div className="text-sm text-slate-400">Time Pattern</div>
                    </div>
                  )}
                </div>
                
                <PretestStepCard
                  sessionId={id}
                  step={currentStep}
                  isCurrentStep
                  isGateStep={!!currentStep.gate_instruction}
                />

                {/* If showing both 10 & 11, show step 11 info below */}
                {showBothSteps10And11 && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    {(() => {
                      const step11 = steps.find(s => s.step_number === 11)
                      if (!step11) return null
                      return (
                        <>
                          <h4 className="text-white font-semibold mb-4">Step 11</h4>
                          <div className="grid grid-cols-4 gap-6 mb-6">
                            {step11.num_runs > 0 && (
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{step11.num_runs}</div>
                                <div className="text-sm text-slate-400">Runs</div>
                              </div>
                            )}
                            {step11.incline !== null && (
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{step11.incline}%</div>
                                <div className="text-sm text-slate-400">Incline</div>
                              </div>
                            )}
                            {step11.speed !== null && (
                              <div className="text-center">
                                <div className="text-2xl font-bold text-cyan-400">{step11.speed}</div>
                                <div className="text-sm text-slate-400">Speed (mph)</div>
                              </div>
                            )}
                            {step11.time_pattern && (
                              <div className="text-center">
                                <div className="text-2xl font-bold text-violet-400">{step11.time_pattern}</div>
                                <div className="text-sm text-slate-400">Time Pattern</div>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-4">
                            Record result for both steps together (they do not fail independently)
                          </p>
                        </>
                      )
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* All Steps List */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-400" />
                Test Progress
              </CardTitle>
              <CardDescription className="text-slate-400">
                Steps are completed based on performance - not all steps may be needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step) => {
                  const result = resultsByStepId.get(step.id)
                  const isCurrent = flowState.currentStep === step.step_number
                  const isCompleted = flowState.completedSteps.includes(step.step_number)
                  const isSkipped = flowState.skippedSteps.includes(step.step_number)
                  const isPending = !isCompleted && !isCurrent && !isSkipped

                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-lg border ${
                        isCurrent
                          ? 'border-violet-500/50 bg-violet-500/10'
                          : isCompleted
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : isSkipped
                          ? 'border-slate-700/50 bg-slate-800/20 opacity-50'
                          : 'border-slate-700 bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isCurrent
                              ? 'bg-violet-500/20 text-violet-400'
                              : isSkipped
                              ? 'bg-slate-700/50 text-slate-500 line-through'
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {step.step_number}
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            {step.incline !== null && (
                              <span className={isSkipped ? 'text-slate-600' : isPending ? 'text-slate-500' : 'text-white'}>
                                {step.incline}% incline
                              </span>
                            )}
                            {step.speed !== null && (
                              <span className={isSkipped ? 'text-slate-600' : isPending ? 'text-slate-500' : 'text-cyan-400'}>
                                {step.speed} mph
                              </span>
                            )}
                            {step.time_pattern && (
                              <span className={isSkipped ? 'text-slate-600' : isPending ? 'text-slate-500' : 'text-slate-300'}>
                                {step.time_pattern}
                              </span>
                            )}
                            {step.gate_instruction && (
                              <span className={isSkipped ? 'text-slate-600' : 'text-amber-400'}>
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                Gate
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
                        {isSkipped && (
                          <Badge variant="outline" className="bg-slate-800/50 text-slate-500 border-slate-700">
                            <SkipForward className="h-3 w-3 mr-1" />
                            Skipped
                          </Badge>
                        )}
                        {isPending && (
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
    </RealtimePretest>
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
