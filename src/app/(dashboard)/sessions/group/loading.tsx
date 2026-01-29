import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function GroupSessionLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 bg-slate-800" />
          <div>
            <Skeleton className="h-9 w-48 bg-slate-800" />
            <Skeleton className="h-5 w-64 mt-2 bg-slate-800" />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-28 bg-slate-800 rounded-full" />
          <Skeleton className="h-6 w-32 bg-slate-800 rounded-full" />
        </div>
        <Skeleton className="h-10 w-32 bg-slate-800" />
      </div>

      {/* Workout Cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full bg-slate-800" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-32 bg-slate-800" />
                  <Skeleton className="h-4 w-24 mt-2 bg-slate-800" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-16 w-16 rounded-xl bg-slate-800" />
                  <Skeleton className="h-16 w-16 rounded-xl bg-slate-800" />
                  <Skeleton className="h-16 w-16 rounded-xl bg-slate-800" />
                  <Skeleton className="h-16 w-16 rounded-xl bg-slate-800" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
              </div>
              <Skeleton className="h-2 w-full mt-3 bg-slate-800 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
