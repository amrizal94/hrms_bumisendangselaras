'use client'

import { useState } from 'react'
import { CheckCircle2, Search, Trash2, UserCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useFaceEnrollments, useDeleteFaceData } from '@/hooks/use-face-data'
import { EnrollFaceDialog } from './enroll-face-dialog'
import { AuditLogTab } from './audit-log-tab'
import type { FaceEnrollmentStatus } from '@/types/face'

export default function AdminFacePage() {
  const [search, setSearch] = useState('')
  const [enrolledFilter, setEnrolledFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [enrollTarget, setEnrollTarget] = useState<FaceEnrollmentStatus | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FaceEnrollmentStatus | null>(null)

  const { data, isLoading } = useFaceEnrollments({
    page,
    search: search || undefined,
    enrolled: enrolledFilter === 'all' ? undefined : enrolledFilter === 'true',
  })

  const deleteMutation = useDeleteFaceData()

  function handleDelete() {
    if (!deleteTarget?.face_data) return
    deleteMutation.mutate(deleteTarget.face_data.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const meta = data?.meta
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <DashboardLayout title="Face Management" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      <Tabs defaultValue="enrollment">
        <TabsList className="mb-6">
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
        </TabsList>

        {/* ── Enrollment tab ─────────────────────────────────────────── */}
        <TabsContent value="enrollment">
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border p-4 flex items-center gap-4 bg-card">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><UserCheck className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Active</p>
                  <p className="text-2xl font-bold">{meta?.total ?? '—'}</p>
                </div>
              </div>
              <div className="rounded-xl border p-4 flex items-center gap-4 bg-card">
                <div className="p-2 rounded-lg bg-green-100 text-green-600"><CheckCircle2 className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrolled</p>
                  <p className="text-2xl font-bold">{meta?.enrolled ?? '—'}</p>
                </div>
              </div>
              <div className="rounded-xl border p-4 flex items-center gap-4 bg-card">
                <div className="p-2 rounded-lg bg-red-100 text-red-600"><XCircle className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Not Enrolled</p>
                  <p className="text-2xl font-bold">{meta?.not_enrolled ?? '—'}</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search employee..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              <Select value={enrolledFilter} onValueChange={v => { setEnrolledFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Enrollment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Enrolled</SelectItem>
                  <SelectItem value="false">Not Enrolled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled At</TableHead>
                    <TableHead>Enrolled By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  )}
                  {!isLoading && (!data?.data || data.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No employees found.</TableCell>
                    </TableRow>
                  )}
                  {data?.data?.map(emp => (
                    <TableRow key={emp.employee_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {emp.face_data?.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={emp.face_data.image_url} alt="" className="w-8 h-8 rounded-full object-cover border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {emp.user.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{emp.user.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.employee_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{emp.department?.name ?? '—'}</TableCell>
                      <TableCell className="text-sm">{emp.position}</TableCell>
                      <TableCell>
                        {emp.is_enrolled ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Enrolled</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-200">Not Enrolled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {emp.face_data?.enrolled_at ? fmtDate(emp.face_data.enrolled_at) : '—'}
                      </TableCell>
                      <TableCell className="text-sm">{emp.face_data?.enrolled_by?.name ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant={emp.is_enrolled ? 'outline' : 'default'}
                            onClick={() => setEnrollTarget(emp)}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            {emp.is_enrolled ? 'Re-enroll' : 'Enroll'}
                          </Button>
                          {emp.is_enrolled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(emp)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex justify-end items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="text-sm text-muted-foreground">Page {meta.current_page} / {meta.last_page}</span>
                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </div>

          {/* Enroll dialog */}
          <EnrollFaceDialog employee={enrollTarget} onOpenChange={open => !open && setEnrollTarget(null)} />

          {/* Delete confirmation */}
          <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Face Data</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove face enrollment for <strong>{deleteTarget?.user.name}</strong>? They will need to be re-enrolled for face attendance.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ── Audit Log tab ──────────────────────────────────────────── */}
        <TabsContent value="audit-log">
          <AuditLogTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
