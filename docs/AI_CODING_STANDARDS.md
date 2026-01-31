# AI Agent Coding Standards

**⚠️ STRICT ENFORCEMENT: These rules are non-negotiable and must be followed by all AI agents.**

This document defines the absolute requirements for any code changes to this codebase. Deviations are not permitted.

---

## 🚨 CRITICAL: Quality Gates (Non-Negotiable)

### Before ANY Code Change Can Be Committed:

**The checkpoint script MUST pass:**

```bash
./scripts/checkpoint.sh
```

This script enforces:

1. ✅ **Type Check** - `tsc --noEmit` must pass with ZERO errors
2. ✅ **Lint** - `eslint` must pass (warnings acceptable, errors are NOT)
3. ✅ **Build** - `npm run build` must succeed
4. ✅ **Tests** - `npm test` must pass with 100% of tests passing

### Absolute Rules:

**NEVER:**

- ❌ Commit code that fails type checking
- ❌ Commit code that fails to build
- ❌ Commit code that breaks existing tests
- ❌ Use workarounds or bandage fixes to make checks pass
- ❌ Suppress errors with `@ts-ignore`, `@ts-expect-error`, or `eslint-disable`
- ❌ Skip the checkpoint script
- ❌ Commit without running the full checkpoint

**ALWAYS:**

- ✅ Run `./scripts/checkpoint.sh` before every commit
- ✅ Fix root causes of errors, not symptoms
- ✅ Write or update tests for new functionality
- ✅ Verify all quality gates pass

---

## 🔒 Security Standards (Mandatory)

### 1. Rate Limiting

**RULE:** All mutation server actions MUST use `withAuthRateLimited()`

```typescript
// ✅ CORRECT
export async function createAthlete(formData: FormData): Promise<ActionResult<string>> {
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase, trainer } = authResult.data
  // ... rest of function
}

// ❌ INCORRECT - Missing rate limiting
export async function createAthlete(formData: FormData) {
  const authResult = await withAuth() // Wrong! Use withAuthRateLimited
  // ...
}

// ❌ INCORRECT - Manual auth
export async function createAthlete(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser() // Wrong! Use withAuthRateLimited
  // ...
}
```

**Exceptions:** Read-only operations can use `withAuth()` (no rate limit needed)

### 2. Security Headers

**RULE:** Security headers are configured in `next.config.ts` and MUST NOT be removed or weakened.

Required headers:

- ✅ Content-Security-Policy (CSP) - Strict, whitelists Supabase only
- ✅ Strict-Transport-Security (HSTS) - Production only, 1 year max-age
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin

**NEVER:**

- ❌ Weaken CSP by adding `unsafe-*` beyond existing exceptions
- ❌ Remove HSTS or reduce max-age
- ❌ Add untrusted domains to CSP whitelist

### 3. Input Validation

**RULE:** ALL user inputs MUST be validated with Zod schemas BEFORE processing.

```typescript
// ✅ CORRECT
const validated = MySchema.safeParse(input)
if (!validated.success) {
  return failure('Validation error')
}
const { field1, field2 } = validated.data // Use validated.data

// ❌ INCORRECT - Using input without validation
const field1 = formData.get('field1') as string // NO type assertions!

// ❌ INCORRECT - Accessing .data without checking .success
const validated = MySchema.safeParse(input)
const data = validated.data // WRONG! Check .success first
```

### 4. Authentication

**RULE:** ALL server actions MUST authenticate using `withAuth()` or `withAuthRateLimited()`.

**NEVER:**

- ❌ Manual `createClient()` + `getUser()` in server actions
- ❌ Skip authentication checks
- ❌ Trust client-side user data

**Exception:** `updateTrainerProfile` uses `getAuthenticatedClient()` (special case for profile creation).

---

## ♿ Accessibility Standards (WCAG 2.1 Level AA)

### 1. Loading States

**RULE:** ALL buttons with loading states MUST have accessibility attributes.

```typescript
// ✅ CORRECT
<Button disabled={isPending} aria-busy={isPending}>
  {isPending && <span className="sr-only">Saving changes, please wait</span>}
  {isPending ? (
    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
  ) : (
    'Save'
  )}
</Button>

// ❌ INCORRECT - Missing aria-busy and sr-only
<Button disabled={isPending}>
  {isPending ? <Loader2 className="animate-spin" /> : 'Save'}
</Button>
```

