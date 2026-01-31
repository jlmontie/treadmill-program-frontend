'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function WorkoutSessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Workout session error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full bg-slate-900/50 border-slate-800">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <CardTitle className="text-white text-2xl">Workout Session Error</CardTitle>
          <CardDescription className="text-slate-400 mt-2">
            {error.message || 'An error occurred while loading the workout session.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm text-amber-400">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Your workout progress is automatically saved. You can safely retry or return later.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={reset}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button 
              asChild
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Link href="/workouts">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Workouts
              </Link>
            </Button>
            <Button 
              asChild
              variant="ghost"
              className="w-full text-slate-400 hover:text-white"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
          
          {error.digest && (
            <p className="text-xs text-slate-500 text-center mt-4">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
