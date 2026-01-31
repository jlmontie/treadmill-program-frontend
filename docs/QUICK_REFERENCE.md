# Quick Reference - Common Patterns

**Fast lookup for the most frequently used patterns in this codebase.**

For complete standards, see [AI_CODING_STANDARDS.md](./AI_CODING_STANDARDS.md).

---

## 🚨 Before Any Commit

```bash
./scripts/checkpoint.sh  # MUST PASS
```

---

## 📝 Server Action Template

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { withAuthRateLimited } from '@/lib/supabase/auth'
import { failure, success, type ActionResult } from '@/lib/types/actions'

// 1. Define schema
const MySchema = z.object({
  field: z
    .string()
    .min(1)
    .transform((s) => s.trim()),
})

// 2. Implement action
export async function myAction(formData: FormData): Promise<ActionResult<string>> {
  // Auth + rate limit
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase, trainer } = authResult.data

  // Validate
  const validated = MySchema.safeParse({
    field: formData.get('field'),
  })
  if (!validated.success) {
    return failure('Validation error')
  }

  // Execute
  const { data, error } = await supabase
    .from('table')
    .insert({ ...validated.data, trainer_id: trainer.id })
    .select('id')
    .single()

  if (error) {
    return failure(error.message)
  }

  // Revalidate and return
  revalidatePath('/path')
  return success(data.id)
}
```

---

## 📋 Form Component Template

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { myFormSchema, type MyFormValues } from '@/lib/validations/forms'
import { myAction } from './actions'

export function MyForm() {
  const form = useForm<MyFormValues>({
    resolver: zodResolver(myFormSchema),
    defaultValues: {
      field: '',
    },
  })

  const onSubmit = async (values: MyFormValues) => {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value != null) formData.set(key, String(value))
    })

    const result = await myAction(formData)

    if (!result.success) {
      form.setError('root', { message: result.error })
      toast.error(result.error)
      return
    }

    toast.success('Success!')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Root error */}
        {form.formState.errors.root && (
          <div
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            role="alert"
            aria-live="assertive"
          >
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Field */}
        <FormField
          control={form.control}
          name="field"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">
                Field Name <span className="text-red-400">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter value"
                  className="bg-slate-800/50 border-slate-700 text-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit button */}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          aria-busy={form.formState.isSubmitting}
          className="bg-gradient-to-r from-cyan-600 to-blue-600"
        >
          {form.formState.isSubmitting && (
            <span className="sr-only">Saving, please wait</span>
          )}
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 🔒 Validation Schema Template

```typescript
// src/lib/validations/forms.ts
import { z } from 'zod'

export const myFormSchema = z.object({
  // Required string
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform((s) => s.trim()),

  // Optional string
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .transform((s) => s.trim())
    .optional()
    .default(''),

  // Enum
  status: z.enum(['active', 'inactive'], {
    message: 'Status must be active or inactive',
  }),

  // Number from string (form input)
  age: z
    .string()
    .min(1, 'Age is required')
    .refine((val) => !isNaN(parseInt(val, 10)), 'Must be a number')
    .transform((val) => parseInt(val, 10)),

  // UUID
  id: z.string().uuid('Invalid ID format'),

  // Optional enum
  size: z.enum(['small', 'medium', 'large']).optional(),
})

export type MyFormValues = z.infer<typeof myFormSchema>
```

---

## ♿ Accessibility Checklist

### Loading Button

```typescript
<Button
  disabled={isPending}
  aria-busy={isPending}
>
  {isPending && <span className="sr-only">Action description, please wait</span>}
  {isPending ? (
    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</>
  ) : (
    'Submit'
  )}
</Button>
```

### Error Message

```typescript
{error && (
  <div
    className="text-red-400 text-sm"
    role="alert"
    aria-live="assertive"
  >
    {error}
  </div>
)}
```

### Keyboard-Accessible Button

```typescript
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
  aria-pressed={isActive}
  aria-label="Descriptive label"
>
  Content
</button>
```

---

## 🧪 Test Template

```typescript
// src/lib/my-util.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from './my-util'