Required attributes:

- ✅ `aria-busy={isPending}` on the button
- ✅ `<span className="sr-only">Action description, please wait</span>` for screen readers

### 2. Error Messages

**RULE:** ALL error messages MUST be announced to screen readers.

```typescript
// ✅ CORRECT
{error && (
  <div
    className="text-red-400 text-sm"
    role="alert"
    aria-live="assertive"
  >
    {error}
  </div>
)}

// ❌ INCORRECT - Missing ARIA attributes
{error && (
  <div className="text-red-400">{error}</div>
)}
```

Required attributes:

- ✅ `role="alert"` - Identifies as an alert
- ✅ `aria-live="assertive"` - Announces immediately

### 3. Interactive Elements

**RULE:** All interactive elements (buttons, custom controls) MUST be keyboard accessible.

For custom buttons/controls:

```typescript
// ✅ CORRECT - Keyboard accessible
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

// ❌ INCORRECT - No keyboard support
<div onClick={handleClick}>Content</div>
```

Required:

- ✅ Keyboard event handlers (Enter, Space keys)
- ✅ ARIA labels for context
- ✅ ARIA state attributes (aria-pressed, aria-expanded, etc.)

---

## 📝 Form Handling Standards

### 1. React Hook Form (Required)

**RULE:** ALL forms MUST use React Hook Form with Zod validation.

```typescript
// ✅ CORRECT
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { myFormSchema } from '@/lib/validations/forms'

const form = useForm({
  resolver: zodResolver(myFormSchema),
  defaultValues: { /* ... */ },
})

const onSubmit = async (values: FormValues) => {
  const formData = new FormData()
  // ... build FormData from validated values
  const result = await myAction(formData)

  if (!result.success) {
    form.setError('root', { message: result.error })
  }
}

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="fieldName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Label</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  </Form>
)

// ❌ INCORRECT - Manual form handling
const [name, setName] = useState('')
const [errors, setErrors] = useState({})

<form action={myAction}>
  <input name="name" value={name} onChange={(e) => setName(e.target.value)} />
  {errors.name && <span>{errors.name}</span>}
</form>
```

**NEVER:**

- ❌ Use manual `useState` for form fields
- ❌ Use uncontrolled forms without React Hook Form
- ❌ Skip validation with Zod schemas
- ❌ Use `useActionState` for form handling (legacy pattern)

### 2. Form Validation

**RULE:** Define ALL form schemas in `src/lib/validations/forms.ts`.

Schema requirements:

- ✅ Use `.trim()` on string inputs to remove whitespace
- ✅ Set proper max lengths (prevent database errors)
- ✅ Use `.transform()` for data normalization
- ✅ Export both schema and inferred type

```typescript
// ✅ CORRECT
export const myFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform((s) => s.trim()),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .transform((s) => s.trim())
    .optional()
    .default(''),
})

export type MyFormValues = z.infer<typeof myFormSchema>
```

---

## 🎯 Server Action Standards

### 1. Return Type Pattern

**RULE:** Server actions MUST use one of two patterns:

**Pattern A: Return ActionResult<T>** (Preferred)

```typescript
export async function myAction(data: FormData): Promise<ActionResult<string>> {
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult

  // Validate input
  const validated = MySchema.safeParse(/* ... */)
  if (!validated.success) {
    return failure('Validation error')
  }

  // Perform operation
  const { data, error } = await supabase.from('table').insert(/* ... */)

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/path')
  return success(data.id)
}
```

**Pattern B: Promise<void> with redirect()** (For navigation-heavy flows)

```typescript
export async function myAction(data: FormData): Promise<void> {
  const authResult = await withAuthRateLimited()
  if (!authResult.success) {
    redirect('/login')
  }

  // Validate input
  const validated = MySchema.safeParse(/* ... */)
  if (!validated.success) {
    redirect('/page?error=invalid')
  }

  // Perform operation
  const { error } = await supabase.from('table').insert(/* ... */)

  if (error) {
    redirect('/page?error=failed')
  }

  revalidatePath('/path')
  redirect('/success-page') // Throws and terminates
}
```

**NEVER:**

