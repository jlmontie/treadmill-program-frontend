import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-slate-900/50 border-slate-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <span className="text-8xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              404
            </span>
          </div>
          <CardTitle className="text-white text-2xl">Page Not Found</CardTitle>
          <CardDescription className="text-slate-400 mt-2">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button 
            asChild
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Link href="/athletes">
              <Search className="mr-2 h-4 w-4" />
              Find Athletes
            </Link>
          </Button>
          <Button 
            asChild
            variant="ghost"
            className="w-full text-slate-400 hover:text-white"
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
