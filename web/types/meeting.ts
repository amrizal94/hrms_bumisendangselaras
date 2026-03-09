export interface Meeting {
  id: number
  title: string
  description: string | null
  meeting_date: string     // 'YYYY-MM-DD'
  start_time: string       // 'HH:mm'
  end_time: string         // 'HH:mm'
  location: string | null
  meeting_url: string | null
  target_roles: 'all' | 'staff' | 'admin_hr'
  created_by?: string
  created_at?: string
  my_rsvp?: 'accepted' | 'declined' | null
  rsvp_counts?: { accepted: number; declined: number; total: number }
}

export interface MeetingRsvpEntry {
  user_id: number
  name: string
  status: 'accepted' | 'declined'
}

export interface CreateMeetingData {
  title: string
  description?: string
  meeting_date: string
  start_time: string
  end_time: string
  location?: string
  meeting_url?: string
  target_roles?: 'all' | 'staff' | 'admin_hr'
}
