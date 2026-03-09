export type AnnouncementCategory = 'general' | 'hr' | 'policy' | 'event'
export type AnnouncementPriority = 'low' | 'medium' | 'high'
export type AnnouncementTarget = 'all' | 'staff' | 'admin_hr'

export interface Announcement {
  id: number
  title: string
  content: string
  category: AnnouncementCategory
  priority: AnnouncementPriority
  target_roles: AnnouncementTarget
  created_by?: string
  created_at: string
  updated_at?: string
}

export interface CreateAnnouncementData {
  title: string
  content: string
  category: AnnouncementCategory
  priority: AnnouncementPriority
  target_roles: AnnouncementTarget
}
