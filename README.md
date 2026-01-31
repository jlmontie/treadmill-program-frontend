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

## Related Projects

- [athlete-training-database](../athlete-training-database) - Database schema, migrations, and seed data

## License

MIT
