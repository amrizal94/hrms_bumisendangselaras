export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'disposed'
export type AssetCondition = 'good' | 'fair' | 'poor'

export interface AssetCategory {
  id: number
  name: string
  code: string
  description: string | null
  is_active: boolean
}

// When `assignedBy` relationship is loaded, Laravel serializes it as `assigned_by`
// (object), replacing the raw FK integer. We model it as a union.
export type AssignedByUser = { id: number; name: string; email?: string }

export interface AssetAssignment {
  id: number
  asset_id: number
  employee_id: number
  /** Raw FK integer when relationship is not eager-loaded; User object when loaded */
  assigned_by: number | AssignedByUser
  assigned_date: string
  returned_date: string | null
  condition_on_assign: AssetCondition
  condition_on_return: AssetCondition | null
  notes: string | null
  employee?: {
    id: number
    employee_number: string
    user?: { name: string }
    department?: { name: string }
  }
}

/** Helper — safely extract the name of who recorded the assignment */
export function assignedByName(asgn: AssetAssignment | null | undefined): string | null {
  if (!asgn) return null
  if (typeof asgn.assigned_by === 'object' && asgn.assigned_by !== null) {
    return (asgn.assigned_by as AssignedByUser).name
  }
  return null
}

export interface Asset {
  id: number
  name: string
  asset_code: string
  asset_category_id: number | null
  serial_number: string | null
  brand: string | null
  model: string | null
  purchase_date: string | null
  purchase_price: string | null
  warranty_until: string | null
  condition: AssetCondition
  status: AssetStatus
  notes: string | null
  category: AssetCategory | null
  current_assignment: AssetAssignment | null
  assignments?: AssetAssignment[]
  assignments_count?: number
  created_at: string
}

export interface AssetStats {
  total: number
  available: number
  in_use: number
  maintenance: number
}

export interface AssetFilters {
  status?: string
  category_id?: string | number
  search?: string
  page?: number
  per_page?: number
}

export interface AssetMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
}
