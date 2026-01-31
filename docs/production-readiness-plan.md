# Production Readiness Plan: TreadTrack Frontend

**Document Version:** 1.0  
**Created:** January 31, 2026  
**Status:** Ready for Implementation  
**Estimated Total Effort:** 2-3 weeks

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Quality Gates & Checkpoints](#quality-gates--checkpoints)
3. [Current State Assessment](#current-state-assessment)
4. [Phase 1: Critical Blockers](#phase-1-critical-blockers)
5. [Phase 2: High Priority](#phase-2-high-priority)
6. [Phase 3: Code Quality](#phase-3-code-quality)
7. [Phase 4: Production Hardening](#phase-4-production-hardening)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### Current Status: 60-70% Production Ready

The codebase demonstrates solid architectural foundations with modern Next.js patterns, but contains **7 critical production blockers** and **12 high-priority issues** that must be resolved before deployment.

### Key Findings

- ✅ **Strengths:** Good type generation, helper abstractions, security header foundation
- ❌ **Critical:** Memory leaks, race conditions, broken rate limiting, unsafe validation
- ⚠️ **Concern:** Previous refactoring incomplete; documentation overstates completion

### Timeline

| Phase | Duration | Completion Criteria |
|-------|----------|-------------------|
| Phase 1: Critical Blockers | 2-3 days | All 🔴 items resolved, no known data corruption risks |
| Phase 2: High Priority | 3-5 days | Security hardened, consistent patterns |
| Phase 3: Code Quality | 1-2 weeks | Test coverage >70%, consistent patterns |
| Phase 4: Production Hardening | Ongoing | Monitoring, optimization, maintenance |

---

## Quality Gates & Checkpoints

### 🚨 CRITICAL: No Workarounds or Bandage Fixes

**ABSOLUTE REQUIREMENTS:**

1. **Every change MUST pass ALL quality checks before proceeding**
2. **NO suppressing linting errors with comments** (`// eslint-disable`, `// @ts-ignore`, etc.)
3. **NO type assertions to bypass errors** (no `as any`, no `as unknown as Type`)
4. **NO temporary "fixes" that mask underlying issues**
5. **If a check fails, FIX THE ROOT CAUSE, not the symptom**

**If you cannot fix something properly, STOP and reassess the approach.**

---

### Checkpoint System

After **EVERY** code change, run this validation sequence:

```bash
# Checkpoint Script - Run after EVERY change
#!/bin/bash
set -e  # Exit on any error

echo "🔍 Running Quality Checks..."
echo ""

echo "1️⃣  Type Checking..."
npm run type-check || {
  echo "❌ Type check failed"
  echo "Fix TypeScript errors. No workarounds allowed."
  exit 1
}
echo "✅ Type check passed"
echo ""

echo "2️⃣  Linting..."
npm run lint || {
  echo "❌ Lint failed"
  echo "Fix ESLint errors. No suppression comments allowed."
  exit 1
}
echo "✅ Lint passed"
echo ""

echo "3️⃣  Building..."
npm run build || {
  echo "❌ Build failed"
  echo "Fix build errors. No workarounds allowed."
  exit 1
}
echo "✅ Build passed"
echo ""

echo "4️⃣  Tests (when available)..."
npm run test 2>/dev/null || {
  echo "⚠️  Tests not yet configured (acceptable during Phase 1-2)"
}
echo ""

echo "✅ All quality checks passed!"
echo "Safe to proceed to next task."
```

**Save this as:** `scripts/checkpoint.sh`

**Make executable:** `chmod +x scripts/checkpoint.sh`

**Run after EVERY change:** `./scripts/checkpoint.sh`

---

### Mandatory Checks Per Phase

#### Phase 1: Critical Blockers

After **each** P1 task:
- [ ] `npm run type-check` - MUST pass with zero errors
- [ ] `npm run lint` - MUST pass with zero errors/warnings
- [ ] `npm run build` - MUST complete successfully
- [ ] Manual testing of affected feature - MUST work as expected
- [ ] Git commit with descriptive message
- [ ] NO suppressed errors or type assertions added

#### Phase 2: High Priority

After **each** P2 task:
- [ ] All Phase 1 checks PLUS:
- [ ] Browser console - NO errors in dev or production mode
- [ ] Lighthouse accessibility audit - NO new violations
- [ ] Manual testing of affected feature with keyboard only
- [ ] Git commit with descriptive message

#### Phase 3: Code Quality

After **each** P3 task:
- [ ] All Phase 1 & 2 checks PLUS:
- [ ] `npm run test` - MUST pass with target coverage
- [ ] `npm run test:e2e` - MUST pass (when available)
- [ ] Code review self-check against SOLID principles
- [ ] Git commit with descriptive message

#### Phase 4: Production Hardening

After **each** P4 task:
- [ ] All previous checks PLUS:
- [ ] Performance regression check (Lighthouse)
- [ ] Bundle size check (no unexpected increases)
- [ ] Production build deployment test
- [ ] Git commit with descriptive message

---

### Forbidden Practices

**NEVER do these things to make checks pass:**

```typescript
// ❌ FORBIDDEN: Suppressing ESLint
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = response as any

// ❌ FORBIDDEN: TypeScript ignore
// @ts-ignore
const result = dangerousOperation()

// ❌ FORBIDDEN: Type assertion to bypass error
const value = formData.get('field') as string  // Could be null!

// ❌ FORBIDDEN: Disabling strict null checks
// @ts-expect-error
const user = maybeUser.name

// ❌ FORBIDDEN: Empty dependencies to silence warning
useEffect(() => {
  doSomething(prop)
}, [])  // eslint-disable-line react-hooks/exhaustive-deps

// ❌ FORBIDDEN: Any type to bypass validation
function process(data: any) {  // Use proper types!
  return data.something
}
```

**Instead, fix the root cause:**

```typescript
// ✅ CORRECT: Proper validation
const rawValue = formData.get('field')
const validated = schema.safeParse(rawValue)
if (!validated.success) {
  return failure('Invalid input')
}
const value = validated.data

// ✅ CORRECT: Proper null handling
const user = await getUser()
if (!user) {
  return failure('User not found')
}
const name = user.name

// ✅ CORRECT: Proper dependencies with useCallback
const handleChange = useCallback(() => {
  doSomething(prop)
}, [prop])

useEffect(() => {
  handleChange()
}, [handleChange])

// ✅ CORRECT: Proper typing
interface ProcessInput {
  something: string
}

function process(data: ProcessInput) {
  return data.something
}
```

---

### Rollback Strategy

If a change breaks quality checks and cannot be fixed properly:

1. **STOP immediately**
2. **Git stash or reset** the change
3. **Document the blocker** in a GitHub issue
4. **Reassess approach** - is there a better pattern?
5. **Get team input** if needed
6. **Start over** with a different approach

**Never compromise quality to move forward faster.**

---

### Continuous Validation

**During development:**
```bash
# Watch mode for continuous type checking
npm run type-check -- --watch

# Watch mode for continuous linting
npm run lint -- --watch

# Run dev server with strict checks
npm run dev
```

**Before any commit:**
```bash
# Run full checkpoint
./scripts/checkpoint.sh

# If passes, commit
git add .
git commit -m "feat(P1-1): fix memory leak in subscriptions"

# If fails, fix issues before committing
```

**Before any PR:**
```bash
# Full validation suite
npm run type-check
npm run lint
npm run build
npm run test        # when available
npm run test:e2e    # when available

# All must pass before PR creation
```

---

### Success Criteria for Each Task

Every task in this plan has **Acceptance Criteria**. ALL criteria must be met:

- ✅ **Technical requirements** - Code works correctly
- ✅ **Quality checks** - Lint, type-check, build all pass
- ✅ **Testing** - Manual and automated tests pass
- ✅ **Documentation** - Code is clear and documented
- ✅ **No workarounds** - No bandage fixes or suppressions

**If even ONE criterion is not met, the task is NOT complete.**

---

## Current State Assessment

### Architecture Quality: Good ✓

- Next.js 16 App Router with Server Components
- Supabase for database, auth, and real-time
- TypeScript strict mode enabled
- Modern React patterns (Server Actions, Suspense)

### Code Quality: Mixed ⚠️

**Well-Implemented:**
- Helper functions (`withAuth`, `ActionResult`, `retry`, `metabolic`)
- Database type generation
- Real-time subscription setup
- Security headers foundation

**Problematic:**
- Inconsistent use of helper functions (only 60% adoption)
- Mixed error handling patterns
- Incomplete validation
- Infrastructure unsuitable for serverless

### Production Readiness Score

```
Type Safety:        ████████░░ 70% - Unsafe parsing, unvalidated FormData
Authentication:     ███████░░░ 65% - Mixed patterns, inconsistent
Error Handling:     ████████░░ 75% - Good patterns exist, incomplete adoption
Rate Limiting:      ██░░░░░░░░ 15% - Broken for serverless (critical)
Data Integrity:     ██████░░░░ 55% - Race conditions in critical paths
Memory Management:  ████░░░░░░ 35% - Known memory leak (critical)
Security:           ███████░░░ 65% - Missing CSP, rate limiting broken
Accessibility:      ██████░░░░ 55% - Missing ARIA, keyboard nav gaps
Code Consistency:   ██████░░░░ 60% - Refactoring incomplete
Testing:            ░░░░░░░░░░  0% - No test infrastructure
```

**Overall: 55%** - Not production ready

---

## Phase 1: Critical Blockers

**Duration:** 2-3 days  
**Goal:** Eliminate data corruption and stability risks

### 🔴 P1-1: Fix Memory Leak in Real-Time Subscriptions

**File:** `src/app/(dashboard)/sessions/group/group-session-manager.tsx:139`

**Problem:**
```typescript
useEffect(() => {
  const channel = supabase.channel('workout_sessions')
    .on('postgres_changes', { ... }, refreshWorkouts)
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, []) // ❌ MISSING: supabase, refreshWorkouts
```

**Impact:** Stale closures, potential memory leaks, incorrect subscription behavior

**Solution:**

**Option A: Add dependencies (recommended)**
```typescript
const refreshWorkouts = useCallback(async () => {
  const { data } = await supabase
    .from('workout_sessions')
    .select(/* ... */)
  
  if (data) {
    setWorkouts(formatWorkouts(data))
  }
}, [supabase]) // supabase is stable from createBrowserClient

useEffect(() => {
  const channel = supabase.channel('workout_sessions')
    .on('postgres_changes', { ... }, refreshWorkouts)
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [supabase, refreshWorkouts])
```

**Option B: Inline the function**
```typescript
useEffect(() => {
  const handleChange = async () => {
    const { data } = await supabase
      .from('workout_sessions')
      .select(/* ... */)
    
    if (data) {
      setWorkouts(formatWorkouts(data))
    }
  }
  
  const channel = supabase.channel('workout_sessions')
    .on('postgres_changes', { ... }, handleChange)
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [supabase])
```

**Acceptance Criteria:**
- [ ] ESLint exhaustive-deps warning resolved
- [ ] Subscription updates correctly when dependencies change
- [ ] No memory leaks in dev tools profiler
- [ ] Test: Keep component mounted for 5+ minutes, check memory

**Checkpoint: Before Proceeding**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass (no exhaustive-deps warnings)
# ✅ Build must pass
# ✅ Dev server runs without errors
# ✅ Browser console shows no errors
# ✅ Manual test: Real-time updates work correctly
```

**Git Commit:**
```bash
git add src/app/(dashboard)/sessions/group/group-session-manager.tsx
git commit -m "fix(P1-1): resolve memory leak in group session real-time subscriptions

- Add useCallback for refreshWorkouts with proper dependencies
- Add supabase and refreshWorkouts to useEffect deps
- Verify with Chrome DevTools profiler (no leaks after 5 min)
- All quality checks pass"
```

**Also Check:**
- `src/app/(dashboard)/workouts/session/[id]/realtime-session.tsx`
- `src/app/(dashboard)/pretests/session/[id]/realtime-pretest.tsx`

---

### 🔴 P1-2: Fix Race Condition in Workout Completion

**Files:**
- `src/app/(dashboard)/workouts/actions.ts:167-189` (completeWorkout)
- `src/app/(dashboard)/sessions/group/actions.ts:199-213` (logExerciseResult)

**Problem:**
```typescript
// Read
const { data: workout } = await supabase
  .from('program_workouts')
  .select('workout_number')
  .eq('id', session.program_workout_id)
  .single()

// Then write (NON-ATOMIC!)
await supabase
  .from('athlete_programs')
  .update({ current_workout_number: workout.workout_number + 1 })
  .eq('id', session.athlete_program_id)
```

**Impact:** Concurrent completions can corrupt `current_workout_number`, causing athletes to skip workouts or repeat them

**Solution:**

**Option A: Use PostgreSQL atomic increment (recommended)**
```typescript
// In migration: Add RPC function
CREATE OR REPLACE FUNCTION increment_workout_number(
  p_athlete_program_id UUID,
  p_session_id UUID
) RETURNS void AS $$
BEGIN
  -- Verify session belongs to program
  IF EXISTS (
    SELECT 1 FROM workout_sessions 
    WHERE id = p_session_id 
    AND athlete_program_id = p_athlete_program_id
  ) THEN
    -- Atomically increment
    UPDATE athlete_programs
    SET current_workout_number = COALESCE(current_workout_number, 1) + 1
    WHERE id = p_athlete_program_id;
  ELSE
    RAISE EXCEPTION 'Session does not belong to program';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
// In action
const { error } = await supabase.rpc('increment_workout_number', {
  p_athlete_program_id: session.athlete_program_id,
  p_session_id: sessionId
})

if (error) {
  return failure('Failed to update workout progress: ' + error.message)
}
```

**Option B: Use database trigger (alternative)**
```sql
-- Trigger on workout_sessions.status change to 'completed'
CREATE TRIGGER increment_workout_on_complete
AFTER UPDATE OF status ON workout_sessions
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status = 'in_progress')
EXECUTE FUNCTION increment_athlete_workout_number();
```

**Acceptance Criteria:**
- [ ] Create migration file: `005_atomic_workout_increment.sql`
- [ ] Implement RPC function with security definer
- [ ] Update both `completeWorkout` and `logExerciseResult` actions
- [ ] Test: Complete same workout twice simultaneously (should handle gracefully)
- [ ] Verify: `current_workout_number` always accurate after concurrent operations

**Checkpoint: Before Proceeding**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass
# ✅ Migration applies cleanly
# ✅ RPC function executes without errors
# ✅ Manual test: Concurrent completions work correctly
# ✅ Verify in database: workout numbers are sequential with no gaps
```

**Git Commit:**
```bash
git add supabase/migrations/005_atomic_workout_increment.sql
git add src/app/(dashboard)/workouts/actions.ts
git add src/app/(dashboard)/sessions/group/actions.ts
git commit -m "fix(P1-2): eliminate race condition in workout completion

- Add atomic RPC function increment_workout_number
- Replace read-then-write pattern with atomic increment
- Add security definer for proper permissions
- Test concurrent completions (verified no corruption)
- All quality checks pass"
```

---

### 🔴 P1-3: Fix Unsafe Zod Parsing

**File:** `src/app/(dashboard)/pretests/actions.ts:144-148`

**Problem:**
```typescript
const hrSchema = z.coerce.number().int().min(40).max(250).optional()
const atHrNum = atHrRaw ? hrSchema.safeParse(atHrRaw).data ?? null : null
//                                                   ^^^^ undefined if parse fails!
```

**Impact:** Invalid heart rate data silently becomes `null`, corrupting metabolic calculations used for program assignments

**Solution:**
```typescript
// Option A: Check success explicitly
const hrSchema = z.coerce.number().int().min(40).max(250).optional()

let atHrNum: number | null = null
if (atHrRaw) {
  const parsed = hrSchema.safeParse(atHrRaw)
  if (!parsed.success) {
    return failure('Invalid AT heart rate: must be between 40 and 250 bpm')
  }
  atHrNum = parsed.data ?? null
}

// Option B: Use full schema validation (recommended)
const CompleteMetabolicSchema = z.object({
  session_id: z.string().uuid(),
  at_hr: z.coerce.number().int().min(40).max(250).optional().nullable(),
  max_hr: z.coerce.number().int().min(40).max(250),
  recovery_hr: z.coerce.number().int().min(40).max(250).optional().nullable(),
  vo2_max: z.coerce.number().positive().optional().nullable(),
  recovery_at_percent: z.coerce.number().min(0).max(100).optional().nullable(),
  is_exceptionally_fit: z.boolean().optional().default(false),
})

// Then use it
const validated = CompleteMetabolicSchema.safeParse({
  session_id: formData.get('session_id'),
  at_hr: formData.get('at_hr'),
  max_hr: formData.get('max_hr'),
  recovery_hr: formData.get('recovery_hr'),
  vo2_max: formData.get('vo2_max'),
  recovery_at_percent: formData.get('recovery_at_percent'),
  is_exceptionally_fit: formData.get('is_exceptionally_fit') === 'true',
})

if (!validated.success) {
  const errors = validated.error.flatten()
  const firstError = Object.values(errors.fieldErrors).flat()[0] || 'Invalid input'
  return failure(firstError, errors.fieldErrors)
}

const { at_hr, max_hr, recovery_hr, vo2_max, recovery_at_percent, is_exceptionally_fit } = validated.data
```

**Acceptance Criteria:**
- [ ] All Zod `safeParse()` calls check `.success` before accessing `.data`
- [ ] Full schema validation for `completePretest` function
- [ ] Test: Submit invalid heart rate values (negative, >250, non-numeric)
- [ ] Verify: Clear error messages for validation failures
- [ ] Scan codebase: `rg "safeParse.*\.data" --type ts` returns zero unsafe usages

**Checkpoint: Before Proceeding**
```bash
# Run quality checks
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Verify no unsafe patterns remain
rg "safeParse.*\.data" --type ts src/
# ✅ Should return ZERO results

# Manual testing
# ✅ Submit form with invalid heart rate (-5) → Should show error
# ✅ Submit form with invalid heart rate (300) → Should show error
# ✅ Submit form with non-numeric value → Should show error
# ✅ Submit form with valid values → Should succeed
```

**Git Commit:**
```bash
git add src/app/(dashboard)/pretests/actions.ts
git add src/lib/validations/actions.ts  # if created
git commit -m "fix(P1-3): fix unsafe Zod parsing in pretest actions

- Check .success before accessing .data in all safeParse calls
- Add comprehensive CompleteMetabolicSchema validation
- Add proper error handling with clear messages
- Verify with tests (invalid inputs properly rejected)
- Scan confirms no unsafe patterns remain
- All quality checks pass"
```

**Also Check:**
- Any other `safeParse` usage in the codebase
- All FormData extraction should use schema validation

---

### 🔴 P1-4: Validate All FormData Inputs

**File:** `src/app/(dashboard)/pretests/actions.ts:131-135`

**Problem:**
```typescript
const sessionId = formData.get('session_id') as string
const atHrRaw = formData.get('at_hr') as string
// Type assertions bypass validation - could be null!
```

**Impact:** Runtime errors if FormData fields are missing

**Solution:**

Create validation schemas for ALL server actions:

```typescript
// src/lib/validations/actions.ts
import { z } from 'zod'

export const CompleteMetabolicTestSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  at_hr: z.string().optional().transform(s => s ? Number(s) : null),
  max_hr: z.string().min(1, 'Max heart rate is required').transform(Number),
  recovery_hr: z.string().optional().transform(s => s ? Number(s) : null),
  vo2_max: z.string().optional().transform(s => s ? Number(s) : null),
  recovery_at_percent: z.string().optional().transform(s => s ? Number(s) : null),
  is_exceptionally_fit: z.string().optional().transform(s => s === 'true'),
}).refine(
  (data) => data.max_hr >= 40 && data.max_hr <= 250,
  { message: 'Max heart rate must be between 40 and 250 bpm', path: ['max_hr'] }
).refine(
  (data) => !data.at_hr || (data.at_hr >= 40 && data.at_hr <= 250),
  { message: 'AT heart rate must be between 40 and 250 bpm', path: ['at_hr'] }
)
```

**Acceptance Criteria:**
- [ ] Remove ALL `as string` assertions from server actions
- [ ] Create comprehensive Zod schemas in `src/lib/validations/actions.ts`
- [ ] All FormData extraction uses schema validation
- [ ] Test: Submit forms with missing fields
- [ ] Verify: Clear error messages for all validation failures

**Checkpoint: Before Proceeding**
```bash
# Run quality checks
./scripts/checkpoint.sh
# ✅ Type check must pass (no type errors from removed assertions)
# ✅ Lint must pass
# ✅ Build must pass

# Verify no unsafe patterns remain
rg "as string" --type ts src/app
# ✅ Should return only safe usages (constants, known-safe transforms)

rg "as number" --type ts src/app
# ✅ Should return zero results in FormData handling

# Manual testing each affected form
# ✅ Submit with missing required fields → Proper error
# ✅ Submit with invalid data types → Proper error
# ✅ Submit with valid data → Success
```

**Git Commit:**
```bash
git add src/lib/validations/actions.ts
git add src/app/(dashboard)/*/actions.ts
git commit -m "fix(P1-4): validate all FormData inputs with Zod schemas

- Remove all 'as string' type assertions
- Create centralized validation schemas
- Add proper error handling for missing/invalid fields
- Test all affected forms (manual validation passed)
- Scan confirms no unsafe assertions remain
- All quality checks pass"
```

**Files to Update:**
- `src/app/(dashboard)/pretests/actions.ts`
- `src/app/(dashboard)/athletes/actions.ts` (check for other instances)
- `src/app/(dashboard)/workouts/actions.ts` (check for other instances)
- `src/app/(dashboard)/sessions/group/actions.ts` (check for other instances)

---

### 🔴 P1-5: Implement Redis-Based Rate Limiting

**File:** `src/lib/rate-limit.ts`

**Problem:** In-memory rate limiting won't work in serverless/multi-instance deployments

**Impact:** No rate limiting in production, vulnerable to abuse and DoS attacks

**Solution:**

**Step 1: Add Upstash Redis**
```bash
npm install @upstash/redis @upstash/ratelimit
```

**Step 2: Create Redis rate limiter**
```typescript
// src/lib/rate-limit-redis.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiters with different configurations
export const rateLimitStandard = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: true,
  prefix: '@ratelimit/standard',
})

export const rateLimitSensitive = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: '@ratelimit/sensitive',
})

export const rateLimitExpensive = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '300 s'),
  analytics: true,
  prefix: '@ratelimit/expensive',
})

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  retryAfter: number
}

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit = rateLimitStandard
): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  
  return {
    success,
    remaining,
    reset,
    retryAfter: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
  }
}
```

**Step 3: Update auth helpers**
```typescript
// src/lib/supabase/auth.ts
import { checkRateLimit, rateLimitStandard, type RateLimitResult } from '@/lib/rate-limit-redis'
import type { Ratelimit } from '@upstash/ratelimit'

export async function withAuthRateLimited(limiter: Ratelimit = rateLimitStandard) {
  try {
    const result = await getCurrentTrainer()
    
    // Apply rate limiting based on user ID
    const rateLimitResult = await checkRateLimit(result.user.id, limiter)
    
    if (!rateLimitResult.success) {
      return failure(
        `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`
      )
    }
    
    return { success: true as const, data: result }
  } catch (error) {
    // ... existing error handling
  }
}
```

**Step 4: Add environment variables**
```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

**Step 5: Fallback strategy**
```typescript
// src/lib/rate-limit-redis.ts
import { rateLimit as rateLimitMemory } from './rate-limit'

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit = rateLimitStandard
): Promise<RateLimitResult> {
  // Fallback to in-memory if Redis not configured (dev only)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Redis rate limiting must be configured for production')
    }
    console.warn('Using in-memory rate limiting (dev only)')
    return rateLimitMemory(identifier, { limit: 30, windowSeconds: 60 })
  }
  
  // Use Redis
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  
  return {
    success,
    remaining,
    reset,
    retryAfter: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
  }
}
```

**Acceptance Criteria:**
- [ ] Upstash Redis account created
- [ ] Environment variables configured
- [ ] `withAuthRateLimited` uses Redis
- [ ] Test: Rate limit works across multiple instances
- [ ] Test: Fallback to in-memory in dev without Redis
- [ ] Error thrown if Redis missing in production

**Checkpoint: Before Proceeding**
```bash
# Run quality checks
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Verify environment
# ✅ UPSTASH_REDIS_REST_URL is set
# ✅ UPSTASH_REDIS_REST_TOKEN is set

# Test Redis connection
node -e "
const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
redis.ping().then(r => console.log('✅ Redis connected:', r));
"

# Manual testing
# ✅ Make 31 requests rapidly → 31st should be rate limited
# ✅ Wait 60 seconds → Next request should succeed
# ✅ Dev without Redis → Falls back to in-memory (warning logged)
# ✅ Production without Redis → Throws error (app won't start)
```

**Git Commit:**
```bash
git add src/lib/rate-limit-redis.ts
git add src/lib/supabase/auth.ts
git add package.json package-lock.json
git add .env.example
git commit -m "feat(P1-5): implement Redis-based rate limiting

- Add Upstash Redis for serverless-compatible rate limiting
- Replace in-memory implementation with distributed solution
- Add fallback to in-memory for local dev
- Add production validation (fails fast if Redis missing)
- Test rate limiting across multiple instances (verified)
- All quality checks pass"
```

**Cost:** Upstash free tier: 10,000 requests/day (sufficient for MVP)

---

### 🔴 P1-6: Add Content-Security-Policy Header

**File:** `next.config.ts`

**Problem:** Missing CSP leaves app vulnerable to XSS attacks

**Solution:**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        // Existing headers
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        // NEW: Content Security Policy
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval & inline
            "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
            "img-src 'self' data: https:", // Allow data URIs and HTTPS images
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co", // Supabase API + realtime
            "frame-ancestors 'none'", // Equivalent to X-Frame-Options: DENY
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; '),
        },
        // NEW: Strict-Transport-Security (HSTS) for production
        ...(process.env.NODE_ENV === 'production' ? [{
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        }] : []),
      ],
    },
  ],
  
  // ... rest of config
}
```

**Testing CSP:**
```typescript
// Test violations are reported to console
// Check browser console for CSP violations during testing
```

**Acceptance Criteria:**
- [ ] CSP header configured in `next.config.ts`
- [ ] All Supabase domains included in `connect-src`
- [ ] Test: App functions normally with CSP enabled
- [ ] Test: Check browser console for CSP violations
- [ ] HSTS enabled in production only
- [ ] Document: CSP policy in README

**Checkpoint: Before Proceeding**
```bash
# Run quality checks
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Test CSP in development
npm run dev
# Open browser to http://localhost:3000
# Open DevTools Console → Check for CSP violations
# ✅ No CSP violations should appear
# ✅ All features work (auth, real-time, forms)

# Test production build
npm run build
npm run start
# Open browser to http://localhost:3000
# ✅ No CSP violations in console
# ✅ All features work in production mode

# Verify headers are sent
curl -I http://localhost:3000 | grep -i "content-security-policy"
# ✅ Should show CSP header

curl -I http://localhost:3000 | grep -i "strict-transport-security"
# ⚠️ Should NOT show HSTS in dev (only production)
```

**Git Commit:**
```bash
git add next.config.ts
git add README.md  # if documented
git commit -m "feat(P1-6): add Content-Security-Policy and HSTS headers

- Configure CSP with appropriate directives for Next.js + Supabase
- Add HSTS for production only
- Verify no CSP violations in browser console
- Test all features work with CSP enabled
- Document security headers in README
- All quality checks pass"
```

---

### 🔴 P1-7: Standardize Authentication Pattern

**Files to Update:**
- `src/app/(dashboard)/athletes/actions.ts:59, 107, 158, 245`
- Any other actions using manual auth

**Problem:** Inconsistent auth patterns create security risks and maintenance burden

**Current (Incorrect) Pattern:**
```typescript
export async function createAthlete(
  prevState: AthleteFormState,
  formData: FormData
): Promise<AthleteFormState> {
  const supabase = await createClient()
  
  // Manual auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { errors: { _form: ['You must be logged in'] } }
  }
  
  // ... rest of function
}
```

**Solution:**

**Step 1: Migrate to ActionResult pattern**
```typescript
// ❌ OLD: AthleteFormState
export async function createAthlete(
  prevState: AthleteFormState,
  formData: FormData
): Promise<AthleteFormState>

// ✅ NEW: ActionResult<string> (returns athlete ID)
export async function createAthlete(
  formData: FormData
): Promise<ActionResult<string>>
```

**Step 2: Use withAuthRateLimited**
```typescript
export async function createAthlete(
  formData: FormData
): Promise<ActionResult<string>> {
  // Standard auth + rate limiting
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult
  const { supabase, trainer } = authResult.data
  
  // Validate input
  const validated = AthleteSchema.safeParse({
    name: formData.get('name'),
    gender: formData.get('gender'),
    sport: formData.get('sport') || null,
    position: formData.get('position') || null,
    birth_date: formData.get('birth_date') || null,
    head_size: formData.get('head_size') || null,
    chest_size: formData.get('chest_size') || null,
    notes: formData.get('notes') || null,
  })
  
  if (!validated.success) {
    const errors = validated.error.flatten()
    const firstError = Object.values(errors.fieldErrors).flat()[0] || 'Invalid input'
    return failure(firstError, errors.fieldErrors)
  }
  
  // Insert athlete
  const { data, error } = await supabase
    .from('athletes')
    .insert(validated.data)
    .select('id')
    .single()
  
  if (error) {
    return failure('Failed to create athlete: ' + error.message)
  }
  
  revalidatePath('/athletes')
  revalidatePath(`/athletes/${data.id}`)
  return success(data.id) // Return athlete ID for redirect
}
```

**Step 3: Update form components**
```typescript
// OLD: useActionState
const [state, formAction] = useActionState(createAthlete, { errors: {} })

// NEW: useTransition with toast
const [isPending, startTransition] = useTransition()

const handleSubmit = async (formData: FormData) => {
  startTransition(async () => {
    const result = await createAthlete(formData)
    
    if (result.success) {
      toast.success('Athlete created successfully')
      router.push(`/athletes/${result.data}`) // Use returned ID
    } else {
      toast.error(result.error)
      // Handle field errors if needed
    }
  })
}
```

**Files Requiring Migration:**
1. `createAthlete` - lines 55-100
2. `updateAthlete` - lines 102-155
3. `deleteAthlete` - lines 158-190 (already close, just standardize auth)
4. `updateProgramStatus` - lines 245-265 (already close, just standardize auth)

**Acceptance Criteria:**
- [ ] All server actions use `withAuth()` or `withAuthRateLimited()`
- [ ] Zero manual `createClient()` + `getUser()` patterns
- [ ] All actions return `ActionResult<T>` (except those with redirect)
- [ ] Remove `AthleteFormState` type (no longer needed)
- [ ] Test: All affected forms still work correctly
- [ ] Scan: `rg "createClient\(\)" src/app/(dashboard)` only in actions that already use withAuth

**Checkpoint: Before Proceeding**
```bash
# Run quality checks
./scripts/checkpoint.sh
# ✅ Type check must pass (no errors from removed types)
# ✅ Lint must pass
# ✅ Build must pass

# Verify standardization
rg "createClient.*getUser" --type ts src/app/(dashboard)
# ✅ Should return ZERO results

rg "as any" --type ts src/app/(dashboard)/athletes/actions.ts
# ✅ Should return ZERO results in this file

rg "AthleteFormState" --type ts src/
# ✅ Should return ZERO results (type removed)

# Manual testing - Test EACH affected form
# ✅ Create athlete form → Works correctly
# ✅ Edit athlete form → Works correctly  
# ✅ Delete athlete → Works correctly
# ✅ Update program status → Works correctly
# ✅ Error messages display properly
# ✅ Rate limiting triggers after 30 requests
```

**Git Commit:**
```bash
git add src/app/(dashboard)/athletes/actions.ts
git add src/app/(dashboard)/athletes/[id]/edit/page.tsx  # if form updated
git add src/app/(dashboard)/athletes/new/page.tsx  # if form updated
git commit -m "refactor(P1-7): standardize auth pattern in athlete actions

- Replace manual auth with withAuth/withAuthRateLimited
- Migrate createAthlete to ActionResult pattern
- Migrate updateAthlete to ActionResult pattern
- Remove AthleteFormState type (no longer needed)
- Update form components to use new patterns
- Test all affected forms (manual validation passed)
- Scan confirms no manual auth patterns remain
- All quality checks pass"
```

---

## Phase 2: High Priority

**Duration:** 3-5 days  
**Goal:** Security hardening and consistency

### 🟠 P2-1: Apply Rate Limiting to All Actions

**Current State:** Only `assignProgram` has rate limiting

**Actions Requiring Rate Limiting:**

**Sensitive Operations (5 req/min):**
- Auth-related operations (if any custom ones added)

**Standard Operations (30 req/min):**
- `createAthlete`, `updateAthlete`, `deleteAthlete`
- `startWorkout`, `completeWorkout`, `cancelWorkout`
- `startPretest`, `completePretest`, `recordStepResult`
- `startWorkoutForGroup`, `logExerciseResult`
- `updateTrainerProfile`

**Expensive Operations (10 req/5min):**
- Bulk operations (if any)
- Report generation (if added)

**Implementation:**
```typescript
// Simply replace withAuth() with withAuthRateLimited()

// Before
const authResult = await withAuth()

// After
const authResult = await withAuthRateLimited()

// Or with custom limits
const authResult = await withAuthRateLimited(rateLimitSensitive)
```

**Acceptance Criteria:**
- [ ] All mutation server actions have rate limiting
- [ ] Read-only operations can use `withAuth()` (no rate limit needed)
- [ ] Test: Verify rate limits trigger correctly
- [ ] Document: Rate limit configuration in README

**Checkpoint: Before Proceeding**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Verify rate limiting applied
rg "withAuth\(\)" --type ts src/app/(dashboard) | grep "export async function" | wc -l
# ✅ Count should match expected mutation actions

# Manual testing
# ✅ Test createAthlete rate limit (31st request blocked)
# ✅ Test startWorkout rate limit (31st request blocked)
# ✅ Read operations NOT rate limited (can exceed 30/min)
```

**Git Commit:**
```bash
git add src/app/(dashboard)/*/actions.ts
git commit -m "feat(P2-1): apply rate limiting to all mutation actions

- Add withAuthRateLimited to all create/update/delete actions
- Leave read-only operations with withAuth (no rate limit)
- Test rate limiting on multiple actions (verified)
- Document rate limit configuration in README
- All quality checks pass"
```

**Estimated Effort:** 2-3 hours (simple find-replace in most cases)

---

### 🟠 P2-2: Add Missing Error Boundaries

**Missing:**
- `src/app/(dashboard)/settings/error.tsx`
- `src/app/(dashboard)/pretests/new/error.tsx`
- `src/app/(dashboard)/workouts/new/error.tsx`

**Template:**
```typescript
// src/app/(dashboard)/settings/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Settings page error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Failed to load settings page. Please try again or contact support if the problem persists.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-2">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] All routes have error boundaries
- [ ] Consistent error UI across all boundaries
- [ ] Error logging in development only
- [ ] Test: Throw error in each route, verify boundary catches it

**Checkpoint: Before Proceeding**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Verify all boundaries exist
ls src/app/(dashboard)/settings/error.tsx
ls src/app/(dashboard)/pretests/new/error.tsx
ls src/app/(dashboard)/workouts/new/error.tsx
# ✅ All files should exist

# Manual testing
# ✅ Throw error in settings page → Boundary catches it
# ✅ Throw error in pretest form → Boundary catches it
# ✅ Throw error in workout form → Boundary catches it
# ✅ Console shows error in dev only (not in prod build)
```

**Git Commit:**
```bash
git add src/app/(dashboard)/settings/error.tsx
git add src/app/(dashboard)/pretests/new/error.tsx
git add src/app/(dashboard)/workouts/new/error.tsx
git commit -m "feat(P2-2): add missing error boundaries

- Add error boundary for settings page
- Add error boundary for pretest form page
- Add error boundary for workout form page
- Consistent UI with existing boundaries
- Test all boundaries catch errors correctly
- All quality checks pass"
```

**Estimated Effort:** 1 hour

---

### 🟠 P2-3: Fix Accessibility Violations

**Critical Issues:**

1. **Missing ARIA labels on interactive elements**
2. **Missing keyboard navigation**
3. **Missing focus management**
4. **No screen reader announcements**

**Implementation Guide:**

**Issue 1: Select components missing labels**
```typescript
// src/app/(dashboard)/athletes/[id]/assign-program-form.tsx

// Before
<Select onValueChange={field.onChange} value={field.value}>
  <SelectTrigger>
    <SelectValue placeholder="Select a program" />
  </SelectTrigger>
  {/* ... */}
</Select>

// After
<FormItem>
  <FormLabel htmlFor="program-select">Training Program</FormLabel>
  <Select onValueChange={field.onChange} value={field.value}>
    <SelectTrigger id="program-select" aria-label="Select training program">
      <SelectValue placeholder="Select a program" />
    </SelectTrigger>
    {/* ... */}
  </Select>
  <FormDescription>Choose the appropriate program based on pre-test results</FormDescription>
  <FormMessage />
</FormItem>
```

**Issue 2: Speed buttons missing keyboard handlers**
```typescript
// src/app/(dashboard)/sessions/group/athlete-workout-card.tsx

// Before
<button
  onClick={() => setSelectedSpeed(col as 1 | 2 | 3)}
  className={/* ... */}
>
  {speed}
</button>

// After
<button
  onClick={() => setSelectedSpeed(col as 1 | 2 | 3)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelectedSpeed(col as 1 | 2 | 3)
    }
  }}
  aria-pressed={selectedSpeed === col}
  aria-label={`Select speed column ${col}: ${speed} mph`}
  className={/* ... */}
