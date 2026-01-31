import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function PretestDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-48 bg-slate-800" />
              <Skeleton className="h-6 w-24 rounded-full bg-slate-800" />
            </div>
            <Skeleton className="h-5 w-64 mt-2 bg-slate-800" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 ml-14 md:ml-0 bg-slate-800" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Session Info */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <Skeleton className="h-6 w-32 bg-slate-800" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 bg-slate-800" />
                <Skeleton className="h-5 w-32 mt-1 bg-slate-800" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Metabolic Results */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-slate-800" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/50">
                  <Skeleton className="h-4 w-16 bg-slate-700" />
                  <Skeleton className="h-6 w-12 mt-1 bg-slate-700" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Program Recommendation */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-slate-800" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-800/50">
              <Skeleton className="h-5 w-24 bg-slate-700" />
              <Skeleton className="h-4 w-full mt-2 bg-slate-700" />
            </div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg bg-slate-800" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step Results */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-slate-800" />
          <Skeleton className="h-4 w-48 mt-1 bg-slate-800" />
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
