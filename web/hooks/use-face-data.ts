import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteFaceData, enrollFace, faceAttendance, fetchAuditLogs, fetchFaceEnrollments, fetchMyFaceStatus, identifyFace, selfEnrollFace } from '@/lib/face-data-api'

export function useFaceEnrollments(params?: { page?: number; search?: string; enrolled?: boolean }) {
  return useQuery({
    queryKey: ['face-enrollments', params],
    queryFn: () => fetchFaceEnrollments({ per_page: 20, ...params }),
  })
}

export function useEnrollFace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: enrollFace,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['face-enrollments'] }),
  })
}

export function useDeleteFaceData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteFaceData,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['face-enrollments'] }),
  })
}

export function useIdentifyFace() {
  return useMutation({ mutationFn: identifyFace })
}

export function useMyFaceStatus() {
  return useQuery({
    queryKey: ['face-my-status'],
    queryFn: fetchMyFaceStatus,
  })
}

export function useSelfEnrollFace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: selfEnrollFace,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['face-my-status'] }),
  })
}

export function useAuditLogs(params?: { action?: string; from?: string; to?: string; page?: number }) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => fetchAuditLogs({ per_page: 20, ...params }),
  })
}

export function useFaceAttendance() {
  const qc = useQueryClient()
  const invalidateAttendance = () => {
    qc.invalidateQueries({ queryKey: ['attendance-today'] })
    qc.invalidateQueries({ queryKey: ['my-attendance'] })
    qc.invalidateQueries({ queryKey: ['attendance-summary'] })
  }
  return useMutation({
    mutationFn: faceAttendance,
    onSuccess: invalidateAttendance,
    onError: invalidateAttendance,
  })
}
