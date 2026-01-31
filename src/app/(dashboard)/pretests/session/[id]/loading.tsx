import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function PretestSessionLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
          <div>
            <Skeleton className="h-8 w-48 bg-slate-800" />
            <Skeleton className="h-5 w-64 mt-2 bg-slate-800" />
          </div>
        </div>
        <div className="flex gap-3 ml-14 md:ml-0">
          <Skeleton className="h-10 w-32 bg-slate-800" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-24 bg-slate-800" />
          <Skeleton className="h-5 w-12 bg-slate-800" />
        </div>
        <Skeleton className="h-3 w-full rounded-full bg-slate-800" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Step List */}
        <div className="lg:col-span-2 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 bg-slate-800" />
                    <Skeleton className="h-4 w-56 mt-1 bg-slate-800" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full bg-slate-800" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current Step Card */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-900/50 border-slate-800 sticky top-4">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-slate-800" />
              <Skeleton className="h-4 w-48 mt-1 bg-slate-800" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <Skeleton className="h-5 w-full bg-slate-700" />
                <Skeleton className="h-5 w-3/4 mt-2 bg-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-lg bg-slate-800" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
