import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function WorkoutsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-9 w-40 bg-slate-800" />
          <Skeleton className="h-5 w-56 mt-2 bg-slate-800" />
        </div>
        <Skeleton className="h-10 w-36 bg-slate-800" />
      </div>

      {/* Workouts list */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-slate-800" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full bg-slate-700" />
                  <div>
                    <Skeleton className="h-5 w-32 bg-slate-700" />
                    <Skeleton className="h-4 w-48 mt-2 bg-slate-700" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20 bg-slate-700 rounded-full" />
                  <Skeleton className="h-4 w-24 bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
