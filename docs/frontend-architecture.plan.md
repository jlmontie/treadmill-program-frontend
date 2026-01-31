# Treadmill Training Program - Frontend Architecture Plan

## Overview

A Next.js 14+ web application for trainers to administer treadmill training programs to athletes. Built with the App Router, Server Components, Server Actions, and Supabase integration.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14+ (App Router) | React framework with SSR/SSG |
| Database | Supabase (PostgreSQL) | Backend-as-a-Service |
| Auth | Supabase Auth | Email/password authentication |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | shadcn/ui | Accessible, customizable components |
| Real-time | Supabase Realtime | Live workout tracking |
| Types | TypeScript | Type safety |
| Forms | React Hook Form + Zod | Form handling and validation |

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Server          │  │ Server Actions  │  │ Client          │ │
│  │ Components      │  │                 │  │ Components      │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ • Page loads    │  │ • Create athlete│  │ • Real-time     │ │
│  │ • Data fetching │  │ • Log results   │  │   subscriptions │ │
│  │ • Auth checks   │  │ • Start workout │  │ • Interactive UI│ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                 │
│                    ┌───────────▼───────────┐                    │
│                    │   Supabase Client     │                    │
│                    │   (Server & Browser)  │                    │
│                    └───────────────────────┘                    │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │      Supabase       │
                    │   • PostgreSQL      │
                    │   • Auth            │
                    │   • Realtime        │
                    │   • Row Level Sec.  │
                    └─────────────────────┘
```

---

## Core Features

### 1. Authentication
- Email/password login for trainers
- Protected routes via middleware
- Session management with Supabase Auth

### 2. Athlete Management
- Create/edit athlete profiles
- View athlete history and progress
- Assign programs based on pre-test results

### 3. Pre-Test Administration
- Select pre-test type (Line, Standard, Returning, Returning Female)
- Step-by-step protocol with completion scoring (0-3)
- Record metabolic results (AT HR, Max HR, Recovery)
- Auto-recommend program based on results

### 4. Workout Session Management
- Start workout session for athlete
- Display exercises with treadmill settings (runs, incline, speed options, time)
- Real-time exercise logging with completion levels
- Speed column selection (1, 2, or 3)
- Notes per exercise
- Session summary on completion

### 5. Dashboard
- Active sessions (up to 6 concurrent)
- Quick athlete search
- Recent activity

### 6. Real-time Multi-Athlete View
- Monitor up to 6 athletes simultaneously
- Live updates across trainer devices
- Visual indicators for exercise completion

---

## Page Structure

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx              # Login form
│   ├── layout.tsx                # Centered auth layout
│   └── actions.ts                # signIn, signOut actions
│
├── (dashboard)/
│   ├── layout.tsx                # Main app layout (nav, auth guard)
│   │
│   ├── page.tsx                  # Dashboard home
│   │
│   ├── athletes/
│   │   ├── page.tsx              # Athlete list
│   │   ├── new/page.tsx          # Create athlete form
│   │   ├── [id]/
│   │   │   ├── page.tsx          # Athlete detail/history
│   │   │   └── edit/page.tsx     # Edit athlete
│   │   └── actions.ts            # CRUD actions
│   │
│   ├── pretests/
│   │   ├── page.tsx              # Pre-test history
│   │   ├── new/page.tsx          # Start new pre-test
│   │   ├── [id]/
│   │   │   └── page.tsx          # Pre-test detail/results
│   │   ├── session/
│   │   │   └── [id]/page.tsx     # Active pre-test (step-by-step)
│   │   └── actions.ts
│   │
│   ├── workouts/
│   │   ├── page.tsx              # Workout history
│   │   ├── new/page.tsx          # Start workout (select athlete)
│   │   ├── session/
│   │   │   └── [id]/page.tsx     # Active workout (exercise logging)
│   │   └── actions.ts
│   │
│   ├── programs/
│   │   ├── page.tsx              # Browse all programs
│   │   └── [id]/page.tsx         # Program detail
│   │
│   └── settings/
│       └── page.tsx              # Trainer settings
│
├── api/                          # Route Handlers (minimal)
│   └── webhooks/
│       └── route.ts              # Future: Supabase webhooks
│
├── layout.tsx                    # Root layout
├── page.tsx                      # Landing → redirect to login/dashboard
├── error.tsx                     # Error boundary
├── loading.tsx                   # Global loading
└── not-found.tsx                 # 404 page
```

---

## Component Architecture

### Shared UI Components (`/components/ui/`)
Using shadcn/ui for accessible, customizable primitives:
- Button, Input, Select, Dialog, Card, Table
- Toast notifications
- Loading spinners

