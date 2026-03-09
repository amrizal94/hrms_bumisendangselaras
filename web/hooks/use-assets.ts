'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  assignAsset,
  createAsset,
  createAssetCategory,
  deleteAsset,
  deleteAssetCategory,
  disposeAsset,
  fetchAssetCategories,
  fetchAssetStats,
  fetchAssets,
  fetchMyAssets,
  returnAsset,
  updateAsset,
  updateAssetCategory,
} from '@/lib/asset-api'
import type { AssetFilters } from '@/types/asset'

function getMsg(err: unknown) {
  if (err instanceof Error) return err.message
  return 'Terjadi kesalahan'
}

export function useAssets(filters: AssetFilters = {}) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => fetchAssets(filters),
  })
}

export function useAssetStats() {
  return useQuery({
    queryKey: ['asset-stats'],
    queryFn: fetchAssetStats,
  })
}

export function useAssetCategories() {
  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: fetchAssetCategories,
  })
}

export function useMyAssets() {
  return useQuery({
    queryKey: ['my-assets'],
    queryFn: fetchMyAssets,
  })
}

export function useCreateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-stats'] })
      toast.success('Aset berhasil ditambahkan')
    },
    onError: (err) => toast.error(getMsg(err)),
  })
}

export function useUpdateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateAsset>[1] }) =>
      updateAsset(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      toast.success('Aset berhasil diperbarui')
    },
    onError: (err) => toast.error(getMsg(err)),
  })
}

export function useDeleteAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-stats'] })
      toast.success('Aset berhasil dihapus')
    },
    onError: (err) => toast.error(getMsg(err)),
  })
}

export function useAssignAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof assignAsset>[1] }) =>
      assignAsset(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-stats'] })
      toast.success('Aset berhasil dipinjamkan')
    },
    onError: (err) => toast.error(getMsg(err)),
  })
}

export function useReturnAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof returnAsset>[1] }) =>
      returnAsset(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-stats'] })
      toast.success('Aset berhasil dikembalikan')
    },
    onError: (err) => toast.error(getMsg(err)),
  })
}

export function useDisposeAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => disposeAsset(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-stats'] })
      toast.success('Aset berhasil ditandai sebagai dibuang')
    },
    onError: (err) => toast.error(getMsg(err)),
  })
}

export function useCreateAssetCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAssetCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-categories'] })
      toast.success('Kategori berhasil dibuat')
    },
    onError: (err) => toast.error(getMsg(err)),
  })
}

export function useUpdateAssetCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateAssetCategory>[1] }) =>
      updateAssetCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-categories'] })
      toast.success('Kategori berhasil diperbarui')
    },
    onError: (err) => toast.error(getMsg(err)),
  })
}

export function useDeleteAssetCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAssetCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-categories'] })
      toast.success('Kategori berhasil dihapus')
    },
    onError: (err) => toast.error(getMsg(err)),
  })
}
