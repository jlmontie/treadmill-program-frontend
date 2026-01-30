'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Dumbbell, AlertCircle } from 'lucide-react'
import { assignProgram } from '../actions'

interface Program {
  id: number
  name: string
  athlete_type: string
  level: string
  metabolic_category: string
  total_workouts: number
}

interface AssignProgramFormProps {
  athleteId: string
  athleteName: string
  athleteGender: string
  programs: Program[]
  hasActiveProgram: boolean
  pretestSessionId?: string | null
}

export function AssignProgramForm({ 
  athleteId, 
  athleteName, 
  athleteGender,
  programs,
  hasActiveProgram,
  pretestSessionId,
}: AssignProgramFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [notes, setNotes] = useState('')

  // Auto-open dialog if ?assign=true is in URL
  useEffect(() => {
    if (searchParams.get('assign') === 'true') {
      setOpen(true)
      // Clean up the URL
      router.replace(`/athletes/${athleteId}`, { scroll: false })
    }
  }, [searchParams, athleteId, router])

  // Filter programs by athlete gender
  // Programs with "female" in type/name are for female athletes
  // All other programs (standard, line, lineman) are for male athletes
  const filteredPrograms = programs.filter(p => {
    const type = p.athlete_type.toLowerCase()
    const name = p.name.toLowerCase()
    const isFemaleProgram = type.includes('female') || name.includes('female')
    
    if (athleteGender === 'female') {
      return isFemaleProgram
    } else {
      // Male athletes get all non-female programs
      return !isFemaleProgram
    }
  })

  // Group programs by level
  const groupedPrograms = filteredPrograms.reduce((acc, program) => {
    const key = `${program.athlete_type} - ${program.level}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(program)
    return acc
  }, {} as Record<string, Program[]>)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedProgramId) {
      setError('Please select a program')
      return
    }

    const formData = new FormData()
    formData.set('athlete_id', athleteId)
    formData.set('program_id', selectedProgramId)
    if (pretestSessionId) {
      formData.set('pretest_session_id', pretestSessionId)
    }
    formData.set('notes', notes)

    startTransition(async () => {
      const result = await assignProgram(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setSelectedProgramId('')
        setNotes('')
        router.refresh()
      }
    })
  }

  const selectedProgram = programs.find(p => p.id.toString() === selectedProgramId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25">
          <Plus className="mr-2 h-4 w-4" />
          Assign Program
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-violet-400" />
            Assign Program
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Select a training program for {athleteName}
          </DialogDescription>
        </DialogHeader>

        {hasActiveProgram && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-400 font-medium">Active program will be paused</p>
              <p className="text-amber-400/80">
                This athlete already has an active program. Assigning a new one will pause the current program.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program" className="text-slate-300">
              Program <span className="text-red-400">*</span>
            </Label>
            <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 max-h-80">
                {Object.entries(groupedPrograms).map(([group, progs]) => (
                  <div key={group}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-800/50">
                      {group}
                    </div>
                    {progs.map((program) => (
                      <SelectItem 
                        key={program.id} 
                        value={program.id.toString()}
                        className="text-white focus:bg-slate-800"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{program.name}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            {program.total_workouts} workouts
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProgram && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-sm text-slate-400">Selected Program</div>
              <div className="text-white font-medium">{selectedProgram.name}</div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedProgram.total_workouts} workouts • {selectedProgram.level} level
                {selectedProgram.metabolic_category !== 'standard' && (
                  <span className="ml-1 text-amber-400">
                    ({selectedProgram.metabolic_category.toUpperCase()})
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this program assignment..."
              className="bg-slate-800/50 border-slate-700 text-white"
              rows={2}
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedProgramId}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Assign Program
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
