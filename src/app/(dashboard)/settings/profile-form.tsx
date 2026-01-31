'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2, Save } from 'lucide-react'
import { updateTrainerProfile } from './actions'
import { profileFormSchema, type ProfileFormValues } from '@/lib/validations/forms'

interface ProfileFormProps {
  currentName: string
  email: string
}

export function ProfileForm({ currentName, email }: ProfileFormProps) {
  const router = useRouter()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentName,
    },
  })

  const { isSubmitting, isDirty } = form.formState

  const onSubmit = async (values: ProfileFormValues) => {
    const formData = new FormData()
    formData.set('name', values.name)

    const result = await updateTrainerProfile(formData)
    
    if (!result.success) {
      form.setError('root', { message: result.error })
    } else {
      router.push('/settings?success=true')
      router.refresh()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">
                Name <span className="text-red-400">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter your name"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  disabled={isSubmitting}
                />
              </FormControl>
              {!currentName && (
                <FormDescription className="text-amber-400">
                  Please enter your name to complete your profile setup.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel className="text-slate-300">Email</FormLabel>
          <Input
            value={email}
            disabled
            className="bg-slate-800/50 border-slate-700 text-slate-400"
          />
          <p className="text-xs text-slate-500">
            Email is managed through your authentication provider.
          </p>
        </div>

        {form.formState.errors.root && (
          <div 
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            role="alert"
            aria-live="assertive"
          >
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            aria-busy={isSubmitting}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
          >
            {isSubmitting && <span className="sr-only">Saving profile, please wait</span>}
            {isSubmitting ? (
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
    </Form>
  )
}