>
  {speed}
</button>
```

**Issue 3: Form errors not announced**
```typescript
// Add to all forms with validation errors

// Before
{error && <p className="text-sm text-red-500">{error}</p>}

// After
{error && (
  <p 
    className="text-sm text-red-500" 
    role="alert" 
    aria-live="assertive"
  >
    {error}
  </p>
)}
```

**Issue 4: Loading states not announced**
```typescript
// Add to forms during submission

// Before
<Button disabled={isPending}>
  {isPending ? 'Saving...' : 'Save'}
</Button>

// After
<Button disabled={isPending} aria-busy={isPending}>
  {isPending && <span className="sr-only">Saving, please wait</span>}
  {isPending ? 'Saving...' : 'Save'}
</Button>
```

**Acceptance Criteria:**
- [ ] All interactive elements have proper ARIA labels
- [ ] Keyboard navigation works for all buttons
- [ ] Form errors announced to screen readers
- [ ] Loading states announced to screen readers
- [ ] Test: Navigate entire app with keyboard only
- [ ] Test: Use screen reader (VoiceOver/NVDA) to test flows
- [ ] Run: `npm run lighthouse` or browser DevTools accessibility audit

**Checkpoint: Before Proceeding**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Run Lighthouse accessibility audit
npm run build
npm run start
# Open Chrome DevTools → Lighthouse → Accessibility
# ✅ Score should be 95+ (no regressions from baseline)

# Manual keyboard testing
# ✅ Tab through entire app (all interactive elements reachable)
# ✅ Enter/Space activates all buttons
# ✅ Escape closes dialogs
# ✅ Focus visible on all elements

# Screen reader testing (VoiceOver on Mac / NVDA on Windows)
# ✅ All form labels read correctly
# ✅ Error messages announced
# ✅ Loading states announced
# ✅ Button purposes clear
```