- ❌ Mix patterns within the same file
- ❌ Return raw data without ActionResult wrapper (Pattern A)
- ❌ Use try/catch without proper error handling
- ❌ Return old form state types (deprecated)

### 2. Import Order

```typescript
// ✅ CORRECT ORDER
'use server'

// 1. Next.js imports
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// 2. External libraries
import { z } from 'zod'

// 3. Internal utilities
import { withAuthRateLimited } from '@/lib/supabase/auth'
import { success, failure } from '@/lib/types/actions'

// 4. Type imports
import type { Database } from '@/lib/types/database'
```

---

## 🧪 Testing Standards

### 1. Test Requirements

**RULE:** ALL new utility functions MUST have unit tests.

Test coverage requirements:

- ✅ Pure functions: 100% coverage required
- ✅ Utility functions: All branches tested
- ✅ Edge cases: Boundary conditions tested
- ✅ Error cases: Invalid inputs tested

```typescript
// ✅ CORRECT - Comprehensive test suite
describe('myFunction', () => {
  it('handles valid input correctly', () => {
    /* ... */
  })
  it('returns null for missing data', () => {
    /* ... */
  })
  it('handles boundary case at threshold', () => {
    /* ... */
  })
  it('throws error for invalid input', () => {
    /* ... */
  })
})
```

### 2. Test Files

**RULE:** Test files MUST be named `*.test.ts` or `*.test.tsx` and located next to the source file.

```
src/lib/metabolic.ts
src/lib/metabolic.test.ts  ✅ CORRECT
```

**NEVER:**

- ❌ Place tests in separate `/tests` folder
- ❌ Use `.spec.ts` naming (use `.test.ts`)
- ❌ Skip tests for "simple" functions

### 3. Running Tests

**RULE:** Tests run automatically in checkpoint script. You MAY also run them manually:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
```

---

## 🎨 Console Logging Standards

### 1. Production Console Rules

**RULE:** ALL console statements MUST be guarded with `NODE_ENV` check.

```typescript
// ✅ CORRECT
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}

// ❌ INCORRECT - Unguarded console
console.log('Debug info:', data)
```

**NEVER:**

- ❌ Use `console.log`, `console.error`, `console.warn` without guards
- ❌ Log sensitive data (passwords, tokens, PII)
- ❌ Use console for production error tracking (use `monitoring.ts` instead)

### 2. Monitoring Instead of Console

**RULE:** For production error tracking, use the monitoring utilities:

```typescript
import { captureException, captureMessage } from '@/lib/monitoring'

// ✅ CORRECT - Production-ready error tracking
try {
  await riskyOperation()
} catch (error) {
  captureException(error as Error, { context: 'operation-name' })
  throw error
}

// ✅ CORRECT - Structured logging
captureMessage('Important event occurred', 'info', { userId: user.id })
```

---

## 🚫 Prohibited Patterns

### Absolutely Forbidden:

**NEVER use browser native dialogs:**

```typescript
// ❌ FORBIDDEN
alert('Message')
confirm('Are you sure?')
prompt('Enter value')
```

**ALWAYS use modern alternatives:**

```typescript
// ✅ CORRECT - Use toast for notifications
import { toast } from 'sonner'
toast.error('Message', { description: 'Details' })

// ✅ CORRECT - Use Dialog component for confirmations
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog'
const [open, setOpen] = useState(false)
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogTitle>Confirm Action?</DialogTitle>
    <DialogFooter>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**NEVER use type assertions on server action inputs:**

```typescript
// ❌ FORBIDDEN
const name = formData.get('name') as string

// ✅ CORRECT - Validate with Zod
const validated = MySchema.safeParse({
  name: formData.get('name'),
})
if (!validated.success) {
  return failure('Invalid input')
}
const { name } = validated.data
```

**NEVER bypass validation:**

```typescript
// ❌ FORBIDDEN
const data = MySchema.parse(input) // Throws on error (not caught)

// ✅ CORRECT
const result = MySchema.safeParse(input)
if (!result.success) {
  return failure('Validation failed')
}
const data = result.data
```

---

## ⚛️ React Patterns (Strict)

### 1. Server Components (Default)

**RULE:** Use Server Components by default. Only add `'use client'` when necessary.

Client components are ONLY needed for:

