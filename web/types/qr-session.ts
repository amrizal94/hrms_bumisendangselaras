export type QrSessionType = 'check_in' | 'check_out'

export interface QrSession {
  id: number
  token: string
  type: QrSessionType
  date: string
  valid_from: string
  valid_until: string
  is_active: boolean
  created_by?: { id: number; name: string }
  created_at?: string
}

export interface GenerateQrSessionPayload {
  type: QrSessionType
  date: string
  valid_from: string   // 'YYYY-MM-DD HH:mm:ss'
  valid_until: string  // 'YYYY-MM-DD HH:mm:ss'
}
