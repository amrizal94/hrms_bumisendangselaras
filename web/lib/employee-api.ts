import { api } from './api'
import type {
  CreateEmployeeData,
  Department,
  Employee,
  EmployeeFilters,
  PaginatedMeta,
  UpdateEmployeeData,
} from '@/types/employee'

interface PaginatedEmployees {
  data: Employee[]
  meta: PaginatedMeta
}

interface PaginatedDepartments {
  data: Department[]
  meta: PaginatedMeta
}

export async function fetchEmployees(filters: EmployeeFilters = {}): Promise<PaginatedEmployees> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/employees', { params })
  return res.data
}

export async function fetchEmployee(id: number): Promise<Employee> {
  const res = await api.get(`/employees/${id}`)
  return res.data.data
}

export async function createEmployee(data: CreateEmployeeData): Promise<Employee> {
  const res = await api.post('/employees', data)
  return res.data.data
}

export async function updateEmployee(id: number, data: UpdateEmployeeData): Promise<Employee> {
  const res = await api.put(`/employees/${id}`, data)
  return res.data.data
}

export async function deleteEmployee(id: number): Promise<void> {
  await api.delete(`/employees/${id}`)
}

export async function toggleEmployeeActive(id: number): Promise<Employee> {
  const res = await api.patch(`/employees/${id}/toggle-active`)
  return res.data.data
}

export async function fetchDepartments(params?: { is_active?: boolean; per_page?: number }): Promise<PaginatedDepartments> {
  const res = await api.get('/departments', { params: { per_page: 100, ...params } })
  return res.data
}
