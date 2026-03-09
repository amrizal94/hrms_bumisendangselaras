import type { Shift } from './shift'

export interface Department {
  id: number
  name: string
  code: string
  description?: string | null
  is_active: boolean
  manager?: { id: number; name: string } | null
  employees_count?: number
}

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern'
export type EmployeeStatus = 'active' | 'inactive' | 'terminated' | 'on_leave'
export type Gender = 'male' | 'female'

export interface Employee {
  id: number
  employee_number: string
  position: string
  employment_type: EmploymentType
  status: EmployeeStatus
  join_date: string
  end_date?: string | null
  basic_salary: string
  gender?: Gender | null
  birth_date?: string | null
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  bank_name?: string | null
  bank_account_number?: string | null
  tax_id?: string | null
  national_id?: string | null
  user: {
    id: number
    name: string
    email: string
    phone?: string | null
    avatar?: string | null
    is_active: boolean
    role?: string
  }
  department?: {
    id: number
    name: string
    code: string
  } | null
  shift_id?: number | null
  shift?: Shift | null
}

export interface PaginatedMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface EmployeeFilters {
  search?: string
  department_id?: number | string
  status?: string
  employment_type?: string
  page?: number
  per_page?: number
}

export interface CreateEmployeeData {
  // User account
  name: string
  email: string
  phone?: string
  password?: string
  // Employee record
  employee_number: string
  department_id?: number | null
  shift_id?: number | null
  position: string
  employment_type: EmploymentType
  status: EmployeeStatus
  join_date: string
  end_date?: string | null
  basic_salary: number | string
  gender?: Gender | null
  birth_date?: string | null
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  bank_name?: string | null
  bank_account_number?: string | null
  tax_id?: string | null
  national_id?: string | null
  role?: string
}

export type UpdateEmployeeData = Omit<CreateEmployeeData, 'password'>
