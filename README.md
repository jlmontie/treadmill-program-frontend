# TreadTrack - Treadmill Training Program Frontend

A modern Next.js web application for administering treadmill training programs to athletes. Built with the App Router, Server Components, Server Actions, and Supabase integration.

## Features

- **Authentication**: Secure trainer login via Supabase Auth
- **Athlete Management**: Create, edit, and track athletes
- **Pre-Test Administration**: Conduct diagnostic pre-tests with completion scoring
- **Workout Tracking**: Log exercises with intervention levels and speed selection
- **Program Browser**: View all 36+ training programs
- **Multi-Athlete Support**: Manage up to 6 concurrent athletes
- **Real-time Updates**: Live workout tracking across devices

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (see [athlete-training-database](../athlete-training-database) for setup)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file (copy from `env.example`):

```bash
cp env.example .env.local
```

3. Add your Supabase credentials to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   └── login/
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── athletes/        # Athlete management
│   │   ├── pretests/        # Pre-test administration
│   │   ├── workouts/        # Workout sessions
│   │   ├── programs/        # Program browser
│   │   └── settings/        # User settings
│   ├── auth/                # Auth callback
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── layout/              # Layout components
├── lib/
│   ├── supabase/            # Supabase client utilities
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── middleware.ts    # Auth middleware helper
│   ├── types/               # TypeScript types
│   └── utils.ts             # Utility functions
└── middleware.ts            # Next.js middleware
```

## Security

This application implements multiple security layers to protect against common web vulnerabilities:

### Security Headers

All responses include comprehensive security headers configured in `next.config.ts`:

- **Content-Security-Policy (CSP)**: Prevents XSS attacks by restricting resource sources
  - Scripts, styles, and assets limited to trusted origins
  - Supabase API (`https://*.supabase.co`) and WebSocket (`wss://*.supabase.co`) domains whitelisted
  - Inline scripts/styles allowed only where required by Next.js and Tailwind CSS
- **Strict-Transport-Security (HSTS)**: Forces HTTPS in production
  - 1-year duration with subdomain inclusion
  - Preload-ready for browser HSTS preload lists
- **X-Frame-Options**: Prevents clickjacking attacks (`DENY`)

- **X-Content-Type-Options**: Prevents MIME-sniffing attacks (`nosniff`)

- **Referrer-Policy**: Controls referrer information (`strict-origin-when-cross-origin`)

- **Permissions-Policy**: Disables unused browser features (camera, microphone, geolocation)

### Authentication & Authorization

- **Supabase Auth**: Secure session management with JWT tokens
- **Row Level Security (RLS)**: Database-level access control
- **Middleware Protection**: All dashboard routes require authentication
- **Rate Limiting**: Server actions protected with in-memory rate limiting

### Testing Security Headers

During development, verify CSP compliance:

```bash
# Run dev server
npm run dev

# Open http://localhost:3000 in browser
# Open DevTools Console
# Check for CSP violation warnings (there should be none)
```

In production, verify headers are sent:

```bash
# Check headers
curl -I https://your-domain.vercel.app | grep -i "content-security-policy"
curl -I https://your-domain.vercel.app | grep -i "strict-transport-security"
```

## Development

### Server Actions

This project uses Server Actions for mutations instead of API routes:

```typescript
// app/(dashboard)/athletes/actions.ts
'use server'

export async function createAthlete(formData: FormData) {
  const supabase = await createClient()
  // ... create athlete
  revalidatePath('/athletes')
  redirect(`/athletes/${id}`)
}
```

### Server Components

Data fetching is done in Server Components:

```typescript
// app/(dashboard)/athletes/page.tsx
export default async function AthletesPage() {
  const supabase = await createClient()
  const { data: athletes } = await supabase.from('athletes').select('*')
  return <AthleteList athletes={athletes} />
}
```

### Database Types