**Git Commit:**
```bash
git add src/app/(dashboard)/**/*.tsx
git commit -m "feat(P2-3): fix accessibility violations

- Add ARIA labels to all Select components
- Add keyboard handlers to speed selection buttons
- Add aria-live regions for form errors
- Add aria-busy states for loading
- Test with keyboard navigation (all features accessible)
- Test with VoiceOver (all content announced)
- Lighthouse accessibility score: 95+
- All quality checks pass"
```

**Estimated Effort:** 1 day

---

### 🟠 P2-4: Remove Production Console Logging

**Files with unguarded console.log:**
- `src/app/(dashboard)/sessions/group/group-session-manager.tsx:211-238`
- `src/app/(dashboard)/sessions/group/athlete-workout-card.tsx:139, 161`
- `src/app/(dashboard)/pretests/actions.ts:160, 172`

**Solution:**

**Option A: Create logging utility (recommended)**
```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

function log(level: LogLevel, message: string, context?: LogContext) {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString()
    const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : ''
    
    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR: ${message}${contextStr}`)
        break
      case 'warn':
        console.warn(`[${timestamp}] WARN: ${message}${contextStr}`)
        break
      case 'info':
        console.info(`[${timestamp}] INFO: ${message}${contextStr}`)
        break
      case 'debug':
        console.log(`[${timestamp}] DEBUG: ${message}${contextStr}`)
        break
    }
  }
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production' && level === 'error') {
    // TODO: Send to Sentry or similar
    // Sentry.captureException(new Error(message), { extra: context })
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
}
```

**Then replace console.log calls:**
```typescript
// Before
console.log('Starting workout for:', athlete.name, 'program ID:', athlete.athlete_program_id)

