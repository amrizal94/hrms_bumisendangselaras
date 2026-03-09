'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCreateEmployee, useDepartments, useUpdateEmployee } from '@/hooks/use-employees'
import { useShifts } from '@/hooks/use-shifts'
import { useAuthStore } from '@/store/auth-store'
import type { Department, Employee } from '@/types/employee'
import type { Shift } from '@/types/shift'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Min 8 characters').optional().or(z.literal('')),
  employee_number: z.string().min(1, 'Employee number is required'),
  department_id: z.string().optional(),
  shift_id: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  status: z.enum(['active', 'inactive', 'terminated', 'on_leave']),
  join_date: z.string().min(1, 'Join date is required'),
  end_date: z.string().optional(),
  basic_salary: z.string().min(1, 'Salary is required'),
  gender: z.enum(['male', 'female', '']).optional(),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  tax_id: z.string().optional(),
  national_id: z.string().optional(),
  role: z.enum(['staff', 'hr', 'manager', 'admin', 'director']),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
}

const ROLE_LABELS: Record<string, string> = {
  staff: 'Staff',
  hr: 'HR',
  manager: 'Manager',
  admin: 'Admin',
  director: 'Director',
}

export function EmployeeFormDialog({ open, onOpenChange, employee }: Props) {
  const isEdit = !!employee
  const currentUser = useAuthStore((s) => s.user)
  const availableRoles = currentUser?.role === 'director'
    ? ['staff', 'hr', 'manager', 'admin', 'director']
    : ['staff', 'hr', 'manager']

  const { data: deptData } = useDepartments()
  const departments: Department[] = deptData?.data ?? []
  const { data: shiftsData } = useShifts({ is_active: true, per_page: 100 })
  const shifts: Shift[] = shiftsData?.data ?? []

  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employment_type: 'full_time',
      status: 'active',
      role: 'staff',
    },
  })

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          name: employee.user.name,
          email: employee.user.email,
          phone: employee.user.phone ?? '',
          password: '',
          employee_number: employee.employee_number,
          department_id: employee.department?.id?.toString() ?? '',
          shift_id: employee.shift_id?.toString() ?? 'none',
          position: employee.position,
          employment_type: employee.employment_type,
          status: employee.status,
          join_date: employee.join_date,
          end_date: employee.end_date ?? '',
          basic_salary: employee.basic_salary,
          gender: employee.gender ?? '',
          birth_date: employee.birth_date ?? '',
          address: employee.address ?? '',
          emergency_contact_name: employee.emergency_contact_name ?? '',
          emergency_contact_phone: employee.emergency_contact_phone ?? '',
          bank_name: employee.bank_name ?? '',
          bank_account_number: employee.bank_account_number ?? '',
          tax_id: employee.tax_id ?? '',
          national_id: employee.national_id ?? '',
          role: (employee.user.role as FormValues['role']) ?? 'staff',
        })
      } else {
        reset({
          employment_type: 'full_time',
          status: 'active',
          department_id: '',
          shift_id: 'none',
          gender: '',
          role: 'staff',
        })
      }
    }
  }, [open, employee, reset])

  function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      employee_number: values.employee_number,
      department_id: values.department_id ? parseInt(values.department_id) : null,
      shift_id: values.shift_id && values.shift_id !== 'none' ? parseInt(values.shift_id) : null,
      position: values.position,
      employment_type: values.employment_type,
      status: values.status,
      join_date: values.join_date,
      end_date: values.end_date || null,
      basic_salary: parseFloat(values.basic_salary),
      gender: (values.gender as 'male' | 'female') || null,
      birth_date: values.birth_date || null,
      address: values.address || null,
      emergency_contact_name: values.emergency_contact_name || null,
      emergency_contact_phone: values.emergency_contact_phone || null,
      bank_name: values.bank_name || null,
      bank_account_number: values.bank_account_number || null,
      tax_id: values.tax_id || null,
      national_id: values.national_id || null,
      role: values.role,
    }

    if (isEdit && employee) {
      updateMutation.mutate(
        { id: employee.id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(
        { ...payload, password: values.password || undefined },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-1">

            {/* Personal Info */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                  <Input id="name" {...register('name')} placeholder="Full Name" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" {...register('email')} placeholder="email@company.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register('phone')} placeholder="+62..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Role <span className="text-destructive">*</span></Label>
                  <Select
                    value={watch('role') || 'staff'}
                    onValueChange={(v) => setValue('role', v as FormValues['role'])}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!isEdit && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" {...register('password')} placeholder="Default: employee number" />
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select
                    value={watch('gender') || 'unspecified'}
                    onValueChange={(v) => setValue('gender', (v === 'unspecified' ? '' : v) as 'male' | 'female' | '')}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unspecified">— Not specified —</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birth_date">Date of Birth</Label>
                  <Input id="birth_date" type="date" {...register('birth_date')} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" {...register('address')} placeholder="Full address..." rows={2} />
                </div>
              </div>
            </section>

            {/* Employment Info */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Employment Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="employee_number">Employee Number <span className="text-destructive">*</span></Label>
                  <Input id="employee_number" {...register('employee_number')} placeholder="EMP001" />
                  {errors.employee_number && <p className="text-xs text-destructive">{errors.employee_number.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select
                    value={watch('department_id') || 'none'}
                    onValueChange={(v) => setValue('department_id', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No Department —</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Shift</Label>
                  <Select
                    value={watch('shift_id') || 'none'}
                    onValueChange={(v) => setValue('shift_id', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No Shift —</SelectItem>
                      {shifts.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name} ({s.check_in_time}–{s.check_out_time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="position">Position <span className="text-destructive">*</span></Label>
                  <Input id="position" {...register('position')} placeholder="e.g. Software Engineer" />
                  {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Employment Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={watch('employment_type')}
                    onValueChange={(v) => setValue('employment_type', v as FormValues['employment_type'])}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status <span className="text-destructive">*</span></Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(v) => setValue('status', v as FormValues['status'])}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="join_date">Join Date <span className="text-destructive">*</span></Label>
                  <Input id="join_date" type="date" {...register('join_date')} />
                  {errors.join_date && <p className="text-xs text-destructive">{errors.join_date.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input id="end_date" type="date" {...register('end_date')} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="basic_salary">Basic Salary (IDR) <span className="text-destructive">*</span></Label>
                  <Input id="basic_salary" type="number" min="0" {...register('basic_salary')} placeholder="0" />
                  {errors.basic_salary && <p className="text-xs text-destructive">{errors.basic_salary.message}</p>}
                </div>
              </div>
            </section>

            {/* Emergency Contact */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_name">Contact Name</Label>
                  <Input id="emergency_contact_name" {...register('emergency_contact_name')} placeholder="Contact person name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                  <Input id="emergency_contact_phone" {...register('emergency_contact_phone')} placeholder="+62..." />
                </div>
              </div>
            </section>

            {/* Bank & Tax Info */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Bank & Tax Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input id="bank_name" {...register('bank_name')} placeholder="e.g. BCA" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input id="bank_account_number" {...register('bank_account_number')} placeholder="1234567890" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="national_id">KTP (National ID)</Label>
                  <Input id="national_id" {...register('national_id')} placeholder="16-digit KTP" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tax_id">NPWP (Tax ID)</Label>
                  <Input id="tax_id" {...register('tax_id')} placeholder="NPWP number" />
                </div>
              </div>
            </section>
          </form>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Employee'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
