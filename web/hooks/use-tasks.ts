'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  addChecklistItem,
  createLabel,
  createProject,
  createTask,
  deleteChecklistItem,
  deleteLabel,
  deleteProject,
  deleteTask,
  fetchLabels,
  fetchProject,
  fetchProjects,
  fetchTask,
  fetchTasks,
  toggleChecklistItem,
  updateLabel,
  updateProject,
  updateTask,
} from '@/lib/task-api'
import type {
  CreateProjectData,
  CreateTaskData,
  ProjectFilters,
  TaskFilters,
  UpdateProjectData,
  UpdateTaskData,
} from '@/types/task'

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
    if (res?.data?.errors) return Object.values(res.data.errors).flat().join(', ')
    if (res?.data?.message) return res.data.message
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred.'
}

// ── Labels ────────────────────────────────────────────────────────────────────

export function useLabels() {
  return useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateLabel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; color: string }) => createLabel(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['labels'] }); toast.success('Label created.') },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateLabel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; color: string } }) => updateLabel(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['labels'] }); toast.success('Label updated.') },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteLabel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteLabel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['labels'] }); toast.success('Label deleted.') },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

// ── Projects ──────────────────────────────────────────────────────────────────

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => fetchProjects(filters),
  })
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectData) => createProject(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project created.') },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectData }) => updateProject(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project updated.') },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project deleted.') },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
  })
}

export function useTask(id: number) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => fetchTask(id),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskData) => createTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Task created.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskData }) => updateTask(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['tasks', id] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Task updated.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Task deleted.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export function useAddChecklistItem(taskId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => addChecklistItem(taskId, title),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks', taskId] }); toast.success('Item added.') },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useToggleChecklistItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, itemId }: { taskId: number; itemId: number }) => toggleChecklistItem(taskId, itemId),
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ['tasks', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteChecklistItem(taskId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: number) => deleteChecklistItem(taskId, itemId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks', taskId] }); toast.success('Item deleted.') },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}