// After
logger.debug('Starting workout', { 
  athleteName: athlete.name, 
  programId: athlete.athlete_program_id 
})
```

**Option B: Remove or guard each one**
```typescript
// Before
console.error('Failed to log result:', error)

// After (guarded)
if (process.env.NODE_ENV === 'development') {
  console.error('Failed to log result:', error)
}

// Or after (removed, user sees toast already)
// [removed - error shown in toast]
```

**Acceptance Criteria:**
- [ ] Create `src/lib/logger.ts` utility
- [ ] Replace all console.log/error/warn with logger
- [ ] Verify: `rg "console\.(log|error|warn)" src/app --type ts` only returns:
  - Development-guarded calls in error boundaries (acceptable)
  - Docstring examples (acceptable)
- [ ] Test: Production build has no console output

**Checkpoint: Before Proceeding**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Verify console.log removed
rg "console\.(log|error|warn)" --type ts src/app/(dashboard) | grep -v "process.env.NODE_ENV" | grep -v "//"
# ✅ Should return ZERO results (except error boundaries)

# Test production build
npm run build
NODE_ENV=production npm run start
# Open browser, use features
# ✅ Browser console should be clean (no logs)

# Test development
npm run dev
# ✅ Logs should appear in terminal (not browser console)
```

**Git Commit:**
```bash
git add src/lib/logger.ts
git add src/app/(dashboard)/**/*.tsx
git add src/app/(dashboard)/**/*.ts
git commit -m "refactor(P2-4): replace console.log with logger utility

- Create structured logger with dev/prod modes
- Replace all console.log with logger calls
- Production logs silent (ready for Sentry integration)
- Development logs formatted with timestamps
- Scan confirms no unwanted console statements
- All quality checks pass"
```

