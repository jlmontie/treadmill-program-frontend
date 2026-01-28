import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

interface AthleteWithPrograms {
  id: string
  name: string
  gender: 'male' | 'female'
  sport: string | null
  position: string | null
  athlete_programs: Array<{
    id: string
    status: string
    programs: { name: string } | null
  }> | null
}

export default async function AthletesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('athletes')
    .select(`
      *,
      athlete_programs (
        id,
        status,
        programs (name)
      )
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching athletes:', error)
  }

  const athletes = (data || []) as unknown as AthleteWithPrograms[]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Athletes</h1>
          <p className="text-slate-400 mt-1">
            Manage your athletes and their training programs
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25">
          <Link href="/athletes/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Athlete
          </Link>
        </Button>
      </div>

      {/* Athletes Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">All Athletes</CardTitle>
          <CardDescription className="text-slate-400">
            {athletes?.length || 0} athletes registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {athletes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Gender</TableHead>
                  <TableHead className="text-slate-400">Sport</TableHead>
                  <TableHead className="text-slate-400">Position</TableHead>
                  <TableHead className="text-slate-400">Current Program</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {athletes.map((athlete) => {
                  const activeProgram = athlete.athlete_programs?.find(
                    (ap) => ap.status === 'active'
                  )
                  
                  return (
                    <TableRow key={athlete.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        <Link 
                          href={`/athletes/${athlete.id}`}
                          className="font-medium text-white hover:text-cyan-400 transition-colors"
                        >
                          {athlete.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={athlete.gender === 'male' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                          }
                        >
                          {athlete.gender}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {athlete.sport || '—'}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {athlete.position || '—'}
                      </TableCell>
                      <TableCell>
                        {activeProgram ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {activeProgram.programs?.name}
                          </Badge>
                        ) : (
                          <span className="text-slate-500">No active program</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <Link href={`/athletes/${athlete.id}`}>View</Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <Link href={`/athletes/${athlete.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-white">No athletes yet</h3>
              <p className="mt-2 text-slate-400">
                Get started by adding your first athlete to the training program.
              </p>
              <Button asChild className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                <Link href="/athletes/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Athlete
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
