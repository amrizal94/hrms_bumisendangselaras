export type HolidayType = 'national' | 'company'

export interface Holiday {
  id: number
  name: string
  date: string
  type: HolidayType
  description?: string | null
  created_at?: string
}

export interface HolidayFormData {
  name: string
  date: string
  type: HolidayType
  description?: string
}