**Estimated Effort:** 2-3 hours

---

### 🟠 P2-5: Replace alert() with Toast Notifications

**File:** `src/app/(dashboard)/sessions/group/group-session-manager.tsx:229`

**Problem:**
```typescript
alert(`Some workouts failed to start:\n${errors.join('\n')}`)
```

**Solution:**
```typescript
import { toast } from 'sonner'

// Replace alert with toast
if (errors.length > 0) {
  toast.error('Some workouts failed to start', {
    description: (
      <ul className="list-disc list-inside mt-2">
        {errors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    ),
    duration: 10000, // Longer duration for multiple errors
  })
}
```

**Also check for:**
- Any other `alert()` calls
- `confirm()` calls (replace with dialog)
- `prompt()` calls (replace with dialog)

**Acceptance Criteria:**
- [ ] No `alert()`, `confirm()`, or `prompt()` calls in codebase
- [ ] All user notifications use toast or dialog components
- [ ] Test: Error handling provides clear feedback
- [ ] Scan: `rg "(alert|confirm|prompt)\(" src/app --type ts` returns zero results

**Checkpoint: Before Proceeding**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Verify no alert/confirm/prompt
rg "(alert|confirm|prompt)\(" --type ts src/app
# ✅ Should return ZERO results

# Manual testing
# ✅ Trigger error condition → Toast appears (not alert)
# ✅ Toast is accessible (keyboard dismissible)
# ✅ Multiple errors show as list in single toast
```

**Git Commit:**
```bash
git add src/app/(dashboard)/sessions/group/group-session-manager.tsx
git commit -m "refactor(P2-5): replace alert() with toast notifications

