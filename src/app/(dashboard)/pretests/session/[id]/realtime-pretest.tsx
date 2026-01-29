'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Wifi, WifiOff } from 'lucide-react'

interface RealtimePretestProps {
  sessionId: string
  children: React.ReactNode
}

export function RealtimePretest({ sessionId, children }: RealtimePretestProps) {
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to changes on this specific pretest session
    const channel = supabase
      .channel(`pretest-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pretest_step_results',
          filter: `pretest_session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Pretest step result change:', payload)
          setLastUpdate(new Date())
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pretest_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Pretest session change:', payload)
          setLastUpdate(new Date())
          // If status changed to completed, redirect to results
          if (payload.new && (payload.new as { status: string }).status === 'completed') {
            router.push(`/pretests/${sessionId}`)
          } else {
            router.refresh()
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, router])

  return (
    <div className="relative">
      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all ${
          isConnected 
            ? 'bg-emerald-500/20 border border-emerald-500/30' 
            : 'bg-amber-500/20 border border-amber-500/30'
        }`}>
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Connecting...</span>
            </>
          )}
          {lastUpdate && (
            <span className="text-xs text-slate-500 ml-1">
              • Updated {formatTimeAgo(lastUpdate)}
            </span>
          )}
        </div>
      </div>

      {children}
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}
