'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useHolidays, useCreateHoliday, useUpdateHoliday, useDeleteHoliday } from '@/hooks/use-holidays'
import type { Holiday } from '@/types/holiday'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i)

const TYPE_STYLES: Record<string, { label: string; className: string }> = {
  national: { label: 'National', className: 'bg-red-100 text-red-700' },
  company:  { label: 'Company',  className: 'bg-blue-100 text-blue-700' },
}

const schema = z.object({
  name:        z.string().min(2, 'Name is required'),
  date:        z.string().min(1, 'Date is required'),
  type:        z.string().min(1, 'Type is required'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function HolidayDialog({
  open, onOpenChange, holiday,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  holiday: Holiday | null
}) {
  const createMutation = useCreateHoliday()
  const updateMutation = useUpdateHoliday()
  const isEdit = !!holiday

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open && holiday) {
      reset({
        name:        holiday.name,
        date:        holiday.date,
        type:        holiday.type,
        description: holiday.description ?? '',
      })
    } else if (open) {
      reset({ name: '', date: '', type: 'national', description: '' })
    }
  }, [open, holiday, reset])

  function onSubmit(values: FormValues) {
    const data = {
      name:        values.name,
      date:        values.date,
      type:        values.type as 'national' | 'company',
      description: values.description || undefined,
    }

    if (isEdit && holiday) {
      updateMutation.mutate(
        { id: holiday.id, data },
        { onSuccess: () => { reset(); onOpenChange(false) } }
      )
    } else {
      createMutation.mutate(data, { onSuccess: () => { reset(); onOpenChange(false) } })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {isEdit ? 'Edit Holiday' : 'Add Holiday'}
          </DialogTitle>
        </DialogHeader>
        <form id="holiday-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
            <Input id="name" {...register('name')} placeholder="e.g. Independence Day" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Type <span className="text-destructive">*</span></Label>
              <Select
                value={watch('type') ?? 'national'}
                onValueChange={(v) => setValue('type', v, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={2} placeholder="Optional notes..." />
          </div>
        </form>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="holiday-form" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Holiday'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminHolidaysPage() {
  const [year, setYear]             = useState(CURRENT_YEAR)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Holiday | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null)

  const { data: holidays = [], isLoading } = useHolidays(year)
  const deleteMutation = useDeleteHoliday()

  const national = holidays.filter(h => h.type === 'national').length
  const company  = holidays.filter(h => h.type === 'company').length

  function openAdd() {
    setEditTarget(null)
    setDialogOpen(true)
  }

  function openEdit(h: Holiday) {
    setEditTarget(h)
    setDialogOpen(true)
  }

  return (
    <DashboardLayout title="Holiday Calendar" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Holiday Calendar</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage public and company holidays</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add Holiday
          </Button>
        </div>

        {/* Summary + Year filter */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex gap-3">
            <Card className="px-4 py-2">
              <CardContent className="p-0 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="font-bold">{holidays.length}</span>
              </CardContent>
            </Card>
            <Card className="px-4 py-2">
              <CardContent className="p-0 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">National:</span>
                <span className="font-bold text-red-600">{national}</span>
              </CardContent>
            </Card>
            <Card className="px-4 py-2">
              <CardContent className="p-0 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Company:</span>
                <span className="font-bold text-blue-600">{company}</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : holidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No holidays defined for {year}. Click &quot;Add Holiday&quot; to get started.
                  </TableCell>
                </TableRow>
              ) : (
                holidays.map((h) => (
                  <TableRow key={h.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm">{h.name}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {new Date(h.date + 'T00:00:00').toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(h.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long' })}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[h.type]?.className}`}>
                        {TYPE_STYLES[h.type]?.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                      {h.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(h)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(h)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <HolidayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        holiday={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteTarget?.name}&quot; ({deleteTarget?.date})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id, {
                onSuccess: () => setDeleteTarget(null),
              })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
