import { api } from './api'
import type {
  Label,
  Project,
  Task,
  ChecklistItem,
  CreateProjectData,
  CreateTaskData,
  ProjectFilters,
  TaskFilters,
  UpdateProjectData,
  UpdateTaskData,
} from '@/types/task'
import type { PaginatedMeta } from '@/types/employee'

interface PaginatedProjects {
  data: Project[]
  meta: PaginatedMeta
}

interface PaginatedTasks {
  data: Task[]
  meta: PaginatedMeta
}

function cleanParams(obj: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
}

// ── Labels ───────────────────────────────────────────────────────────────────

export async function fetchLabels(): Promise<Label[]> {
  const res = await api.get('/labels')
  return res.data.data
}

export async function createLabel(data: { name: string; color: string }): Promise<Label> {
  const res = await api.post('/labels', data)
  return res.data.data
}

export async function updateLabel(id: number, data: { name: string; color: string }): Promise<Label> {
  const res = await api.put(`/labels/${id}`, data)
  return res.data.data
}

export async function deleteLabel(id: number): Promise<void> {
  await api.delete(`/labels/${id}`)
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function fetchProjects(filters: ProjectFilters = {}): Promise<PaginatedProjects> {
  const res = await api.get('/projects', { params: cleanParams(filters as Record<string, unknown>) })
  return res.data
}

export async function fetchProject(id: number): Promise<Project> {
  const res = await api.get(`/projects/${id}`)
  return res.data.data
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  const res = await api.post('/projects', data)
  return res.data.data
}

export async function updateProject(id: number, data: UpdateProjectData): Promise<Project> {
  const res = await api.put(`/projects/${id}`, data)
  return res.data.data
}

export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/projects/${id}`)
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function fetchTasks(filters: TaskFilters = {}): Promise<PaginatedTasks> {
  const res = await api.get('/tasks', { params: cleanParams(filters as Record<string, unknown>) })
  return res.data
}

export async function fetchTask(id: number): Promise<Task> {
  const res = await api.get(`/tasks/${id}`)
  return res.data.data
}

export async function createTask(data: CreateTaskData): Promise<Task> {
  const res = await api.post('/tasks', data)
  return res.data.data
}

export async function updateTask(id: number, data: UpdateTaskData): Promise<Task> {
  const res = await api.put(`/tasks/${id}`, data)
  return res.data.data
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`)
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export async function addChecklistItem(taskId: number, title: string): Promise<ChecklistItem> {
  const res = await api.post(`/tasks/${taskId}/checklist`, { title })
  return res.data.data
}

export async function toggleChecklistItem(taskId: number, itemId: number): Promise<{ id: number; is_done: boolean }> {
  const res = await api.patch(`/tasks/${taskId}/checklist/${itemId}/toggle`)
  return res.data.data
}

export async function deleteChecklistItem(taskId: number, itemId: number): Promise<void> {
  await api.delete(`/tasks/${taskId}/checklist/${itemId}`)
}