- Replace alert() with sonner toast
- Display multiple errors in list format
- Improve error UX with dismissible toasts
- Test error scenarios (proper feedback shown)
- Scan confirms no alert/confirm/prompt remain
- All quality checks pass"
```

**Estimated Effort:** 1 hour

---

### 🟠 P2-6: Add Not-Found Pages for Session Routes

**Missing:**
- `src/app/(dashboard)/workouts/session/[id]/not-found.tsx`
- `src/app/(dashboard)/pretests/session/[id]/not-found.tsx`

**Template:**
```typescript
// src/app/(dashboard)/workouts/session/[id]/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function WorkoutSessionNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
      <AlertCircle className="h-12 w-12 text-yellow-500" />
      <h2 className="text-xl font-semibold">Workout Session Not Found</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        This workout session doesn't exist or you don't have permission to access it.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/workouts/new">Start New Workout</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/workouts">View All Workouts</Link>
        </Button>
      </div>
    </div>
  )
}
```

**Trigger not-found:**
```typescript
// In page.tsx
import { notFound } from 'next/navigation'

export default async function WorkoutSessionPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: session, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (error || !session) {
    notFound() // Triggers not-found.tsx
  }
  
  // ... rest of page
}
```

**Acceptance Criteria:**
- [ ] Both session routes have not-found pages
- [ ] Not-found pages provide helpful navigation
- [ ] Test: Navigate to non-existent session ID
- [ ] Consistent design with other not-found pages

**Estimated Effort:** 30 minutes

---

## Phase 3: Code Quality

**Duration:** 1-2 weeks  
**Goal:** Consistency, testability, maintainability

### 🟡 P3-1: Complete React Hook Form Migration

**Current State:** Mixed form handling patterns

**Forms to Migrate:**
- `src/app/(dashboard)/athletes/[id]/edit/page.tsx` - Uses `useActionState`

**Migration Steps:**

1. **Install dependencies** (already installed ✓)
   - `react-hook-form`
   - `@hookform/resolvers`
   - `zod`

2. **Create form schemas**
   ```typescript
   // src/lib/validations/forms.ts
   import { z } from 'zod'
   
   export const athleteFormSchema = z.object({
     name: z.string()
       .min(1, 'Name is required')
       .max(100, 'Name must be 100 characters or less')
       .transform(s => s.trim()),
     gender: z.enum(['male', 'female'], {
       required_error: 'Gender is required',
     }),
     sport: z.string().max(50).optional().nullable(),
     position: z.string().max(50).optional().nullable(),
     birth_date: z.string().optional().nullable(),
     head_size: z.enum(['small', 'medium', 'large']).optional().nullable(),
     chest_size: z.enum(['small', 'medium', 'large']).optional().nullable(),
     notes: z.string().max(1000).optional().nullable(),
   })
   
   export type AthleteFormValues = z.infer<typeof athleteFormSchema>
   ```

3. **Update form component**
   ```typescript
   // src/app/(dashboard)/athletes/[id]/edit/page.tsx
   'use client'
   
   import { useForm } from 'react-hook-form'
   import { zodResolver } from '@hookform/resolvers/zod'
   import { athleteFormSchema, type AthleteFormValues } from '@/lib/validations/forms'
   import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
   
   export default function EditAthletePage({ athlete }: { athlete: Athlete }) {
     const form = useForm<AthleteFormValues>({
       resolver: zodResolver(athleteFormSchema),
       defaultValues: {
         name: athlete.name,
         gender: athlete.gender,
         sport: athlete.sport || '',
         position: athlete.position || '',
         birth_date: athlete.birth_date || '',
         head_size: athlete.head_size,
         chest_size: athlete.chest_size,
         notes: athlete.notes || '',
       },
     })
     
     const onSubmit = async (values: AthleteFormValues) => {
       const formData = new FormData()
       Object.entries(values).forEach(([key, value]) => {
         if (value != null) formData.append(key, String(value))
       })
       
       const result = await updateAthlete(athlete.id, formData)
       
       if (result.success) {
         toast.success('Athlete updated successfully')
         router.push(`/athletes/${athlete.id}`)
       } else {
         form.setError('root', { message: result.error })
       }
     }
     
     return (
       <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
           <FormField
             control={form.control}
             name="name"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Name</FormLabel>
                 <FormControl>
                   <Input {...field} />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
           {/* ... other fields ... */}
           <Button type="submit" disabled={form.formState.isSubmitting}>
             {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
           </Button>
         </form>
       </Form>
     )
   }
   ```

**Benefits:**
- Consistent validation across all forms
- Better TypeScript integration
- Automatic error handling
- Built-in loading states
- Field-level validation

**Acceptance Criteria:**
- [ ] All forms use React Hook Form
- [ ] Remove manual `useState` for form fields
- [ ] Consistent error display across all forms
- [ ] Test: All forms validate correctly
- [ ] Test: Field-level validation shows immediately

**Checkpoint: Before Proceeding**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass (no errors from form changes)
# ✅ Lint must pass (no unused imports from removed useState)
# ✅ Build must pass

# Verify React Hook Form usage
rg "useActionState" --type ts src/app/(dashboard)
# ✅ Should return ZERO results (or only intentional uses)

rg "useState.*formData" --type ts src/app/(dashboard)
# ✅ Should return ZERO results in form components

# Manual testing - EVERY migrated form
# ✅ Edit athlete form validates on blur
# ✅ Edit athlete form shows field-level errors
# ✅ Edit athlete form submits correctly
# ✅ Loading states work properly
# ✅ Error handling displays correctly
```

**Git Commit:**
```bash
git add src/lib/validations/forms.ts
git add src/app/(dashboard)/athletes/[id]/edit/page.tsx
git add src/app/(dashboard)/*/[id]/edit/*.tsx  # any other migrated forms
git commit -m "refactor(P3-1): migrate forms to React Hook Form

- Create form schemas in validations/forms.ts
- Migrate athlete edit form to React Hook Form
- Add field-level validation with zodResolver
- Consistent error display with FormMessage
- Test all migrated forms (validation working)
- All quality checks pass"
```

**Estimated Effort:** 2-3 days

---

### 🟡 P3-2: Add Comprehensive Testing

**Current State:** No tests

**Testing Strategy:**

**1. Unit Tests (Vitest)**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Priority test files:**
```typescript
// src/lib/metabolic.test.ts
import { describe, it, expect } from 'vitest'
import { calculateMetabolicData, determineProgram } from './metabolic'

describe('calculateMetabolicData', () => {
  it('calculates AT percentage correctly', () => {
    const result = calculateMetabolicData({
      at_hr: 150,
      max_hr: 180,
      recovery_hr: null,
      vo2_max: null,
    })
    
    expect(result.at_mx_percent).toBe(83.33)
  })
  
  it('determines recovery HR correctly', () => {
    const result = calculateMetabolicData({
      at_hr: 150,
      max_hr: 180,
      recovery_hr: 160,
      vo2_max: null,
    })
    
    expect(result.recovery_at_percent).toBe(88.89)
    expect(result.recovery_hr_target).toBe(148) // 180 * 0.82
  })
})

// src/lib/retry.test.ts
// src/lib/rate-limit.test.ts (for fallback logic)
```

**2. Integration Tests (Server Actions)**
```typescript
// src/app/(dashboard)/athletes/actions.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createAthlete, updateAthlete } from './actions'

describe('Athlete Actions', () => {
  it('validates required fields', async () => {
    const formData = new FormData()
    // Missing name
    formData.append('gender', 'male')
    
    const result = await createAthlete(formData)
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Name is required')
    }
  })
  
  it('trims whitespace from inputs', async () => {
    const formData = new FormData()
    formData.append('name', '  John Doe  ')
    formData.append('gender', 'male')
    
    const result = await createAthlete(formData)
    
    expect(result.success).toBe(true)
    // Verify name was trimmed in database
  })
})
```

**3. E2E Tests (Playwright)**
```bash
npm install -D @playwright/test
```

```typescript
// e2e/athlete-flow.spec.ts
import { test, expect } from '@playwright/test'

test('create and assign program to athlete', async ({ page }) => {
  await page.goto('/athletes')
  
  // Create athlete
  await page.click('text=New Athlete')
  await page.fill('input[name="name"]', 'Test Athlete')
  await page.selectOption('select[name="gender"]', 'male')
  await page.click('button[type="submit"]')
  
  // Verify redirect to athlete page
  await expect(page).toHaveURL(/\/athletes\/[a-f0-9-]+/)
  
  // Assign program
  await page.click('text=Assign Program')
  await page.selectOption('select[name="program_id"]', { index: 1 })
  await page.click('button:has-text("Assign")')
  
  // Verify assignment
  await expect(page.locator('text=Program assigned')).toBeVisible()
})
```

**Coverage Targets:**
- Unit tests: 80% coverage for utility functions
- Integration tests: All critical server actions
- E2E tests: Primary user flows (create athlete, start workout, complete pretest)

**Acceptance Criteria:**
- [ ] Vitest configured with React Testing Library
- [ ] Unit tests for: `metabolic.ts`, `retry.ts`, rate limiting fallback
- [ ] Integration tests for: All server actions
- [ ] Playwright configured
- [ ] E2E tests for: Athlete flow, workout flow, pretest flow
- [ ] CI/CD runs tests on every PR
- [ ] Coverage report generated

**Checkpoint: After EACH test suite**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Run tests
npm run test
# ✅ All tests must pass
# ✅ Coverage threshold met for affected files

npm run test:e2e  # when E2E tests added
# ✅ All E2E tests must pass

# Coverage check
npm run test -- --coverage
# ✅ Unit tests: >80% coverage for utils
# ✅ Integration tests: >70% coverage for actions
# ✅ Overall: >70% coverage
```

**Git Commits (incremental):**
```bash
# After unit tests
git add src/lib/*.test.ts vitest.config.ts
git commit -m "test(P3-2): add unit tests for utility functions

- Configure Vitest with React Testing Library
- Add tests for metabolic.ts (80%+ coverage)
- Add tests for retry.ts (80%+ coverage)
- Add tests for rate-limit fallback
- All tests passing
- All quality checks pass"

# After integration tests
git add src/app/(dashboard)/*/actions.test.ts
git commit -m "test(P3-2): add integration tests for server actions

- Add tests for athlete actions
- Add tests for pretest actions
- Add tests for workout actions
- 70%+ coverage on server actions
- All tests passing
- All quality checks pass"

# After E2E tests
git add e2e/ playwright.config.ts
git commit -m "test(P3-2): add E2E tests for critical flows

- Configure Playwright
- Add athlete creation and assignment flow
- Add workout flow
- Add pretest flow
- All E2E tests passing
- All quality checks pass"
```

**Estimated Effort:** 1-2 weeks (can be done incrementally)

---

### 🟡 P3-3: Add Environment Variable Validation

**Create centralized validation:**

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  
  // Redis (production only)
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Redis URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Additional production validation
const productionSchema = envSchema.extend({
  UPSTASH_REDIS_REST_URL: z.string().url('Redis is required in production'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Redis token is required in production'),
})

function validateEnv() {
  const schema = process.env.NODE_ENV === 'production' ? productionSchema : envSchema
  
  const parsed = schema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    throw new Error('Invalid environment variables')
  }
  
  return parsed.data
}

export const env = validateEnv()

// Type-safe access
export const config = {
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  redis: {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
} as const
```

**Use in clients:**
```typescript
// src/lib/supabase/client.ts
import { config } from '@/lib/env'

export function createBrowserClient() {
  return createClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    // ...
  )
}
```

**Acceptance Criteria:**
- [ ] All env vars validated at startup
- [ ] Clear error messages for missing/invalid vars
- [ ] Type-safe access via `config` object
- [ ] Production-specific validation
- [ ] Test: App fails fast with clear message if env vars missing
- [ ] Update `.env.example` with all required vars

**Checkpoint: Before Proceeding**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Test validation works
# Remove env var temporarily
unset NEXT_PUBLIC_SUPABASE_URL
npm run dev
# ✅ Should fail immediately with clear error message

# Test production requirements
NODE_ENV=production npm run build
# ✅ Should require Redis env vars in production

# Verify type safety
rg "process\.env\." --type ts src/app | grep -v "NODE_ENV"
# ✅ Should only see process.env in env.ts file (centralized)
```

**Git Commit:**
```bash
git add src/lib/env.ts
git add src/lib/supabase/client.ts
git add src/lib/supabase/server.ts
git add .env.example
git commit -m "feat(P3-3): add environment variable validation

- Create centralized env validation with Zod
- Add production-specific validation (Redis required)
- Type-safe access via config object
- Clear error messages for missing/invalid vars
- Test fail-fast behavior (verified)
- Update .env.example with all vars
- All quality checks pass"
```

**Estimated Effort:** 2-3 hours

---

### 🟡 P3-4: Standardize Error Handling Everywhere

**Goal:** All server actions use ActionResult<T> pattern consistently

**Current Mixed Patterns:**
1. Some return `ActionResult<T>` ✓
2. Some return `void` with redirect
3. Some return old form state types
4. Some throw errors

**Standard Pattern:**

**For actions that redirect:**
```typescript
// Option A: Return void, redirect at end
export async function deleteAthlete(id: string): Promise<ActionResult<void>> {
  const authResult = await withAuth()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data
  
  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', id)
  
  if (error) {
    return failure('Failed to delete athlete: ' + error.message)
  }
  
  revalidatePath('/athletes')
  redirect('/athletes') // Throws, terminates function
}

// Option B: Return success, let component handle redirect
export async function deleteAthlete(id: string): Promise<ActionResult<void>> {
  // ... same validation and delete
  
  revalidatePath('/athletes')
  return successVoid() // Component redirects on success
}
```

**For actions that return data:**
```typescript
export async function getAthleteProgram(athleteId: string): Promise<ActionResult<Program>> {
  const authResult = await withAuth()
  if (!authResult.success) return authResult
  const { supabase } = authResult.data
  
  const { data, error } = await supabase
    .from('athlete_programs')
    .select('*, programs(*)')
    .eq('athlete_id', athleteId)
    .eq('status', 'active')
    .single()
  
  if (error) {
    return failure('Failed to fetch program: ' + error.message)
  }
  
  return success(data)
}
```

**Acceptance Criteria:**
- [ ] Document standard patterns in README
- [ ] All actions follow one of the standard patterns
- [ ] No `throw` statements in server actions (except redirect)
- [ ] Consistent error message format
- [ ] Test: All error cases return proper ActionResult

**Checkpoint: Before Proceeding**
```bash
./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Verify consistency
rg "export async function" --type ts src/app/(dashboard)/*/actions.ts | wc -l
# ✅ Count total actions

rg "ActionResult" --type ts src/app/(dashboard)/*/actions.ts | wc -l
# ✅ Should be close to or exceed action count (all use ActionResult)

rg "throw new Error" --type ts src/app/(dashboard)/*/actions.ts
# ✅ Should return ZERO results (except throws from redirect/notFound)

# Manual testing
# ✅ Test error case in each action type
# ✅ Verify error messages are clear and consistent
# ✅ Verify all return ActionResult format
```

**Git Commit:**
```bash
git add src/app/(dashboard)/*/actions.ts
git add README.md  # if documented
git commit -m "refactor(P3-4): standardize error handling across all actions

- All actions return ActionResult<T>
- Remove throw statements (use failure() instead)
- Consistent error message format
- Document patterns in README
- Test all error paths (proper ActionResult returned)
- All quality checks pass"
```

**Estimated Effort:** 3-4 days

---

### 🟡 P3-5: Code Style and Linting

**Add Prettier:**
```bash
npm install -D prettier prettier-plugin-tailwindcss
```

```json
// .prettierrc
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Add Pre-commit Hooks:**
```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
npm run lint-staged
npm run type-check
```

**Update ESLint:**
```json
// eslint.config.js
export default [
  {
    rules: {
      // Enforce exhaustive deps
      'react-hooks/exhaustive-deps': 'error',
      
      // No console in production code
      'no-console': ['warn', { 
        allow: ['warn', 'error'] 
      }],
      
      // Prefer const
      'prefer-const': 'error',
      
      // No unused vars
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    }
  }
]
```

**Acceptance Criteria:**
- [ ] Prettier configured
- [ ] Pre-commit hooks run linting and formatting
- [ ] Type-check runs on commit
- [ ] All existing code formatted
- [ ] CI runs linting

**Checkpoint: Before Proceeding**
```bash
# Format all existing code
npx prettier --write .
# ✅ All files formatted

./scripts/checkpoint.sh
# ✅ Type check must pass
# ✅ Lint must pass
# ✅ Build must pass

# Test pre-commit hook
echo "test" >> test.ts
git add test.ts
git commit -m "test: verify pre-commit hook"
# ✅ Hook should run automatically
# ✅ If formatting needed, commit should fail
# ✅ Reformat and try again

# Verify Prettier config
npx prettier --check .
# ✅ Should report all files pass
```

**Git Commit:**
```bash
git add .prettierrc .husky/ package.json
git add src/  # formatted files
git commit -m "chore(P3-5): add Prettier and pre-commit hooks

- Configure Prettier with Tailwind plugin
- Add Husky + lint-staged for pre-commit
- Format all existing code
- Add type-check to pre-commit
- Test hooks work correctly
- All quality checks pass"
```

**Estimated Effort:** 1 day

---

## Phase 4: Production Hardening

**Duration:** Ongoing  
**Goal:** Monitoring, optimization, operational excellence

### 🟢 P4-1: Add Monitoring and Observability

**Option 1: Sentry (Recommended)**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Error filtering
  beforeSend(event, hint) {
    // Don't send auth errors
    if (event.exception?.values?.[0]?.type === 'AuthenticationError') {
      return null
    }
    return event
  },
  
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

**Option 2: LogRocket**
```bash
npm install logrocket
```

**Integration with Logger:**
```typescript
// src/lib/logger.ts
import * as Sentry from '@sentry/nextjs'

export const logger = {
  error: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`ERROR: ${message}`, context)
    }
    
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(new Error(message), {
        extra: context,
      })
    }
  },
  // ... other methods
}
```

**Acceptance Criteria:**
- [ ] Sentry or similar monitoring configured
- [ ] Error tracking working in production
- [ ] Performance monitoring enabled
- [ ] Session replay configured
- [ ] Error rates and alerts set up

**Estimated Effort:** 1-2 days

---

### 🟢 P4-2: Add Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'

export async function GET() {
  const checks = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown' as 'up' | 'down' | 'unknown',
      redis: 'unknown' as 'up' | 'down' | 'unknown',
    },
  }
  
  try {
    // Check Supabase
    const supabase = await createClient()
    const { error } = await supabase.from('athletes').select('id').limit(1)
    checks.checks.database = error ? 'down' : 'up'
  } catch {
    checks.checks.database = 'down'
  }
  
  try {
    // Check Redis
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
      await redis.ping()
      checks.checks.redis = 'up'
    } else {
      checks.checks.redis = 'unknown'
    }
  } catch {
    checks.checks.redis = 'down'
  }
  
  // Determine overall status
  if (checks.checks.database === 'down') {
    checks.status = 'unhealthy'
    return NextResponse.json(checks, { status: 503 })
  }
  
  if (checks.checks.redis === 'down') {
    checks.status = 'degraded'
    return NextResponse.json(checks, { status: 200 })
  }
  
  return NextResponse.json(checks, { status: 200 })
}
```

**Acceptance Criteria:**
- [ ] Health endpoint returns proper status
- [ ] Checks database connectivity
- [ ] Checks Redis connectivity (if configured)
- [ ] Returns appropriate HTTP status codes
- [ ] Can be used by uptime monitoring (UptimeRobot, etc.)

**Estimated Effort:** 2-3 hours

---

### 🟢 P4-3: Bundle Size Optimization

```bash
npm install -D @next/bundle-analyzer
```

```typescript
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // ... existing config
}

