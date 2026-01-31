'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle2, 
  Trophy, 
  ArrowRight, 
  Loader2,
  Activity,
  Heart,
  Dumbbell
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  type PretestOutcome,
  type PretestTypeCode,
  getOutcomeDescription,
  getOutcomeColor,
  getMetabolicSuffix,
  getMetabolicCategoryName,
  buildProgramRecommendations
} from '@/lib/pretest-flow'
import { completePretest } from '../../actions'

interface PretestOutcomeCardProps {
  sessionId: string
  athleteId: string
  athleteName: string
  outcome: PretestOutcome
  pretestTypeCode: string
  showDevLegOption: boolean
}

export function PretestOutcomeCard({
  sessionId,
  athleteId,
  athleteName,
  outcome,
  pretestTypeCode,
  showDevLegOption,
}: PretestOutcomeCardProps) {
  const [isPending, startTransition] = useTransition()
  const [showMetabolicForm, setShowMetabolicForm] = useState(false)
  const [includeDevLeg, setIncludeDevLeg] = useState(false)
  const [skipMetabolic, setSkipMetabolic] = useState(false)
  
  // Metabolic form state
  const [atHr, setAtHr] = useState('')
  const [maxHr, setMaxHr] = useState('')
  const [recoveryHr, setRecoveryHr] = useState('')
  const [notes, setNotes] = useState('')

  // Calculate metabolic values
  const atHrNum = atHr ? parseInt(atHr) : null
  const maxHrNum = maxHr ? parseInt(maxHr) : null
  const atMaxPercent = atHrNum && maxHrNum ? (atHrNum / maxHrNum) * 100 : null

  // Get program recommendations
  const typeCode = pretestTypeCode as PretestTypeCode
  const metabolicSuffix = getMetabolicSuffix(atMaxPercent)
  const metabolicCategoryName = getMetabolicCategoryName(metabolicSuffix)
  const recommendations = buildProgramRecommendations(outcome, typeCode, atMaxPercent, includeDevLeg)

  const handleComplete = () => {
    const formData = new FormData()
    formData.set('session_id', sessionId)
    
    if (!skipMetabolic) {
      if (atHr) formData.set('at_hr', atHr)
      if (maxHr) formData.set('max_hr', maxHr)
      if (recoveryHr) formData.set('recovery_hr_2min', recoveryHr)
    }
    if (notes) formData.set('notes', notes)

    startTransition(async () => {
      try {
        await completePretest(formData)
        // If we reach here without redirect, show success
        toast.success('Pre-test completed', {
          description: `${athleteName}'s pre-test has been completed successfully.`,
        })
      } catch (error) {
        // Only show error if it's not a redirect (NEXT_REDIRECT)
        if (error instanceof Error && !error.message.includes('NEXT_REDIRECT')) {
          toast.error('Failed to complete pre-test', {
            description: error.message,
          })
        }
      }
    })
  }

  if (!outcome) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Outcome Card */}
      <Card className={`border-2 ${getOutcomeColor(outcome).replace('text-', 'border-').replace('/10', '/30').split(' ')[0]}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${getOutcomeColor(outcome).split(' ')[1]}`}>
              <Trophy className={`h-6 w-6 ${getOutcomeColor(outcome).split(' ')[0]}`} />
            </div>
            <div>
              <CardTitle className="text-white">Pre-Test Complete</CardTitle>
              <CardDescription className="text-slate-400">
                {athleteName} has completed the pre-test
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Outcome Badge */}
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Outcome:</span>
            <Badge variant="outline" className={`text-lg px-4 py-2 ${getOutcomeColor(outcome)}`}>
              {getOutcomeDescription(outcome)}
            </Badge>
          </div>

          {/* Program Type */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-slate-400">Recommended Program Type</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((rec, idx) => (
                <Badge key={idx} variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  {rec.name}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Metabolic category will be determined by test results below
            </p>
          </div>

          {/* Dev Leg Option */}
          {showDevLegOption && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <Dumbbell className="h-5 w-5 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-medium">
                      Supplemental Leg Strength Program
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeDevLeg}
                        onChange={(e) => setIncludeDevLeg(e.target.checked)}
                        className="w-4 h-4 rounded border-amber-500/50 bg-slate-800 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-300">Include</span>
                    </label>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Trainer may optionally assign a developmental leg strength program 
                    if the athlete would benefit from supplemental leg strengthening.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metabolic Results Section */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-red-400" />
              <div>
                <CardTitle className="text-white">Metabolic Test Results</CardTitle>
                <CardDescription className="text-slate-400">
                  Enter metabolic data to determine the conditioning level
                </CardDescription>
              </div>
            </div>
            {!showMetabolicForm && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSkipMetabolic(true)}
                  className="border-slate-700 text-slate-400 hover:bg-slate-800"
                >
                  Skip (use Standard)
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowMetabolicForm(true)}
                  className="bg-red-600 hover:bg-red-500"
                >
                  Enter Results
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        {(showMetabolicForm || skipMetabolic) && (
          <CardContent className="space-y-4">
            {skipMetabolic ? (
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-slate-400">
                  No metabolic data entered. Program will default to <span className="text-white">Standard</span> conditioning level.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => { setSkipMetabolic(false); setShowMetabolicForm(true) }}
                  className="text-cyan-400 p-0 h-auto mt-2"
                >
                  Enter metabolic data instead
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="at_hr" className="text-slate-300">AT Heart Rate</Label>
                    <Input
                      id="at_hr"
                      type="number"
                      value={atHr}
                      onChange={(e) => setAtHr(e.target.value)}
                      placeholder="e.g., 165"
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_hr" className="text-slate-300">Max Heart Rate</Label>
                    <Input
                      id="max_hr"
                      type="number"
                      value={maxHr}
                      onChange={(e) => setMaxHr(e.target.value)}
                      placeholder="e.g., 190"
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery_hr" className="text-slate-300">Recovery HR (2 min)</Label>
                    <Input
                      id="recovery_hr"
                      type="number"
                      value={recoveryHr}
                      onChange={(e) => setRecoveryHr(e.target.value)}
                      placeholder="e.g., 140"
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                {/* Calculated Values */}
                {atMaxPercent !== null && (
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400 text-sm">AT/Max %:</span>
                        <span className="ml-2 text-white font-mono">
                          {atMaxPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Metabolic Category:</span>
                        <Badge variant="outline" className={`ml-2 ${
                          metabolicSuffix === '_la' 
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : metabolicSuffix === '_low'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {metabolicSuffix === '_la' && 'High Lactic Acid'}
                          {metabolicSuffix === '_standard' && 'Standard'}
                          {metabolicSuffix === '_low' && 'Low Metabolic Need'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {metabolicSuffix === '_la' && 'AT/Max < 88%: High lactic acid, needs more conditioning'}
                      {metabolicSuffix === '_standard' && 'AT/Max 88-93%: Standard metabolic needs'}
                      {metabolicSuffix === '_low' && 'AT/Max ≥ 94%: Low metabolic need (may use standard if sport requires)'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-slate-300">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional observations..."
                    className="bg-slate-800/50 border-slate-700 text-white"
                    rows={2}
                  />
                </div>
              </>
            )}
          </CardContent>
        )}

        {(showMetabolicForm || skipMetabolic) && (
          <CardFooter className="border-t border-slate-800 pt-6">
            <div className="w-full space-y-4">
              {/* Final Program Recommendation */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">Recommended Program(s):</span>
                </div>
                <div className="space-y-2">
                  {recommendations.map((rec, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                    >
                      <span className="text-white font-medium">{rec.name}</span>
                      <Badge 
                        variant="outline" 
                        className={`${
                          metabolicSuffix === '_la' 
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : metabolicSuffix === '_low'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {metabolicCategoryName}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleComplete}
                disabled={isPending}
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Complete Pre-Test & View Results
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
