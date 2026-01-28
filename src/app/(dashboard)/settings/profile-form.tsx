'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { updateTrainerProfile } from './actions'

interface ProfileFormProps {
  currentName: string
  email: string
}

export function ProfileForm({ currentName, email }: ProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(currentName)
  const [error, setError] = useState<string | null>(null)

  const hasChanges = name.trim() !== currentName
  const isValid = name.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.set('name', name)

    startTransition(async () => {
      const result = await updateTrainerProfile(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/settings?success=true')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-300">
          Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
          disabled={isPending}
        />
        {!currentName && (
          <p className="text-xs text-amber-400">
            Please enter your name to complete your profile setup.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Email</Label>
        <Input
          value={email}
          disabled
          className="bg-slate-800/50 border-slate-700 text-slate-400"
        />
        <p className="text-xs text-slate-500">
          Email is managed through your authentication provider.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isPending || !hasChanges || !isValid}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
