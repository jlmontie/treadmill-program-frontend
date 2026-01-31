import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch trainer profile
  const { data } = await supabase
    .from('trainers')
    .select('name, email')
    .eq('auth_user_id', user.id)
    .single()

  const trainer = data as { name: string; email: string } | null

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        Skip to main content
      </a>
      
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          trainerName={trainer?.name} 
          trainerEmail={trainer?.email || user.email} 
        />
        
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  )
}