- ✅ `useState`, `useEffect`, `useCallback`, etc.
- ✅ Event handlers (`onClick`, `onChange`, etc.)
- ✅ Browser APIs (`window`, `localStorage`, etc.)
- ✅ Real-time subscriptions

```typescript
// ✅ CORRECT - Server Component (no 'use client')
export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('athletes').select('*')
  return <div>{/* Render data */}</div>
}

// ✅ CORRECT - Client Component (needs state)
'use client'
export function Form() {
  const [value, setValue] = useState('')
  return <input value={value} onChange={(e) => setValue(e.target.value)} />
}
```

### 2. React Hooks (Strict Rules)

**RULE:** Follow ALL React Hooks rules exactly.

**useEffect Dependencies:**

```typescript
// ✅ CORRECT - All dependencies listed
useEffect(() => {
  fetchData(supabase, userId)
}, [supabase, userId])

// ❌ INCORRECT - Missing dependency
useEffect(() => {
  fetchData(supabase, userId)
}, [supabase]) // Missing userId!
```

**useCallback for Stable References:**

```typescript
// ✅ CORRECT - Memoized callback prevents re-subscriptions
const handleUpdate = useCallback((payload) => {
  setData(payload.new)
}, [])

useEffect(() => {
  const subscription = supabase
    .channel('changes')
    .on(
      'postgres_changes',
      {
        /* ... */
      },
      handleUpdate
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [supabase, handleUpdate])

// ❌ INCORRECT - Inline function causes re-subscription every render
useEffect(() => {
  const subscription = supabase
    .channel('changes')
    .on(
      'postgres_changes',
      {
        /* ... */
      },
      (payload) => {
        setData(payload.new) // New function every render!
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [supabase])
```

**NEVER:**

- ❌ Ignore ESLint `exhaustive-deps` warnings
- ❌ Call impure functions (Date.now(), Math.random()) during render in Server Components
- ❌ Create memory leaks (missing cleanup in useEffect)

### 3. Impure Functions

**RULE:** Impure functions MUST be wrapped or moved to client-side.

```typescript
// ✅ CORRECT - Wrapped in useCallback (client component)
const getTimestamp = useCallback(() => Date.now(), [])

// ✅ CORRECT - Calculated in client component
'use client'
export function Component({ startedAt }: { startedAt: string }) {
  const elapsed = Date.now() - new Date(startedAt).getTime()
  return <div>{elapsed}ms</div>
}

// ❌ INCORRECT - Impure function in Server Component render
export default async function Page() {
  const now = Date.now()  // Wrong! Impure during render
  return <div>{now}</div>
}
```

---

## 🔧 Environment Variables

### 1. Centralized Validation

**RULE:** ALL environment variables MUST be accessed through `src/lib/env.ts`.

```typescript
// ✅ CORRECT
import { config } from '@/lib/env'
const url = config.supabase.url

// ❌ INCORRECT - Direct process.env access
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
```

**NEVER:**

- ❌ Use `process.env.VARIABLE_NAME!` (non-null assertion)
- ❌ Access env vars directly (always use `config`)
- ❌ Skip validation for new env vars

### 2. Adding New Environment Variables

**RULE:** When adding new env vars, you MUST:

1. ✅ Add to schema in `src/lib/env.ts`
2. ✅ Add to `env.example` with description
3. ✅ Add to config object with proper typing
4. ✅ Document in README if user-facing

```typescript
// src/lib/env.ts
const envSchema = z.object({
  // ... existing vars
  NEW_VARIABLE: z.string().min(1, 'New variable is required'),
})

export const config = {
  // ... existing config
  newFeature: {
    apiKey: env.NEW_VARIABLE,
  },
} as const
```

---

## 📊 Error Handling Standards

### 1. ActionResult<T> Type

**RULE:** ALL server actions returning data MUST use `ActionResult<T>`.

```typescript
import { success, failure, successVoid, type ActionResult } from '@/lib/types/actions'

// ✅ CORRECT - Returns data
export async function getData(): Promise<ActionResult<MyData>> {
  // ... operation
  if (error) return failure(error.message)
  return success(data)
}

// ✅ CORRECT - Returns nothing (void)
export async function deleteData(): Promise<ActionResult<void>> {
  // ... operation
  if (error) return failure(error.message)
  return successVoid()
}
```

