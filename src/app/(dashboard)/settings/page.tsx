export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ProfileForm } from './profile-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings | TreadTrack',
  description: 'Manage your account and application preferences',
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { success, error } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data } = user?.id 
    ? await supabase
        .from('trainers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()
    : { data: null }

  const trainer = data as { name: string; email: string } | null
  const needsSetup = !trainer?.name

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-slate-400 mt-1">
          Manage your account and application preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="max-w-2xl p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <p className="text-emerald-400">Profile updated successfully!</p>
        </div>
      )}
      {error && (
        <div className="max-w-2xl p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-red-400">Failed to update profile. Please try again.</p>
        </div>
      )}

      {/* Setup Required Banner */}
      {needsSetup && (
        <div className="max-w-2xl p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          <div>
            <p className="text-amber-400 font-medium">Complete Your Profile</p>
            <p className="text-amber-400/80 text-sm">Please add your name to start using the app.</p>
          </div>
        </div>
      )}

      {/* Profile Settings */}
      <Card className={`max-w-2xl bg-slate-900/50 border-slate-800 ${needsSetup ? 'ring-2 ring-amber-500/50' : ''}`}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-cyan-400" />
            Profile
          </CardTitle>
          <CardDescription className="text-slate-400">
            Your trainer profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm 
            currentName={trainer?.name || ''} 
            email={trainer?.email || user?.email || ''} 
          />
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card className="max-w-2xl bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-400" />
            Application
          </CardTitle>
          <CardDescription className="text-slate-400">
            Application preferences and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div>
              <p className="font-medium text-white">Theme</p>
              <p className="text-sm text-slate-500">Application color scheme</p>
            </div>
            <Button variant="outline" disabled className="border-slate-700 text-slate-400">
              Dark (Default)
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div>
              <p className="font-medium text-white">Notifications</p>
              <p className="text-sm text-slate-500">Browser notifications for workout events</p>
            </div>
            <Button variant="outline" disabled className="border-slate-700 text-slate-400">
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="max-w-2xl bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-slate-400">
            <span className="text-white font-medium">TreadTrack</span> — Treadmill Training Program
          </p>
          <p className="text-sm text-slate-500">
            Version 1.0.0 • Built with Next.js and Supabase
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
