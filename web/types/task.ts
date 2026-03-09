export type ProjectStatus = 'active' | 'completed' | 'archived'
export type TaskStatus   = 'todo' | 'in_progress' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Label {
  id: number
  name: string
  color: string
}

export interface Project {
  id: number
  name: string
  description?: string | null
  status: ProjectStatus
  deadline?: string | null
  progress: number
  task_count: number
  creator?: { id: number; name: string }
  created_at?: string
}

export interface TaskAssignee {
  id: number
  employee_number: string
  user: { id: number; name: string }
}

export interface ChecklistItem {
  id: number
  title: string
  is_done: boolean
  sort_order: number
}

export interface Task {
  id: number
  project_id: number
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  deadline?: string | null
  sort_order: number
  project?: { id: number; name: string }
  assignee?: TaskAssignee | null
  creator?: { id: number; name: string }
  labels?: Label[]
  checklist_items?: ChecklistItem[]
  checklist_total?: number
  checklist_done?: number
  photo_url?: string | null
  self_reported?: boolean
  notes?: string | null
  created_at?: string | null
  completed_at?: string | null
  created_gps?: { lat: number; lng: number; face_confidence: number | null } | null
  completed_gps?: {
    lat: number
    lng: number
    accuracy: number | null
    is_mock: boolean
    face_confidence: number | null
  } | null
}

export interface TaskFilters {
  project_id?: number | string
  status?: string
  priority?: string
  assigned_to?: number | string
  search?: string
  page?: number
  per_page?: number
}

export interface ProjectFilters {
  status?: string
  search?: string
  page?: number
  per_page?: number
}

export interface CreateProjectData {
  name: string
  description?: string
  status?: ProjectStatus
  deadline?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  status?: ProjectStatus
  deadline?: string | null
}

export interface CreateTaskData {
  project_id: number
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  deadline?: string
  assigned_to?: number | null
  label_ids?: number[]
  checklist_items?: { title: string }[]
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  deadline?: string | null
  assigned_to?: number | null
  label_ids?: number[]
}