### 2. Error Boundaries

**RULE:** ALL route segments MUST have error boundaries.

Required files for each route:

- ✅ `page.tsx` - The actual page
- ✅ `error.tsx` - Error boundary for runtime errors
- ✅ `not-found.tsx` - 404 page (for dynamic routes)

```typescript
// error.tsx template
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 3. Error Messages

**RULE:** Error messages MUST be user-friendly and actionable.

```typescript
// ✅ CORRECT - Clear, actionable
return failure('Failed to save athlete. Please check all required fields and try again.')

// ❌ INCORRECT - Technical jargon
return failure('Database constraint violation on FK athletes_trainer_id')

// ❌ INCORRECT - No context
return failure('Error')
```

---

## 🗄️ Database Patterns

### 1. Atomic Operations

**RULE:** Use RPC functions for operations requiring atomicity or multiple steps.

```typescript
// ✅ CORRECT - Atomic increment via RPC
const { error } = await supabase.rpc('increment_workout_number', {
  p_athlete_program_id: id,
  p_session_id: sessionId,
})

// ❌ INCORRECT - Race condition (read-modify-write)
const { data } = await supabase
  .from('athlete_programs')
  .select('current_workout_number')
  .eq('id', id)
  .single()

await supabase
  .from('athlete_programs')
  .update({ current_workout_number: data.current_workout_number + 1 })
  .eq('id', id)
```

### 2. Query Efficiency

**RULE:** Select only the columns you need.

```typescript
// ✅ CORRECT - Specific columns
const { data } = await supabase
  .from('athletes')
  .select('id, name, gender')
  .eq('trainer_id', trainerId)

// ❌ INCORRECT - Unnecessary data transfer
const { data } = await supabase
  .from('athletes')
  .select('*') // Fetches everything (notes, timestamps, etc.)
  .eq('trainer_id', trainerId)
```

### 3. Type Safety

**RULE:** Update `src/lib/types/database.ts` when adding RPC functions or schema changes.

After creating a new RPC function in migration:

1. ✅ Manually add to Database['public']['Functions'] in `database.ts`
2. ✅ Include proper parameter and return types
3. ✅ Run type check to verify

---

## 📁 File Organization

### 1. File Naming

**RULE:** Follow Next.js App Router conventions exactly.

```
src/app/(dashboard)/
├── athletes/
│   ├── page.tsx              # List page
│   ├── loading.tsx           # Loading state
│   ├── error.tsx             # Error boundary
│   ├── actions.ts            # Server actions
│   ├── new/
│   │   ├── page.tsx          # Create page
│   │   └── error.tsx         # Error boundary
│   └── [id]/
│       ├── page.tsx          # Detail page
│       ├── edit/
│       │   └── page.tsx      # Edit page
│       ├── error.tsx         # Error boundary
│       ├── not-found.tsx     # 404 page
│       └── *-form.tsx        # Form components
```

**NEVER:**

- ❌ Use `route.ts` alongside `page.tsx` in same folder
- ❌ Mix client and server logic in `page.tsx` (use separate components)
- ❌ Skip `error.tsx` or `not-found.tsx` for routes

### 2. Component Files

**RULE:** Component files MUST use kebab-case naming.

```typescript
// ✅ CORRECT
athlete - workout - card.tsx
metabolic - test - form.tsx
start - workout - button.tsx

// ❌ INCORRECT
AthleteWorkoutCard.tsx // PascalCase
athleteWorkoutCard.tsx // camelCase
athlete_workout_card.tsx // snake_case
```

---

## 🔐 TypeScript Strictness

### 1. Strict Mode (Non-Negotiable)

**RULE:** TypeScript strict mode is ENABLED and MUST remain enabled.

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true, // MUST be true
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

**NEVER:**

- ❌ Disable strict mode
- ❌ Use `any` type (use `unknown` and narrow)
- ❌ Use `@ts-ignore` or `@ts-expect-error`
- ❌ Use non-null assertions (`!`) without clear justification

### 2. Type Assertions

**RULE:** Type assertions are FORBIDDEN except for specific cases.

```typescript
// ✅ ACCEPTABLE - Type narrowing with validation
const validated = schema.safeParse(input)
if (validated.success) {
  const data = validated.data // Type is narrowed
}