describe('myFunction', () => {
  it('handles valid input correctly', () => {
    const result = myFunction({ value: 100 })
    expect(result).toBe(200)
  })

  it('returns null for missing data', () => {
    const result = myFunction({ value: null })
    expect(result).toBeNull()
  })

  it('handles edge case at boundary', () => {
    const result = myFunction({ value: 0 })
    expect(result).toBe(0)
  })
})
```

---

## 🔍 Console Logging

```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data)
}

// Production error tracking
import { captureException } from '@/lib/monitoring'
try {
  await operation()
} catch (error) {
  captureException(error as Error, { context: 'operation-name' })
  throw error
}
```

---

## 🌐 Environment Variables

```typescript
// ✅ CORRECT
import { config } from '@/lib/env'
const url = config.supabase.url

// ❌ WRONG
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
```

---

## 📊 Error Boundary Template

```typescript
// error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Page error:', error)
    }
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Something Went Wrong</h2>
        <p className="text-slate-400">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" asChild>
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🎯 useEffect Cleanup

```typescript
// With subscription
useEffect(() => {
  const channel = supabase
    .channel('changes')
    .on(
      'postgres_changes',
      {
        /* ... */
      },
      handleUpdate
    )
    .subscribe()

  return () => {
    channel.unsubscribe() // REQUIRED
  }
}, [supabase, handleUpdate])

// With timer
useEffect(() => {
  const interval = setInterval(() => {
    updateTime()
  }, 1000)

  return () => {
    clearInterval(interval) // REQUIRED
  }
}, [])
```

---

## 🔄 Revalidation

```typescript
import { revalidatePath } from 'next/cache'

// After mutation
revalidatePath('/athletes') // Revalidate list page
revalidatePath(`/athletes/${id}`) // Revalidate detail page
revalidatePath('/athletes', 'layout') // Revalidate entire athletes section
```

---

## 🚀 Import Patterns

```typescript
// Zod
import { z } from 'zod'

// Auth
import { withAuth, withAuthRateLimited } from '@/lib/supabase/auth'

// Action results
import { success, failure, successVoid, type ActionResult } from '@/lib/types/actions'

// Supabase
import { createClient } from '@/lib/supabase/server' // Server-side
import { createClient } from '@/lib/supabase/client' // Client-side

// Config
import { config } from '@/lib/env'

// Toast
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// Icons
import { Loader2, Check, ArrowLeft } from 'lucide-react'
```

---

## 🎨 Common Class Patterns

```typescript
// Cards
className = 'bg-slate-900/50 border-slate-800'

// Inputs
className =
  'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'

// Buttons (primary)
className = 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'

// Buttons (danger)
className = 'bg-red-600 hover:bg-red-500 text-white'

// Error messages
className = 'p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm'

// Success messages
className = 'p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm'
```

---

## 📊 Database Query Patterns

```typescript
// Single record
const { data, error } = await supabase
  .from('athletes')
  .select('id, name, gender')
  .eq('id', athleteId)
  .single()

// List with filter
const { data, error } = await supabase
  .from('athletes')
  .select('*')
  .eq('trainer_id', trainerId)
  .order('name')

// With relation
const { data, error } = await supabase
  .from('athlete_programs')
  .select('*, athletes(*), programs(*)')
  .eq('status', 'active')

// RPC call
const { data, error } = await supabase.rpc('function_name', {
  p_param1: value1,
  p_param2: value2,
})
```

---

## 🎯 Remember

### ALWAYS:

✅ Run checkpoint before commit  
✅ Validate with Zod  
✅ Use ActionResult<T>  
✅ Add aria-busy to loading buttons  
✅ Guard console statements  
✅ Clean up useEffect subscriptions

### NEVER:

❌ Type assertions on user input  
❌ alert/confirm/prompt  
❌ Unguarded console logs  
❌ Skip quality gates  
❌ Manual form state  
❌ Direct process.env access

---

_For complete details, see [AI_CODING_STANDARDS.md](./AI_CODING_STANDARDS.md)_