export default withBundleAnalyzer(nextConfig)
```

**Analyze:**
```bash
ANALYZE=true npm run build
```

**Common optimizations:**
- Tree-shake unused code
- Dynamic imports for large components
- Optimize images
- Remove unused dependencies

**Acceptance Criteria:**
- [ ] Bundle analyzer set up
- [ ] Main bundle < 200KB
- [ ] No obvious duplicate dependencies
- [ ] Code splitting configured
- [ ] Image optimization enabled

**Estimated Effort:** 1-2 days

---

### 🟢 P4-4: Performance Optimization

**1. Add database indexes**
```sql
-- Create indexes for common queries
CREATE INDEX idx_athletes_created_at ON athletes(created_at DESC);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);
CREATE INDEX idx_athlete_programs_athlete_status ON athlete_programs(athlete_id, status);
```

**2. Optimize Supabase queries**
```typescript
// Before: Multiple queries
const { data: athlete } = await supabase.from('athletes').select('*').eq('id', id).single()
const { data: program } = await supabase.from('athlete_programs').select('*').eq('athlete_id', id).single()

// After: Single query with join
const { data } = await supabase
  .from('athletes')
  .select(`
    *,
    athlete_programs!inner (
      *,
      programs (name, description)
    )
  `)
  .eq('id', id)
  .single()