// ✅ ACCEPTABLE - Const assertion for literals
const navigation = [{ href: '/dashboard', label: 'Dashboard' }] as const

// ❌ FORBIDDEN - Blind type assertion
const name = formData.get('name') as string

// ❌ FORBIDDEN - Any escape hatch
const data = result as any
```

---

## 🎯 Code Style (Enforced by Pre-commit)

### 1. Prettier (Automatic)

**RULE:** Prettier automatically formats code on commit. Do NOT manually format.

Configuration (`.prettierrc`):

- Semi: false
- Single quotes: true
- Print width: 100
- Tab width: 2
- Tailwind plugin: enabled (auto-sorts classes)

**Pre-commit hook:**

- ✅ Runs ESLint --fix (auto-fixes lint issues)
- ✅ Runs Prettier --write (auto-formats code)
- ✅ Runs type check (catches type errors)

### 2. Import Organization

**RULE:** Organize imports in this order:

1. React / Next.js
2. External libraries
3. Internal utilities (@/lib/\*)
4. Components (@/components/\*)
5. Types (type imports last)

```typescript
// ✅ CORRECT
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Database } from '@/lib/types/database'
```

---

## 🏗️ Architecture Decisions

### 1. Next.js App Router

**RULE:** This project uses Next.js App Router (NOT Pages Router).

Mandatory patterns:

- ✅ Server Components by default
- ✅ `async` functions for data fetching in pages
- ✅ Server Actions with `'use server'`
- ✅ Route-based file organization
- ✅ Middleware for auth (already implemented)

**NEVER:**

- ❌ Create `pages/` directory (use `app/`)
- ❌ Use `getServerSideProps` (use async Server Components)
- ❌ Use API routes for mutations (use Server Actions)

### 2. Data Fetching

**RULE:** Fetch data in Server Components, not client-side.

```typescript
// ✅ CORRECT - Server Component data fetch
export default async function AthletesPage() {
  const supabase = await createClient()
  const { data: athletes } = await supabase
    .from('athletes')
    .select('*')

  return <AthleteList athletes={athletes} />
}

// ❌ INCORRECT - Client-side fetch in useEffect
'use client'
export default function AthletesPage() {
  const [athletes, setAthletes] = useState([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('athletes').select('*')
      setAthletes(data)
    }
    load()
  }, [])

  return <AthleteList athletes={athletes} />
}
```

### 3. Real-time Subscriptions

**RULE:** Always clean up subscriptions on unmount.

```typescript
// ✅ CORRECT - Proper cleanup
useEffect(() => {
  const channel = supabase
    .channel('my-channel')
    .on(
      'postgres_changes',
      {
        /* ... */
      },
      handleChange
    )
    .subscribe()

  return () => {
    channel.unsubscribe() // CRITICAL: Cleanup
  }
}, [supabase, handleChange])

// ❌ INCORRECT - Memory leak
useEffect(() => {
  supabase
    .channel('my-channel')
    .on(
      'postgres_changes',
      {
        /* ... */
      },
      handleChange
    )
    .subscribe()
  // Missing cleanup!
}, [supabase, handleChange])
```

---

## 📦 Dependencies

### 1. Adding Dependencies

**RULE:** Get approval before adding new dependencies.

Questions to ask:

- Is this dependency necessary?
- Can we achieve this with existing dependencies?
- What is the bundle size impact?
- Is it actively maintained?
- Does it have security vulnerabilities?

**Run bundle analysis after adding:**

```bash
npm run analyze
```

### 2. Updating Dependencies

**RULE:** Test thoroughly after updating dependencies.

Required steps:

1. ✅ Update dependency
2. ✅ Run `./scripts/checkpoint.sh`
3. ✅ Test affected features manually
4. ✅ Check bundle size (`npm run analyze`)
5. ✅ Commit with clear description

---

## 📝 Commit Standards

### 1. Commit Messages

**RULE:** Follow conventional commit format.

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code change without behavior change
- `test` - Adding tests
- `docs` - Documentation
- `chore` - Maintenance

Examples:

```bash
✅ feat(P2-3): add accessibility support to all forms
✅ fix(auth): resolve race condition in workout increment
✅ refactor(P3-1): migrate edit form to React Hook Form
✅ test(metabolic): add comprehensive calculation tests