Types are defined in `lib/types/database.ts`. In production, generate these from Supabase:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.ts
```

---

## Quality Gates & Testing

This project enforces strict quality standards through automated gates.

### Checkpoint Script

Before committing ANY code change, run:

```bash
./scripts/checkpoint.sh
```

This script runs:

1. **Type Check** - Ensures TypeScript compiles without errors
2. **Lint** - Checks code quality (errors block commit)
3. **Build** - Verifies production build succeeds
4. **Tests** - Runs all unit tests (must be 100% passing)

**All gates must pass.** No workarounds or suppressions are allowed.

### Pre-commit Hooks

Git commits automatically trigger:

- ESLint with auto-fix
- Prettier code formatting
- Type checking
- Test suite

If any check fails, the commit is blocked.

### Available Scripts

```bash
npm run dev            # Start development server
npm run build          # Production build
npm run start          # Start production server
npm run lint           # Run ESLint
npm run type-check     # Run TypeScript compiler
npm test               # Run test suite
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
npm run format         # Format all code with Prettier
npm run analyze        # Analyze bundle size
```

### Testing

Unit tests are required for all utility functions. Tests use Vitest + Testing Library.

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode for TDD
npm run test:coverage       # Generate coverage report
```

**Current Coverage:**

- `src/lib/metabolic.ts`: 100% (33 tests)

---

## Coding Standards

This project follows strict coding standards to ensure production quality.

### For AI Agents

**⚠️ AI agents working on this codebase MUST read and follow:**

📋 **[AI_CODING_STANDARDS.md](./docs/AI_CODING_STANDARDS.md)**

This document defines non-negotiable rules for:

- Quality gates and checkpoints
- Security patterns (rate limiting, validation)
- Accessibility requirements (ARIA, keyboard nav)
- Form handling (React Hook Form + Zod)
- Error handling (ActionResult pattern)
- Testing requirements
- Console logging rules

### For Human Developers

Key standards to follow:

#### 1. Server Actions

All mutation server actions use `withAuthRateLimited()`:

```typescript
export async function createAthlete(formData: FormData): Promise<ActionResult<string>> {
  const authResult = await withAuthRateLimited()
  if (!authResult.success) return authResult

  // Validate with Zod
  const validated = MySchema.safeParse({
    /* ... */
  })
  if (!validated.success) return failure('Invalid input')

  // Perform operation
  // Return ActionResult
}
```

#### 2. Forms

All forms use React Hook Form with Zod validation:

```typescript
const form = useForm({
  resolver: zodResolver(myFormSchema),
  defaultValues: { /* ... */ },
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="field" render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  </form>
</Form>
```

#### 3. Accessibility

All interactive elements must be accessible:

- Loading buttons: `aria-busy` + `sr-only` text
- Error messages: `role="alert"` + `aria-live="assertive"`
- Custom controls: Keyboard handlers + ARIA labels

#### 4. Environment Variables

Access environment variables through the validated config:

```typescript
import { config } from '@/lib/env'

const url = config.supabase.url // ✅ Type-safe, validated
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // ❌ Don't do this
```

#### 5. Error Boundaries

Every route has:

- `page.tsx` - The page component
- `error.tsx` - Error boundary for runtime errors
- `not-found.tsx` - 404 page (for dynamic routes)

---

## Production Readiness

This codebase has been systematically hardened for production deployment.

### Completed Phases

✅ **Phase 1: Critical Blockers** - Memory leaks, race conditions, unsafe parsing  
✅ **Phase 2: High Priority** - Rate limiting, accessibility, error boundaries  
✅ **Phase 3: Code Quality** - Testing, env validation, pre-commit hooks  
✅ **Phase 4: Production Hardening** - Monitoring, health checks, bundle optimization

### Security Features

- Content-Security-Policy (CSP) headers
- Strict-Transport-Security (HSTS) in production
- Rate limiting on all mutations (in-memory)
- Input validation with Zod
- Authenticated server actions
- Row Level Security (RLS) in database

### Quality Metrics

- Type Safety: 100% (TypeScript strict mode)
- Test Coverage: 33 tests passing
- Accessibility: WCAG 2.1 Level AA compliant
- Bundle Size: < 200KB main bundle
- Security Headers: A+ rating

### Documentation

- [Production Readiness Plan](./docs/production-readiness-plan.md) - Complete implementation roadmap
- [AI Coding Standards](./docs/AI_CODING_STANDARDS.md) - Strict rules for AI agents
- [Performance Guide](./docs/performance.md) - Optimization strategies and metrics
- [Code Review](./docs/code-review.md) - Historical review and improvements

---

## Related Projects

- [athlete-training-database](../athlete-training-database) - Database schema, migrations, and seed data

## License

MIT
