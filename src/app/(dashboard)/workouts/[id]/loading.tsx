import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function WorkoutDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-56 bg-slate-800" />
              <Skeleton className="h-6 w-24 rounded-full bg-slate-800" />
            </div>
            <Skeleton className="h-5 w-48 mt-2 bg-slate-800" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg bg-slate-800" />
                <div>
                  <Skeleton className="h-4 w-16 bg-slate-800" />
                  <Skeleton className="h-6 w-24 mt-1 bg-slate-800" />
                  <Skeleton className="h-3 w-20 mt-1 bg-slate-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Breakdown */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-slate-800" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <Skeleton className="h-10 w-10 mx-auto bg-slate-700" />
                <Skeleton className="h-4 w-16 mx-auto mt-2 bg-slate-700" />
                <Skeleton className="h-3 w-8 mx-auto mt-1 bg-slate-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exercise Results */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-slate-800" />
          <Skeleton className="h-4 w-56 mt-1 bg-slate-800" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg bg-slate-800" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40 bg-slate-800" />
        <Skeleton className="h-10 w-48 bg-slate-800" />
      </div>
    </div>
  )
}
