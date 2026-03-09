'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useSettings, useUpdateSettings } from '@/hooks/use-settings'

// ─── Company Tab ──────────────────────────────────────────────────────────────

const companySchema = z.object({
  name:    z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  phone:   z.string().optional(),
  email:   z.string().optional(),
})

type CompanyForm = z.infer<typeof companySchema>

function CompanyTab() {
  const { data } = useSettings()
  const { mutate, isPending } = useUpdateSettings()

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: '', address: '', phone: '', email: '' },
  })

  useEffect(() => {
    if (data?.data?.company) {
      const c = data.data.company
      form.reset({
        name:    c['company.name']    ?? '',
        address: c['company.address'] ?? '',
        phone:   c['company.phone']   ?? '',
        email:   c['company.email']   ?? '',
      })
    }
  }, [data, form])

  function onSubmit(values: CompanyForm) {
    mutate(
      { company: { name: values.name, address: values.address ?? '', phone: values.phone ?? '', email: values.email ?? '' } },
      {
        onSuccess: () => toast.success('Company settings saved.'),
        onError:   () => toast.error('Failed to save settings.'),
      }
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="cname">Company Name</Label>
        <Input id="cname" {...form.register('name')} />
        {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="caddress">Address</Label>
        <Input id="caddress" {...form.register('address')} placeholder="Jl. Example No. 1..." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cphone">Phone</Label>
        <Input id="cphone" {...form.register('phone')} placeholder="+62..." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cemail">Email</Label>
        <Input id="cemail" type="email" {...form.register('email')} placeholder="info@company.com" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Company Info
      </Button>
    </form>
  )
}

// ─── Attendance Policy Tab ────────────────────────────────────────────────────

const attendanceSchema = z.object({
  work_start:        z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  late_threshold:    z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  work_end:          z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  geofence_enabled:  z.boolean(),
  office_latitude:   z.string(),
  office_longitude:  z.string(),
  office_radius:     z.string(),
  check_in_method:   z.enum(['any', 'face_only', 'manual_only']),
})

type AttendanceForm = z.infer<typeof attendanceSchema>

function AttendancePolicyTab() {
  const { data } = useSettings()
  const { mutate, isPending } = useUpdateSettings()

  const form = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      work_start: '08:00', late_threshold: '09:00', work_end: '17:00',
      geofence_enabled: false, office_latitude: '', office_longitude: '', office_radius: '200',
      check_in_method: 'any' as const,
    },
  })

  const geofenceEnabled = form.watch('geofence_enabled')

  useEffect(() => {
    if (data?.data?.attendance) {
      const a = data.data.attendance
      form.reset({
        work_start:       a['attendance.work_start']       ?? '08:00',
        late_threshold:   a['attendance.late_threshold']   ?? '09:00',
        work_end:         a['attendance.work_end']         ?? '17:00',
        geofence_enabled: a['attendance.geofence_enabled'] === '1',
        office_latitude:  a['attendance.office_latitude']  ?? '',
        office_longitude: a['attendance.office_longitude'] ?? '',
        office_radius:    a['attendance.office_radius']    ?? '200',
        check_in_method:  (a['attendance.check_in_method'] ?? 'any') as 'any' | 'face_only' | 'manual_only',
      })
    }
  }, [data, form])

  function onSubmit(values: AttendanceForm) {
    mutate(
      {
        attendance: {
          work_start: values.work_start, late_threshold: values.late_threshold, work_end: values.work_end,
          geofence_enabled: values.geofence_enabled,
          office_latitude:  values.office_latitude  || null,
          office_longitude: values.office_longitude || null,
          office_radius:    values.office_radius,
          check_in_method:  values.check_in_method,
        },
      },
      {
        onSuccess: () => toast.success('Attendance policy saved.'),
        onError:   () => toast.error('Failed to save settings.'),
      }
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm text-amber-800">
        Changes to attendance policy affect future check-in status calculations.
      </div>

      {/* Work Hours */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="work_start">Work Start Time</Label>
          <Input id="work_start" type="time" {...form.register('work_start')} className="w-36" />
          <p className="text-xs text-muted-foreground">Expected start of the work day.</p>
          {form.formState.errors.work_start && <p className="text-xs text-red-500">{form.formState.errors.work_start.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="late_threshold">Late Check-In Threshold</Label>
          <Input id="late_threshold" type="time" {...form.register('late_threshold')} className="w-36" />
          <p className="text-xs text-muted-foreground">Employees checking in after this time are marked <strong>Late</strong>.</p>
          {form.formState.errors.late_threshold && <p className="text-xs text-red-500">{form.formState.errors.late_threshold.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="work_end">Work End Time</Label>
          <Input id="work_end" type="time" {...form.register('work_end')} className="w-36" />
          {form.formState.errors.work_end && <p className="text-xs text-red-500">{form.formState.errors.work_end.message}</p>}
        </div>
      </div>

      <Separator />

      {/* Geofence */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">GPS Geofencing</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Restrict check-in to within a set radius of the office.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="geofence_enabled"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            {...form.register('geofence_enabled')}
          />
          <Label htmlFor="geofence_enabled" className="cursor-pointer">Enable Geofencing</Label>
        </div>
        {geofenceEnabled && (
          <div className="space-y-3 pl-1">
            <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-xs text-blue-800">
              Get your office coordinates from{' '}
              <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="underline font-medium">Google Maps</a>
              {' '}— right-click on the office location → copy coordinates.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="office_latitude">Office Latitude</Label>
                <Input id="office_latitude" type="number" step="any" placeholder="-6.2088" {...form.register('office_latitude')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="office_longitude">Office Longitude</Label>
                <Input id="office_longitude" type="number" step="any" placeholder="106.8456" {...form.register('office_longitude')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="office_radius">Allowed Radius (meters)</Label>
              <div className="flex items-center gap-2">
                <Input id="office_radius" type="number" min="50" max="10000" step="50" {...form.register('office_radius')} className="w-28" />
                <span className="text-sm text-muted-foreground">meters from office</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Check-In Method */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Check-In Method</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Control how staff members are allowed to check in via the mobile app.</p>
        </div>
        <div className="space-y-2">
          {([
            { value: 'any',         label: 'Any Method',   desc: 'Staff may choose between face recognition or the manual button.' },
            { value: 'face_only',   label: 'Face Only',    desc: 'Staff must use face recognition. Manual check-in button is disabled.' },
            { value: 'manual_only', label: 'Manual Only',  desc: 'Staff use the manual button only. Face check-in is disabled.' },
          ] as const).map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                value={opt.value}
                className="mt-0.5 accent-primary"
                {...form.register('check_in_method')}
              />
              <div>
                <p className="text-sm font-medium leading-tight">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Attendance Policy
      </Button>
    </form>
  )
}

// ─── Payroll Policy Tab ───────────────────────────────────────────────────────

const payrollSchema = z.object({
  tax_rate:  z.string().regex(/^\d+(\.\d+)?$/, 'Must be a number').refine(v => parseFloat(v) >= 0 && parseFloat(v) <= 100, 'Must be 0–100'),
  bpjs_rate: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a number').refine(v => parseFloat(v) >= 0 && parseFloat(v) <= 100, 'Must be 0–100'),
})

type PayrollForm = z.infer<typeof payrollSchema>

function PayrollPolicyTab() {
  const { data } = useSettings()
  const { mutate, isPending } = useUpdateSettings()

  const form = useForm<PayrollForm>({
    resolver: zodResolver(payrollSchema),
    defaultValues: { tax_rate: '5', bpjs_rate: '3' },
  })

  useEffect(() => {
    if (data?.data?.payroll) {
      const p = data.data.payroll
      form.reset({
        tax_rate:  p['payroll.tax_rate']  ?? '5',
        bpjs_rate: p['payroll.bpjs_rate'] ?? '3',
      })
    }
  }, [data, form])

  function onSubmit(values: PayrollForm) {
    mutate(
      { payroll: { tax_rate: values.tax_rate, bpjs_rate: values.bpjs_rate } },
      {
        onSuccess: () => toast.success('Payroll policy saved.'),
        onError:   () => toast.error('Failed to save settings.'),
      }
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm text-amber-800">
        Changes apply to newly generated payroll records. Existing records are not affected.
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tax_rate">Income Tax Rate — PPh21 (%)</Label>
        <div className="flex items-center gap-2">
          <Input id="tax_rate" type="number" min="0" max="100" step="0.5" {...form.register('tax_rate')} className="w-28" />
          <span className="text-sm text-muted-foreground">% of gross salary</span>
        </div>
        {form.formState.errors.tax_rate && <p className="text-xs text-red-500">{form.formState.errors.tax_rate.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bpjs_rate">BPJS Contribution Rate (%)</Label>
        <div className="flex items-center gap-2">
          <Input id="bpjs_rate" type="number" min="0" max="100" step="0.5" {...form.register('bpjs_rate')} className="w-28" />
          <span className="text-sm text-muted-foreground">% of basic salary</span>
        </div>
        {form.formState.errors.bpjs_rate && <p className="text-xs text-red-500">{form.formState.errors.bpjs_rate.message}</p>}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Payroll Policy
      </Button>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  return (
    <DashboardLayout title="Settings" allowedRoles={['admin', 'director']}>
      <div className="max-w-2xl space-y-6">
        <Tabs defaultValue="company">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-6">
            <CompanyTab />
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <AttendancePolicyTab />
          </TabsContent>

          <TabsContent value="payroll" className="mt-6">
            <PayrollPolicyTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
