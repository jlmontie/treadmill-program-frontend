import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AthletesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-9 w-32 bg-slate-800" />
          <Skeleton className="h-5 w-64 mt-2 bg-slate-800" />
        </div>
        <Skeleton className="h-10 w-32 bg-slate-800" />
      </div>

      {/* Athletes grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full bg-slate-800" />
                <div>
                  <Skeleton className="h-5 w-28 bg-slate-800" />
                  <Skeleton className="h-4 w-20 mt-2 bg-slate-800" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 bg-slate-800 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full bg-slate-800 mt-2" />
              <Skeleton className="h-4 w-3/4 bg-slate-800 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