```

**3. Add caching headers**
```typescript
// For static data
export const revalidate = 3600 // 1 hour
```

**Acceptance Criteria:**
- [ ] Common queries have appropriate indexes
- [ ] N+1 queries eliminated
- [ ] Static data cached appropriately
- [ ] Lighthouse score > 90

**Estimated Effort:** 2-3 days

---

## Testing Strategy

### Test Pyramid

```
    /\
   /  \  E2E Tests (10%)
  /    \  - Critical user flows
 /------\  - Authentication
/        \ - Happy paths
/----------\ 
|          | Integration Tests (30%)
|          | - Server actions
|          | - API routes
|          | - Database operations
|----------| 
|          | Unit Tests (60%)
|          | - Utility functions
|          | - Business logic
|          | - Validation schemas
```

### Coverage Targets

- **Utilities:** 80% coverage
- **Server Actions:** 70% coverage
- **Components:** 60% coverage
- **Overall:** 70% coverage

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All Phase 1 critical blockers resolved
- [ ] All Phase 2 high-priority issues resolved
- [ ] Tests passing (unit, integration, E2E)
- [ ] Type checking passing
- [ ] Linting passing
- [ ] Bundle size acceptable
- [ ] Lighthouse score > 90

### Environment Setup

- [ ] Supabase project configured
- [ ] Upstash Redis configured
- [ ] Environment variables set in Vercel
- [ ] Domain configured
- [ ] SSL certificate valid

### Security

- [ ] All security headers configured
- [ ] CSP policy tested
- [ ] Rate limiting tested
- [ ] Auth flow tested
- [ ] RLS policies reviewed

### Monitoring

- [ ] Sentry configured
- [ ] Error alerts set up
- [ ] Health check endpoint tested
- [ ] Uptime monitoring configured

### Documentation

- [ ] README updated
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide created

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] User acceptance testing
- [ ] Backup strategy verified

---

## Success Metrics

### Code Quality

- TypeScript strict mode: ✓
- ESLint errors: 0
- Test coverage: >70%
- Bundle size: <200KB
- Lighthouse score: >90

### Reliability

- Uptime: >99.9%
- Error rate: <0.1%
- Response time: <500ms (p95)
- Zero data corruption incidents

### Security

- All known vulnerabilities patched
- Rate limiting functional
- Auth properly secured
- Audit logging in place

---

## Appendix A: File Checklist

### Files to Create

- [ ] `scripts/checkpoint.sh` - Quality gate script ✅ CREATED
- [ ] `src/lib/env.ts` - Environment validation
- [ ] `src/lib/logger.ts` - Logging utility
- [ ] `src/lib/rate-limit-redis.ts` - Redis rate limiting
- [ ] `src/lib/validations/actions.ts` - Centralized schemas
- [ ] `src/app/api/health/route.ts` - Health check
- [ ] `src/app/(dashboard)/settings/error.tsx`
- [ ] `src/app/(dashboard)/pretests/new/error.tsx`
- [ ] `src/app/(dashboard)/workouts/new/error.tsx`
- [ ] `src/app/(dashboard)/workouts/session/[id]/not-found.tsx`
- [ ] `src/app/(dashboard)/pretests/session/[id]/not-found.tsx`
- [ ] `supabase/migrations/005_atomic_workout_increment.sql`
- [ ] `.prettierrc`
- [ ] `vitest.config.ts`
- [ ] `playwright.config.ts`

### Files to Update

- [ ] `next.config.ts` - Add CSP, HSTS
- [ ] `src/lib/supabase/auth.ts` - Redis rate limiting
- [ ] `src/lib/rate-limit.ts` - Mark as deprecated
- [ ] `src/app/(dashboard)/athletes/actions.ts` - Standardize auth
- [ ] `src/app/(dashboard)/pretests/actions.ts` - Fix validation
- [ ] `src/app/(dashboard)/workouts/actions.ts` - Fix race condition
- [ ] `src/app/(dashboard)/sessions/group/actions.ts` - Fix race condition
- [ ] `src/app/(dashboard)/sessions/group/group-session-manager.tsx` - Fix memory leak
- [ ] All form components - Add accessibility
- [ ] All server actions - Add rate limiting

---

## Appendix B: Migration Scripts

### Script 1: Find Unsafe Zod Parsing

```bash
#!/bin/bash
# find-unsafe-zod.sh

echo "Searching for unsafe Zod parsing patterns..."
rg "safeParse.*\.data" --type ts -A 2 -B 2 src/
```

### Script 2: Find Manual Auth Patterns

```bash
#!/bin/bash
# find-manual-auth.sh

echo "Searching for manual auth patterns..."
rg "createClient.*getUser" --type ts src/app/(dashboard)
```

### Script 3: Find Console Statements

```bash
#!/bin/bash
# find-console.sh

echo "Searching for console statements..."
rg "console\.(log|error|warn)" --type ts src/app \
  | grep -v "process.env.NODE_ENV" \
  | grep -v "// "
```

---

## Summary

This plan provides a clear roadmap from current state (60% ready) to production (100% ready). The phased approach allows for:

1. **Immediate safety** (Phase 1: 2-3 days)
2. **Security hardening** (Phase 2: 3-5 days)
3. **Quality improvement** (Phase 3: 1-2 weeks)
4. **Operational excellence** (Phase 4: Ongoing)

**Total estimated effort:** 2-3 weeks for Phases 1-3, with Phase 4 being continuous improvement.

**Recommended approach:** Complete Phase 1 and 2 before any production deployment. Phase 3 can be done incrementally. Phase 4 should be ongoing.
