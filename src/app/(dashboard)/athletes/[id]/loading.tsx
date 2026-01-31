import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AthleteDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-48 bg-slate-800" />
              <Skeleton className="h-6 w-16 rounded-full bg-slate-800" />
            </div>
            <Skeleton className="h-5 w-32 mt-2 bg-slate-800" />
          </div>
        </div>
        <div className="flex gap-3 ml-12 md:ml-0">
          <Skeleton className="h-10 w-24 bg-slate-800" />
          <Skeleton className="h-10 w-36 bg-slate-800" />
          <Skeleton className="h-10 w-36 bg-slate-800" />
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details Card */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <Skeleton className="h-6 w-24 bg-slate-800" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 bg-slate-800" />
                <Skeleton className="h-5 w-32 mt-1 bg-slate-800" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current Program Card */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <Skeleton className="h-6 w-36 bg-slate-800" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-4 w-20 bg-slate-800" />
              <Skeleton className="h-5 w-40 mt-1 bg-slate-800" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 bg-slate-800" />
              <div className="mt-2">
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-28 bg-slate-800" />
                  <Skeleton className="h-4 w-12 bg-slate-800" />
                </div>
                <Skeleton className="h-2 w-full rounded-full bg-slate-800" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-Tests Card */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <Skeleton className="h-6 w-24 bg-slate-800" />
            <Skeleton className="h-4 w-36 mt-1 bg-slate-800" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg bg-slate-800" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program History Card */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <Skeleton className="h-6 w-36 bg-slate-800" />
          <Skeleton className="h-4 w-56 mt-1 bg-slate-800" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg bg-slate-800" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