❌ "updated stuff"
❌ "fixed bug"
❌ "changes"
```

### 2. Commit Checklist

Before every commit:

- ✅ Run `./scripts/checkpoint.sh` (required)
- ✅ All quality gates pass
- ✅ Changes are complete (no TODO comments in new code)
- ✅ Commit message is descriptive
- ✅ Related files committed together

**Pre-commit hook automatically:**

- ✅ Formats code with Prettier
- ✅ Fixes lint issues
- ✅ Runs type check

---

## 🚀 Deployment Standards

### 1. Environment Configuration

**RULE:** Different environments have different requirements.

**Development:**

- Console logging: Allowed (guarded)
- Type checking: Required
- Tests: Required
- Source maps: Enabled

**Production:**

- Console logging: Disabled (guarded with NODE_ENV)
- HSTS: Enabled
- Error tracking: Monitoring service (when configured)
- Source maps: Disabled (security)

### 2. Pre-deployment Checklist

Before deploying to production:

- ✅ All tests pass (`npm test`)
- ✅ Production build succeeds (`npm run build`)
- ✅ Environment variables configured in Vercel
- ✅ Database migrations applied to production
- ✅ No console.log statements unguarded
- ✅ Security headers configured
- ✅ Health check endpoint working (`/api/health`)

---

## 🛡️ Security Checklist

### Every Code Change Must:

- ✅ Validate ALL user inputs with Zod
- ✅ Use rate limiting for mutations
- ✅ Authenticate with `withAuth()` or `withAuthRateLimited()`
- ✅ Sanitize text inputs (trim, max length)
- ✅ Use parameterized queries (Supabase prevents SQL injection)
- ✅ Never expose sensitive data in errors
- ✅ Never log sensitive data (passwords, tokens)

### Security Red Flags (Reject Immediately):

- 🚨 Raw SQL queries with string concatenation
- 🚨 Disabled CSRF protection
- 🚨 Removed security headers
- 🚨 Hardcoded secrets in code
- 🚨 Exposed environment variables to client
- 🚨 Disabled rate limiting
- 🚨 Type assertions on untrusted input

---

## 📚 Documentation Standards

### 1. Code Comments

**RULE:** Document complex logic, not obvious code.

```typescript
// ✅ CORRECT - Explains WHY
// Recovery HR determines when athlete can return to treadmill.
// Lower percentage = better conditioning = can return at lower HR.
const recoveryHr = maxHr * (recoveryPercent < 85 ? 0.82 : 0.8)

// ❌ INCORRECT - States WHAT (obvious from code)
// Multiply maxHr by 0.82
const recoveryHr = maxHr * 0.82
```

### 2. README Updates

**RULE:** Update README when adding user-facing features or setup steps.

Required sections (keep updated):

- ✅ Features list
- ✅ Setup instructions
- ✅ Environment variables
- ✅ Security headers (testing)
- ✅ Scripts documentation

---

## 🎯 Performance Standards

### 1. Bundle Size Limits

**RULE:** Monitor bundle size and keep under limits.

Limits (gzipped):

- Main bundle: < 200KB
- First Load JS: < 300KB
- Each route: < 50KB

Check with:

```bash
npm run analyze
```

### 2. Optimization Guidelines

**ALWAYS:**

- ✅ Use Server Components for static content
- ✅ Import Lucide icons individually: `import { Icon } from 'lucide-react'`
- ✅ Lazy load heavy components with `dynamic()`
- ✅ Use Next.js Image component for images

**NEVER:**

- ❌ Import entire icon libraries: `import * as Icons from 'lucide-react'`
- ❌ Fetch data client-side when Server Component works
- ❌ Add large dependencies without bundle analysis

---

## 🔄 Git Workflow

### 1. Branch Strategy

**RULE:** Work on feature branches, merge to main when complete.

```bash
# ✅ CORRECT
git checkout -b feat/new-feature
# ... make changes
./scripts/checkpoint.sh  # Must pass
git commit -m "feat: add new feature"