### Feature Components

```
components/
├── ui/                           # shadcn/ui components
│
├── layout/
│   ├── header.tsx                # Top navigation
│   ├── sidebar.tsx               # Side navigation
│   └── mobile-nav.tsx            # Mobile hamburger menu
│
├── athletes/
│   ├── athlete-card.tsx          # Athlete summary card
│   ├── athlete-form.tsx          # Create/edit form
│   └── athlete-list.tsx          # Searchable list
│
├── pretests/
│   ├── pretest-type-selector.tsx # Protocol selection
│   ├── pretest-step.tsx          # Individual step with scoring
│   ├── metabolic-form.tsx        # HR/recovery inputs
│   └── program-recommendation.tsx # Recommended program display
│
├── workouts/
│   ├── exercise-row.tsx          # Single exercise with controls
│   ├── exercise-list.tsx         # All exercises in workout
│   ├── completion-buttons.tsx    # 0-3 level selector
│   ├── speed-selector.tsx        # Column 1/2/3 toggle
│   ├── workout-timer.tsx         # Session timer
│   └── workout-summary.tsx       # Post-workout stats
│
└── dashboard/
    ├── active-sessions.tsx       # Current workout sessions
    ├── quick-start.tsx           # Start workout/pretest
    └── recent-activity.tsx       # Activity feed
```

---

## Database Types

Generated from Supabase schema using `supabase gen types typescript`:

```typescript
// lib/types/database.ts (auto-generated)
export type Database = {
  public: {
    Tables: {
      athletes: { ... }
      trainers: { ... }
      programs: { ... }
      program_workouts: { ... }
      workout_exercises: { ... }
      // ... etc
    }
  }
}

// lib/types/index.ts (convenience aliases)
export type Athlete = Database['public']['Tables']['athletes']['Row']
export type Program = Database['public']['Tables']['programs']['Row']
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row']
// ... etc
```

---

## Server Actions Pattern

```typescript
// app/(dashboard)/athletes/actions.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const AthleteSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['male', 'female']),
  sport: z.string().optional(),
  position: z.string().optional(),
  birth_date: z.string().optional(),
})

export async function createAthlete(formData: FormData) {
  const supabase = await createServerClient()
  
  const validated = AthleteSchema.parse({
    name: formData.get('name'),
    gender: formData.get('gender'),
    sport: formData.get('sport'),
    position: formData.get('position'),
    birth_date: formData.get('birth_date'),
  })
  
  const { data, error } = await supabase
    .from('athletes')
    .insert(validated)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/athletes')
  redirect(`/athletes/${data.id}`)
}
```

---

## Real-time Subscriptions

For live workout tracking with multiple trainers:

