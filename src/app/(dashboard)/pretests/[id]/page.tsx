import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  ClipboardCheck, 
  Heart, 
  Activity, 
  Timer,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  SkipForward,
  Trophy
} from 'lucide-react'
import { EditMetabolicForm } from './edit-metabolic-form'
import { 
  calculateFlowState, 
  getOutcomeDescription, 
  getOutcomeColor,
  getMetabolicSuffix,
  getMetabolicCategoryName,
  buildProgramRecommendations,
  type CompletionLevel,
  type PretestTypeCode
} from '@/lib/pretest-flow'

export const dynamic = 'force-dynamic'

interface PretestStep {
  id: number
  step_number: number
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
  pretest_steps: PretestStep
}

interface MetabolicResult {
  at_hr: number | null
  max_hr: number | null
  at_max_percent: number | null
  recovery_hr_2min: number | null
  recovery_at_percent: number | null
  metabolic_category: string | null
  notes: string | null
}

interface PretestSession {
  id: string
  status: string
  session_date: string
  athletes: { id: string; name: string; gender: string; sport: string | null } | null
  trainers: { name: string } | null
  pretest_types: { 
    id: number
    code: string
    name: string 
    pretest_steps: PretestStep[] 
  } | null
  pretest_step_results: StepResult[]
  metabolic_results: MetabolicResult[]
}

