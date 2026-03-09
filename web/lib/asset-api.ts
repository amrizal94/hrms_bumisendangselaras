import { api } from './api'
import type { Asset, AssetCategory, AssetFilters, AssetStats } from '@/types/asset'

function buildParams(filters: AssetFilters) {
  const params: Record<string, string | number> = {}
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.category_id && filters.category_id !== 'all') params.category_id = filters.category_id
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page
  return params
}

export async function fetchAssets(filters: AssetFilters = {}) {
  const res = await api.get('/assets', { params: buildParams(filters) })
  return res.data
}

export async function fetchAsset(id: number) {
  const res = await api.get(`/assets/${id}`)
  return res.data.data as Asset
}

export async function fetchAssetStats() {
  const res = await api.get('/assets/stats')
  return res.data.data as AssetStats
}

export async function createAsset(data: Partial<Asset>) {
  const res = await api.post('/assets', data)
  return res.data.data as Asset
}

export async function updateAsset(id: number, data: Partial<Asset>) {
  const res = await api.put(`/assets/${id}`, data)
  return res.data.data as Asset
}

export async function deleteAsset(id: number) {
  const res = await api.delete(`/assets/${id}`)
  return res.data
}

export async function assignAsset(id: number, data: {
  employee_id: number
  assigned_date: string
  condition_on_assign?: string
  notes?: string
}) {
  const res = await api.post(`/assets/${id}/assign`, data)
  return res.data.data as Asset
}

export async function returnAsset(id: number, data: {
  returned_date: string
  condition_on_return?: string
  notes?: string
}) {
  const res = await api.post(`/assets/${id}/return`, data)
  return res.data.data as Asset
}

export async function fetchAssetCategories() {
  const res = await api.get('/asset-categories')
  return res.data.data as AssetCategory[]
}

export async function createAssetCategory(data: Partial<AssetCategory>) {
  const res = await api.post('/asset-categories', data)
  return res.data.data as AssetCategory
}

export async function updateAssetCategory(id: number, data: Partial<AssetCategory>) {
  const res = await api.put(`/asset-categories/${id}`, data)
  return res.data.data as AssetCategory
}

export async function deleteAssetCategory(id: number) {
  const res = await api.delete(`/asset-categories/${id}`)
  return res.data
}

export async function disposeAsset(id: number, notes?: string) {
  const res = await api.post(`/assets/${id}/dispose`, { notes })
  return res.data.data as Asset
}

export async function fetchMyAssets() {
  const res = await api.get('/assets/my')
  return res.data.data
}