```typescript
// components/workouts/live-workout.tsx
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export function LiveWorkout({ sessionId }: { sessionId: string }) {
  const [results, setResults] = useState<ExerciseResult[]>([])
  const supabase = createBrowserClient()
  
  useEffect(() => {
    const channel = supabase
      .channel(`workout:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_results',
          filter: `workout_session_id=eq.${sessionId}`,
        },
        (payload) => {
          // Update local state based on change
          if (payload.eventType === 'INSERT') {
            setResults(prev => [...prev, payload.new as ExerciseResult])
          }
        }
      )
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [sessionId])
  
  return (/* ... */)
}
```

---

## Authentication Flow

### Middleware Protection

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => response.cookies.set({ name, value, ...options }),
        remove: (name, options) => response.cookies.set({ name, value: '', ...options }),
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Redirect unauthenticated users to login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## UI/UX Design Principles

### Workout Interface
- **Large touch targets** for treadmill-side use
- **High contrast** completion level buttons (0=green, 1=yellow, 2=orange, 3=red)
- **Minimal scrolling** during active workout
- **Visual progress** indicator for workout completion
- **Quick notes** input per exercise

### Multi-Athlete View
- **Grid layout** for 1-6 athletes
- **Color-coded** athlete cards
- **At-a-glance** current exercise and status
- **One-tap** navigation to athlete's workout

### Mobile-First
- Responsive design for tablet/phone use at treadmill
- Touch-optimized controls
- Offline capability consideration (future)

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: for server-side admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Development Phases

### Phase 1: Foundation ✅
- [x] Plan architecture
- [x] Initialize Next.js project with TypeScript, Tailwind, App Router
- [x] Install Supabase and shadcn/ui dependencies
- [x] Configure Supabase client utilities (server + browser)
- [x] Set up authentication middleware
- [x] Create base layout and navigation components

### Phase 2: Core Features ✅
- [x] Athlete CRUD (list, create, edit, view detail)
- [x] Program browser (list by athlete type, view workouts/exercises)
- [x] Trainer profile management (settings page)
- [x] Basic workout session flow

### Phase 3: Pre-Test Module ✅
- [x] Pre-test type selection (Line, Standard, Returning, Returning Female)
- [x] Step-by-step protocol with completion scoring (complete, slight_touch, push, failure)
- [x] Metabolic result entry (AT HR, Max HR, Recovery HR, auto-calculated percentages)
- [x] Program recommendation based on results
- [x] Non-sequential step flow with gate instructions (steps 6, 7, 8 branching)
- [x] Human-readable program names (no database codes in UI)

### Phase 4: Workout Tracking ✅
- [x] Start workout session for athlete (select from active programs)
- [x] Direct workout start from athlete profile page
- [x] Exercise display with treadmill settings (runs, incline, speed options, time)
- [x] Completion level logging (complete, slight_touch, push, failure)
- [x] Speed column selection (1, 2, or 3)
- [x] Session notes and summary with performance breakdown
- [x] Cancel workout functionality (single and group sessions)
- [x] Workout #3 program adjustment analysis and recommendations

### Phase 5: Real-time & Polish ✅
- [x] Multi-athlete dashboard (up to 6 concurrent with live updates)
- [x] Real-time sync between trainers (Supabase Realtime on workouts/pretests)
- [x] Gender-based program filtering
- [x] Recovery HR calculation (database trigger)
- [x] Performance optimization (loading skeletons for all detail pages)
- [x] Error handling & edge cases (error boundaries, toast notifications, retry utilities)

### Phase 6: Mobile Optimization ✅
- [x] Touch interface refinements (group workout card responsive layout)
- [x] Mobile navigation (slide-out drawer)
- [x] Responsive grids throughout the app
- [ ] PWA capabilities (stretch goal)
- [ ] Offline support (stretch goal)

---

## File Structure (Final)

```
treadmill-program-frontend/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── athletes/
│   ├── pretests/
│   ├── workouts/
│   └── dashboard/
├── hooks/
│   └── use-retry-action.ts      # Hook for server actions with retry & toast
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── types/
│   │   ├── database.ts
│   │   └── index.ts
│   ├── pretest-flow.ts          # Pre-test branching logic & program recommendations
│   ├── workout-adjustment.ts    # Workout #3 speed analysis & adjustment logic
│   ├── retry.ts                 # Retry utility with exponential backoff
│   └── utils.ts
├── public/
├── docs/
│   └── frontend-architecture.plan.md
├── .env.local.example
├── .gitignore
├── middleware.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Next Steps

1. ~~Initialize Next.js project with TypeScript~~ ✅
2. ~~Install dependencies (Tailwind, shadcn/ui, Supabase)~~ ✅
3. ~~Configure Supabase client utilities~~ ✅
4. ~~Set up authentication middleware~~ ✅
5. ~~Create base layout and navigation~~ ✅
6. ~~Build athlete management pages~~ ✅
7. ~~Build pre-test flow~~ ✅
8. ~~Implement workout session flow~~ ✅
9. ~~Build multi-athlete real-time dashboard~~ ✅
10. ~~Implement program assignment logic (pre-test branching, metabolic categories)~~ ✅
11. ~~Add workout #3 adjustment recommendations~~ ✅
12. ~~Performance & error handling~~ ✅
13. **Mobile/touch optimization** ← Current priority

---

## Recent Completions (Jan 2026)

### Pre-Test Flow Enhancements
- Non-sequential step navigation based on gate_instruction
- Branching logic for steps 6, 7, 8 determining program outcomes
- Human-readable program names throughout UI
- Metabolic category calculation (LA, Standard, Low) based on AT/Max HR %

### Workout Improvements
- Direct "Start Workout" from athlete profile (bypasses group selection)
- Cancel workout functionality for both single and group sessions
- Workout #3 speed column analysis with upgrade/downgrade recommendations

### Database Updates (migration 003)
- Equipment sizing columns (head_size, chest_size)
- Recovery HR auto-calculation via trigger
- HR monitoring preference on athlete programs

### Performance & Error Handling (Jan 2026)
- Global 404 not-found page with navigation options
- Toast notifications via Sonner for all mutations (success/error feedback)
- Loading skeletons for all detail pages (athletes, workouts, pretests, sessions)
- Dedicated error boundaries for workout and pretest sessions
- Retry utility (`lib/retry.ts`) with exponential backoff for transient failures
- `useRetryAction` hook for easy retry integration in components