# ❌ INCORRECT - Commit directly to main
git checkout main
git commit -m "changes"
```

### 2. Merge Requirements

**RULE:** All merges to main MUST:

- ✅ Pass all quality gates
- ✅ Have descriptive commit messages
- ✅ Be reviewed (when working with team)
- ✅ Have no failing tests
- ✅ Have no type errors

---

## 🎓 Learning from This Codebase

### Key Patterns to Replicate:

1. **Auth Pattern:** `withAuthRateLimited()` wrapper
2. **Error Pattern:** `ActionResult<T>` for consistent errors
3. **Form Pattern:** React Hook Form + Zod validation
4. **Accessibility Pattern:** aria-busy + sr-only + role=alert
5. **Testing Pattern:** Vitest with comprehensive coverage
6. **Environment Pattern:** Centralized validation in `env.ts`

### Anti-Patterns (Never Replicate):

1. ❌ Manual form state management
2. ❌ Unvalidated user input
3. ❌ Missing cleanup in useEffect
4. ❌ Console logging without guards
5. ❌ Type assertions on untrusted data
6. ❌ Browser native dialogs (alert, confirm, prompt)

---

## 🔍 Code Review Checklist

Before submitting ANY code change, verify:

### Security:

- [ ] All inputs validated with Zod
- [ ] Rate limiting applied to mutations
- [ ] No hardcoded secrets
- [ ] No sensitive data in logs

### Quality:

- [ ] `./scripts/checkpoint.sh` passes
- [ ] Tests written for new functions
- [ ] No console statements unguarded
- [ ] No type assertions on user input

### Accessibility:

- [ ] Loading states have aria-busy + sr-only
- [ ] Error messages have role=alert + aria-live
- [ ] Interactive elements keyboard accessible
- [ ] Form fields have proper labels

### React:

- [ ] Server Components used where possible
- [ ] useEffect has proper dependencies
- [ ] useEffect cleanup present for subscriptions
- [ ] No impure functions during render

### TypeScript:

- [ ] No `any` types
- [ ] No type assertions without validation
- [ ] No `@ts-ignore` comments
- [ ] All errors fixed (not suppressed)

---

## 📞 When in Doubt

### Decision Framework:

1. **Check existing patterns** - Look at similar code in the codebase
2. **Consult this document** - Follow established standards
3. **Run checkpoint** - Verify quality gates
4. **Ask for guidance** - If truly unclear

### References:

- This document: `/docs/AI_CODING_STANDARDS.md`
- Production plan: `/docs/production-readiness-plan.md`
- Performance guide: `/docs/performance.md`
- README: `/README.md`

---

## ⚡ Quick Reference

### Most Common Patterns:

**Server Action:**

```typescript
export async function myAction(formData: FormData): Promise<ActionResult<string>> {
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult

  const validated = MySchema.safeParse({ field: formData.get('field') })
  if (!validated.success) return failure('Invalid input')

  const { error } = await supabase.from('table').insert(validated.data)
  if (error) return failure(error.message)

  revalidatePath('/path')
  return success('result')
}
```

**Form Component:**

```typescript
'use client'
const form = useForm({ resolver: zodResolver(mySchema), defaultValues: {} })

const onSubmit = async (values: FormValues) => {
  const formData = new FormData()
  Object.entries(values).forEach(([k, v]) => formData.set(k, String(v)))

  const result = await myAction(formData)
  if (!result.success) {
    form.setError('root', { message: result.error })
  }
}

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="field" render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <Button type="submit" disabled={form.formState.isSubmitting} aria-busy={form.formState.isSubmitting}>
      {form.formState.isSubmitting && <span className="sr-only">Saving, please wait</span>}
      Submit
    </Button>
  </form>
</Form>
```

**Error Message:**

```typescript
{error && (
  <div role="alert" aria-live="assertive" className="text-red-400 text-sm">
    {error}
  </div>
)}
```

**Console Logging:**

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data)
}
```

---

## 🎯 Summary: The Three Golden Rules

1. **Quality Gates Are Sacred** - `./scripts/checkpoint.sh` MUST pass, no exceptions
2. **Security First** - Validate everything, rate limit mutations, authenticate all actions
3. **Accessibility Always** - aria-busy, sr-only, role=alert on all interactive elements

**Violating these rules is grounds for immediate rejection of any code change.**

---

_This document reflects the production-ready standards established through systematic refactoring and hardening of this codebase. All patterns here have been implemented and tested. Follow them exactly._
