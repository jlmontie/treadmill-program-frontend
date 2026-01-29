import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-9 w-48 bg-slate-800" />
          <Skeleton className="h-5 w-72 mt-2 bg-slate-800" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 bg-slate-800" />
          <Skeleton className="h-10 w-36 bg-slate-800" />
        </div>
      </div>

      {/* Active sessions skeleton */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-40 bg-slate-800" />
              <Skeleton className="h-4 w-52 mt-2 bg-slate-800" />
            </div>
            <Skeleton className="h-8 w-16 bg-slate-800" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 bg-slate-800 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24 bg-slate-800" />
              <Skeleton className="h-9 w-9 rounded-lg bg-slate-800" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content grid skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-slate-800" />
            <Skeleton className="h-4 w-56 mt-2 bg-slate-800" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 bg-slate-800 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-slate-800" />
            <Skeleton className="h-4 w-48 mt-2 bg-slate-800" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 bg-slate-800 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
