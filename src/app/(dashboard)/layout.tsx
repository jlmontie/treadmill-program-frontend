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
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  )
}
