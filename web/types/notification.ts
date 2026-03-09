export interface AppNotification {
  id: string
  type: 'leave_status' | 'overtime_status' | 'general'
  title: string
  message: string
  link?: string | null
  read: boolean
  created_at: string
}

export interface NotificationsResponse {
  success: boolean
  data: AppNotification[]
  unread_count: number
}
