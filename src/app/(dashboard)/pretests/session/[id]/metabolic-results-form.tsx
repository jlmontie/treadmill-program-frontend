'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Heart, Activity, Timer, CheckCircle2 } from 'lucide-react'
import { completePretest } from '../../actions'
import { useFormStatus } from 'react-dom'

interface MetabolicResultsFormProps {
  sessionId: string
  athleteName: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25"
    >
      {pending ? (
        <>
          <Activity className="mr-2 h-4 w-4 animate-pulse" />
          Saving...
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Complete Pre-Test
        </>
      )}
    </Button>
  )
}

export function MetabolicResultsForm({ sessionId, athleteName }: MetabolicResultsFormProps) {
  return (
    <Card className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-400" />
          Metabolic Results
        </CardTitle>
        <CardDescription className="text-slate-300">
          All steps completed! Record {athleteName}&apos;s heart rate measurements to finish the pre-test.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={completePretest} className="space-y-6">
          <input type="hidden" name="session_id" value={sessionId} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AT Heart Rate */}
            <div className="space-y-2">
              <Label htmlFor="at_hr" className="text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                AT Heart Rate (bpm)
              </Label>
              <Input
                id="at_hr"
                name="at_hr"
                type="number"
                min="60"
                max="220"
                placeholder="e.g., 165"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
              />
              <p className="text-xs text-slate-500">Anaerobic Threshold HR</p>
            </div>

            {/* Max Heart Rate */}
            <div className="space-y-2">
              <Label htmlFor="max_hr" className="text-slate-300 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400" />
                Max Heart Rate (bpm)
              </Label>
              <Input
                id="max_hr"
                name="max_hr"
                type="number"
                min="60"
                max="220"
                placeholder="e.g., 185"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500"
              />
              <p className="text-xs text-slate-500">Maximum HR achieved</p>
            </div>

            {/* 2-Min Recovery HR */}
            <div className="space-y-2">
              <Label htmlFor="recovery_hr_2min" className="text-slate-300 flex items-center gap-2">
                <Timer className="h-4 w-4 text-violet-400" />
                Recovery HR (2 min)
              </Label>
              <Input
                id="recovery_hr_2min"
                name="recovery_hr_2min"
                type="number"
                min="60"
                max="220"
                placeholder="e.g., 120"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500"
              />
              <p className="text-xs text-slate-500">HR after 2 min recovery</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <h4 className="font-medium text-white mb-2">How Metabolic Data is Used</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• <strong>AT/Max %</strong>: Calculated automatically from AT and Max HR</li>
              <li>• <strong>Recovery %</strong>: Recovery HR / AT HR indicates conditioning level</li>
              <li>• <strong>Metabolic Category</strong>: Determines if athlete needs extra conditioning work</li>
            </ul>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Overall observations, athlete feedback, or recommendations..."
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
