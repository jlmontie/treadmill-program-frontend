export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, ClipboardCheck } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pre-Tests | TreadTrack',
  description: 'Administer diagnostic pre-tests to evaluate athlete capacity',
}

interface PretestSession {
  id: string
  session_date: string
  status: string
  athletes: { id: string; name: string }
  pretest_types: { name: string; code: string }
}

export default async function PretestsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pretest_sessions')
    .select(`
      id,
      session_date,
      status,
      athletes!athlete_id (id, name),
      pretest_types!pretest_type_id (name, code)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const sessions = (data || []) as unknown as PretestSession[]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Pre-Tests</h1>
          <p className="text-slate-400 mt-1">
            Administer diagnostic pre-tests to evaluate athlete capacity
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25">
          <Link href="/pretests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Pre-Test
          </Link>
        </Button>
      </div>

      {/* Pre-Test List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Pre-Test History</CardTitle>
          <CardDescription className="text-slate-400">
            All pre-test sessions across athletes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/pretests/${session.id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/30">
                      <ClipboardCheck className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                        {session.athletes.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {session.pretest_types.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      {new Date(session.session_date).toLocaleDateString()}
                    </span>
                    <Badge 
                      variant="secondary"
                      className={
                        session.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : session.status === 'in_progress'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }
                    >
                      {session.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardCheck className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-white">No pre-tests yet</h3>
              <p className="mt-2 text-slate-400">
                Start a pre-test to evaluate an athlete&apos;s capacity and determine their training program.
              </p>
              <Button asChild className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                <Link href="/pretests/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Start First Pre-Test
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
