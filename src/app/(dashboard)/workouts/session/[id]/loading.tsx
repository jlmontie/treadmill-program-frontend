import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function WorkoutSessionLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
          <div>
            <Skeleton className="h-8 w-56 bg-slate-800" />
            <Skeleton className="h-5 w-72 mt-2 bg-slate-800" />
          </div>
        </div>
        <div className="flex gap-3 ml-14 md:ml-0">
          <Skeleton className="h-10 w-32 bg-slate-800" />
          <Skeleton className="h-10 w-36 bg-slate-800" />
        </div>
      </div>

      {/* Progress Card */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-32 bg-slate-800" />
            <Skeleton className="h-5 w-16 bg-slate-800" />
          </div>
          <Skeleton className="h-3 w-full rounded-full bg-slate-800" />
          <div className="flex justify-between mt-2">
            <Skeleton className="h-4 w-36 bg-slate-800" />
            <Skeleton className="h-4 w-24 bg-slate-800" />
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise Card */}
      <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-2 border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full bg-slate-800" />
              <div>
                <Skeleton className="h-7 w-40 bg-slate-800" />
                <Skeleton className="h-5 w-56 mt-1 bg-slate-800" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-full bg-slate-800" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exercise Details */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-4 rounded-lg bg-slate-800/50">
                <Skeleton className="h-4 w-12 mx-auto bg-slate-700" />
                <Skeleton className="h-8 w-16 mx-auto mt-2 bg-slate-700" />
              </div>
            ))}
          </div>

          {/* Speed Selection */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 bg-slate-800" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg bg-slate-800" />
              ))}
            </div>
          </div>

          {/* Completion Buttons */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-40 bg-slate-800" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg bg-slate-800" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-slate-800" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg bg-slate-800" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
