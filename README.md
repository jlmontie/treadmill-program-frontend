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

## Related Projects

- [athlete-training-database](../athlete-training-database) - Database schema, migrations, and seed data

## License

MIT