export default async function PretestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch session with related data (except metabolic which we fetch separately)
  const { data: session, error } = await supabase
    .from('pretest_sessions')
    .select(`
      id,
      status,
      session_date,
      athletes (id, name, gender, sport),
      trainers (name),
      pretest_types (
        id,
        code,
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
      pretest_step_results (
        pretest_step_id,
        completion_level,
        notes,
        completed_at,
        pretest_steps (
          id,
          step_number,
          incline,
          speed,
          time_pattern,
          gate_instruction
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !session) {
    notFound()
  }

  // Fetch metabolic results separately (more reliable)
  const { data: metabolicData } = await supabase
    .from('metabolic_results')
    .select('*')
    .eq('pretest_session_id', id)
    .single()

  const typedSession = session as unknown as Omit<PretestSession, 'metabolic_results'>

  const athlete = typedSession.athletes
  const pretestType = typedSession.pretest_types
  const steps = pretestType?.pretest_steps?.sort((a, b) => a.step_number - b.step_number) || []
  const results = typedSession.pretest_step_results || []
  const metabolic = metabolicData as MetabolicResult | null

  // Create a map of step results
  const resultsByStep = new Map(results.map((r) => [r.pretest_step_id, r]))

  // Create results map for flow engine
  const resultsForFlow = new Map<number, { stepNumber: number; completionLevel: CompletionLevel }>()
  for (const step of steps) {
    const result = resultsByStep.get(step.id)
    if (result) {
      resultsForFlow.set(step.id, {
        stepNumber: step.step_number,
        completionLevel: result.completion_level as CompletionLevel
      })
    }
  }

  // Calculate flow state to determine outcome
  const flowState = calculateFlowState(
    steps.map(s => ({ id: s.id, step_number: s.step_number })),
    resultsForFlow
  )

  // Calculate summary stats
  const completedSteps = results.filter(r => r.completion_level === 'complete').length
  const slightTouchSteps = results.filter(r => r.completion_level === 'slight_touch').length

  // Determine the highest step achieved (last step that wasn't a failure)
  const sortedResults = [...results].sort((a, b) => {
    const stepA = steps.find(s => s.id === a.pretest_step_id)?.step_number || 0
    const stepB = steps.find(s => s.id === b.pretest_step_id)?.step_number || 0
    return stepB - stepA
  })
  const lastSuccessfulResult = sortedResults.find(r => r.completion_level !== 'failure')
  const highestStep = lastSuccessfulResult 
    ? steps.find(s => s.id === lastSuccessfulResult.pretest_step_id)
    : null

  // Get program recommendations based on outcome
  const pretestTypeCode = (pretestType?.code || 'standard') as PretestTypeCode
  const metabolicSuffix = getMetabolicSuffix(metabolic?.at_max_percent ?? null)
  const metabolicCategoryName = getMetabolicCategoryName(metabolicSuffix)
  const recommendations = flowState.outcome 
    ? buildProgramRecommendations(flowState.outcome, pretestTypeCode, metabolic?.at_max_percent ?? null, flowState.showDevLegOption)
    : []

  const statusColor = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
  }[typedSession.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'

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
                {pretestType?.name || 'Pre-Test'} Results
              </h1>
              <Badge variant="outline" className={statusColor}>
                {typedSession.status === 'completed' ? 'Completed' : 
                 typedSession.status === 'in_progress' ? 'In Progress' : 
                 'Cancelled'}
              </Badge>
            </div>
            <p className="text-slate-400 mt-1">
              {athlete?.name || 'Unknown Athlete'} • {new Date(typedSession.session_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        {typedSession.status === 'in_progress' && (
          <Button asChild className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
            <Link href={`/pretests/session/${id}`}>
              Continue Pre-Test
            </Link>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <User className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Athlete</p>
                <p className="text-lg font-semibold text-white">{athlete?.name}</p>
                {athlete?.sport && (
                  <p className="text-xs text-slate-500">{athlete.sport}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-violet-500/10">
                <ClipboardCheck className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Steps Completed</p>
                <p className="text-lg font-semibold text-white">{results.length} / {steps.length}</p>
                <p className="text-xs text-slate-500">
                  {completedSteps} clean, {slightTouchSteps} slight touch
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Highest Step</p>
                <p className="text-lg font-semibold text-white">
                  {highestStep ? `Step ${highestStep.step_number}` : '—'}
                </p>
                {highestStep && (
                  <p className="text-xs text-slate-500">
                    {highestStep.incline}% @ {highestStep.speed} mph
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-rose-500/10">
                <Heart className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Max Heart Rate</p>
                <p className="text-lg font-semibold text-white">
                  {metabolic?.max_hr ? `${metabolic.max_hr} bpm` : '—'}
                </p>
                {metabolic?.at_max_percent && (
                  <p className="text-xs text-slate-500">
                    AT @ {metabolic.at_max_percent.toFixed(0)}% of max
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step Results */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-violet-400" />
              Step Results
            </CardTitle>
            <CardDescription className="text-slate-400">
              Performance on each pre-test step
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {steps.map((step) => {
                const result = resultsByStep.get(step.id)
                const isSkipped = flowState.skippedSteps.includes(step.step_number)
                
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border ${
                      result
                        ? getCompletionBorder(result.completion_level)
                        : isSkipped
                        ? 'border-slate-700/50 bg-slate-800/20 opacity-50'
                        : 'border-slate-700 bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          result
                            ? getCompletionBg(result.completion_level)
                            : isSkipped
                            ? 'bg-slate-700/50 text-slate-500 line-through'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {step.step_number}
                        </div>
                        <div className="text-sm">
                          {step.incline !== null && (
                            <>
                              <span className={isSkipped ? 'text-slate-600' : 'text-white'}>{step.incline}%</span>
                              <span className="text-slate-500 mx-1">@</span>
                            </>
                          )}
                          {step.speed !== null && (
                            <span className={isSkipped ? 'text-slate-600' : 'text-cyan-400'}>{step.speed} mph</span>
                          )}
                          {step.time_pattern && (
                            <>
                              <span className="text-slate-500 mx-1">•</span>
                              <span className={isSkipped ? 'text-slate-600' : 'text-slate-400'}>{step.time_pattern}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {result ? (
                        <Badge 
                          variant="outline"
                          className={getCompletionBadgeStyle(result.completion_level)}
                        >
                          {getCompletionLabel(result.completion_level)}
                        </Badge>
                      ) : isSkipped ? (
                        <Badge variant="outline" className="bg-slate-800/50 text-slate-500 border-slate-700">
                          <SkipForward className="h-3 w-3 mr-1" />
                          Skipped
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-800 text-slate-500 border-slate-700">
                          Not Attempted
                        </Badge>
                      )}
                    </div>
                    {result?.notes && (
                      <p className="mt-2 text-xs text-slate-400 ml-10">
                        Note: {result.notes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Metabolic Results */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-400" />
                  Metabolic Results
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Heart rate measurements and calculated metrics
                </CardDescription>
              </div>
              {typedSession.status === 'completed' && (
                <EditMetabolicForm 
                  sessionId={id} 
                  currentData={metabolic ? {
                    at_hr: metabolic.at_hr,
                    max_hr: metabolic.max_hr,
                    recovery_hr_2min: metabolic.recovery_hr_2min,
                    notes: metabolic.notes,
                  } : null}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {metabolic ? (
              <>
                {/* Heart Rate Data */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                    <Activity className="h-5 w-5 text-cyan-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {metabolic.at_hr ?? '—'}
                    </div>
                    <div className="text-xs text-slate-400">AT HR (bpm)</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
                    <Heart className="h-5 w-5 text-rose-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {metabolic.max_hr ?? '—'}
                    </div>
                    <div className="text-xs text-slate-400">Max HR (bpm)</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <Timer className="h-5 w-5 text-violet-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {metabolic.recovery_hr_2min ?? '—'}
                    </div>
                    <div className="text-xs text-slate-400">Recovery HR (2m)</div>
                  </div>
                </div>

                {/* Calculated Percentages */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400">AT/Max Percentage</span>
                    <span className="text-white font-medium">
                      {metabolic.at_max_percent 
                        ? `${metabolic.at_max_percent.toFixed(1)}%` 
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400">Recovery/AT Percentage</span>
                    <span className="text-white font-medium">
                      {metabolic.recovery_at_percent 
                        ? `${metabolic.recovery_at_percent.toFixed(1)}%` 
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Metabolic Category */}
                <div className={`p-4 rounded-lg border ${
                  metabolic.metabolic_category === 'la'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : metabolic.metabolic_category === 'low'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700'
                }`}>
                  <div className="flex items-center gap-3">
                    {metabolic.metabolic_category === 'la' ? (
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    )}
                    <div>
                      <div className="font-medium text-white">
                        {metabolic.metabolic_category === 'la'
                          ? 'High Lactate Recovery'
                          : metabolic.metabolic_category === 'low'
                          ? 'Excellent Recovery'
                          : 'Standard Recovery'}
                      </div>
                      <div className="text-sm text-slate-400">
                        {metabolic.metabolic_category === 'la'
                          ? 'May benefit from additional conditioning work'
                          : metabolic.metabolic_category === 'low'
                          ? 'Strong cardiovascular conditioning'
                          : 'Normal recovery rate for training'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {metabolic.notes && (
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <h4 className="text-sm font-medium text-white mb-1">Notes</h4>
                    <p className="text-sm text-slate-400">{metabolic.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Heart className="mx-auto h-12 w-12 text-slate-600" />
                <p className="mt-4 text-slate-400">No metabolic data recorded yet</p>
                {typedSession.status === 'in_progress' ? (
                  <Button asChild className="mt-4" variant="outline">
                    <Link href={`/pretests/session/${id}`}>
                      Continue Pre-Test
                    </Link>
                  </Button>
                ) : typedSession.status === 'completed' && (
                  <div className="mt-4">
                    <EditMetabolicForm 
                      sessionId={id} 
                      currentData={null}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Program Recommendation */}
      {typedSession.status === 'completed' && flowState.outcome && (
        <Card className="bg-gradient-to-br from-violet-900/20 to-purple-900/20 border-violet-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Pre-Test Outcome & Program Recommendation
            </CardTitle>
            <CardDescription className="text-slate-300">
              Based on pre-test step results and metabolic data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Outcome Badge */}
            <div className="flex items-center gap-4">
              <span className="text-slate-400">Outcome:</span>
              <Badge variant="outline" className={`text-base px-3 py-1 ${getOutcomeColor(flowState.outcome)}`}>
                {getOutcomeDescription(flowState.outcome)}
              </Badge>
            </div>

            {/* Metabolic Category */}
            <div className="flex items-center gap-4">
              <span className="text-slate-400">Metabolic Category:</span>
              <Badge variant="outline" className={`${
                metabolic?.metabolic_category === 'la' 
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : metabolic?.metabolic_category === 'low'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}>
                {metabolicCategoryName}
              </Badge>
            </div>

            {/* Recommended Programs */}
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Recommended Program(s):</span>
              </div>
              <div className="space-y-2 mb-4">
                {recommendations.map((rec, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                  >
                    <span className="text-white font-medium">{rec.name}</span>
                    <Badge 
                      variant="outline" 
                      className={`${
                        metabolic?.metabolic_category === 'la' 
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : metabolic?.metabolic_category === 'low'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {rec.metabolicCategory}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400">
                Pre-test type: <span className="text-white">{pretestType?.name}</span> • 
                Highest step: <span className="text-white">{highestStep?.step_number || '—'}</span>
                {highestStep?.speed && ` @ ${highestStep.speed} mph`}
              </p>
            </div>

            {/* Dev Leg Option Note */}
            {flowState.showDevLegOption && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                <span className="text-amber-400 font-medium">Note:</span>
                <span className="text-slate-300 ml-2">
                  Trainer may optionally assign a supplemental leg strength program if the athlete 
                  would benefit from additional leg strengthening.
                </span>
              </div>
            )}

            {/* Assign Button */}
            <div className="flex justify-end pt-2">
              <Button asChild className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
                <Link href={`/athletes/${athlete?.id}?assign=true`}>
                  <Award className="mr-2 h-4 w-4" />
                  Assign Program to {athlete?.name}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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

function getCompletionBorder(level: string): string {
  switch (level) {
    case 'complete':
      return 'border-emerald-500/30 bg-emerald-500/5'
    case 'slight_touch':
      return 'border-cyan-500/30 bg-cyan-500/5'
    case 'push':
      return 'border-amber-500/30 bg-amber-500/5'
    case 'failure':
      return 'border-red-500/30 bg-red-500/5'
    default:
      return 'border-slate-700 bg-slate-800/30'
  }
}

function getCompletionBg(level: string): string {
  switch (level) {
    case 'complete':
      return 'bg-emerald-500/20 text-emerald-400'
    case 'slight_touch':
      return 'bg-cyan-500/20 text-cyan-400'
    case 'push':
      return 'bg-amber-500/20 text-amber-400'
    case 'failure':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-slate-700 text-slate-400'
  }
}

