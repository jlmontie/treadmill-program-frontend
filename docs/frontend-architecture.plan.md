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

### Phase 1: Foundation (Current)
- [x] Plan architecture
- [ ] Initialize Next.js project
- [ ] Configure Supabase client
- [ ] Set up authentication
- [ ] Create basic layout/navigation

### Phase 2: Core Features
- [ ] Athlete CRUD
- [ ] Program browser (read-only)
- [ ] Basic workout session flow

### Phase 3: Pre-Test Module
- [ ] Pre-test type selection
- [ ] Step-by-step protocol
- [ ] Metabolic result entry
- [ ] Program recommendation

### Phase 4: Workout Tracking
- [ ] Exercise display with settings
- [ ] Completion level logging
- [ ] Speed column selection
- [ ] Session notes and summary

### Phase 5: Real-time & Polish
- [ ] Multi-athlete dashboard
- [ ] Real-time sync between trainers
- [ ] Performance optimization
- [ ] Error handling & edge cases

### Phase 6: Mobile Optimization
- [ ] Touch interface refinements
- [ ] PWA capabilities
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
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── types/
│   │   ├── database.ts
│   │   └── index.ts
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

1. Initialize Next.js project with TypeScript
2. Install dependencies (Tailwind, shadcn/ui, Supabase)
3. Configure Supabase client utilities
4. Set up authentication middleware
5. Create base layout and navigation
6. Build athlete management pages
7. Implement workout session flow
