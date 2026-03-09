'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useHolidays } from '@/hooks/use-holidays'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i)

const TYPE_STYLES: Record<string, { label: string; className: string }> = {
  national: { label: 'National', className: 'bg-red-100 text-red-700' },
  company:  { label: 'Company',  className: 'bg-blue-100 text-blue-700' },
}

export default function StaffHolidaysPage() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const { data: holidays = [], isLoading } = useHolidays(year)

  const national = holidays.filter(h => h.type === 'national').length
  const company  = holidays.filter(h => h.type === 'company').length

  return (
    <DashboardLayout title="Holidays" allowedRoles={['staff', 'hr', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holiday Calendar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Public and company holidays for the year</p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : holidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No holidays defined for {year}.
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  )
}
