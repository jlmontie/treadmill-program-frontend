'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users,
  Dumbbell,
  ClipboardCheck,
  LayoutDashboard,
  Library,
  Settings,
  LogOut,
  UsersRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/' as const, icon: LayoutDashboard },
  { name: 'Group Session', href: '/sessions/group' as const, icon: UsersRound, highlight: true },
  { name: 'Athletes', href: '/athletes' as const, icon: Users },
  { name: 'Pre-Tests', href: '/pretests' as const, icon: ClipboardCheck },
  { name: 'Workouts', href: '/workouts' as const, icon: Dumbbell },
  { name: 'Programs', href: '/programs' as const, icon: Library },
] as const

const secondaryNavigation = [
  { name: 'Settings', href: '/settings' as const, icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-800">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Dumbbell className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold text-lg text-white tracking-tight">
          TreadTrack
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Main
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          const isHighlight = 'highlight' in item && item.highlight
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20'
                  : isHighlight
                  ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-400 border border-emerald-500/20 hover:from-emerald-500/20 hover:to-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-cyan-400' : isHighlight ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              {item.name}
              {isHighlight && !isActive && (
                <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                  NEW
                </span>
              )}
            </Link>
          )
        })}

        <div className="my-4 border-t border-slate-800" />

        <div className="mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Settings
        </div>
        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t border-slate-800 p-3">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800/50"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
