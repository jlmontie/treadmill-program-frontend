import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardX, ArrowLeft, ClipboardCheck } from 'lucide-react'

export default function PretestNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full bg-slate-900/50 border-slate-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <ClipboardX className="h-8 w-8 text-slate-500" />
          </div>
          <CardTitle className="text-xl text-white">Pre-Test Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-400">
            The pre-test session you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Link href="/pretests">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pre-Tests
              </Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
              <Link href="/pretests/new">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Start New Pre-Test
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
