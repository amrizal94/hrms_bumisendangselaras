export interface CompanySettings {
  'company.name': string
  'company.address': string
  'company.phone': string
  'company.email': string
}

export interface AttendanceSettings {
  'attendance.work_start': string
  'attendance.late_threshold': string
  'attendance.work_end': string
  'attendance.geofence_enabled': string
  'attendance.office_latitude': string
  'attendance.office_longitude': string
  'attendance.office_radius': string
  'attendance.check_in_method': string
}

export interface PayrollSettings {
  'payroll.tax_rate': string
  'payroll.bpjs_rate': string
}

export interface AllSettings {
  company: CompanySettings
  attendance: AttendanceSettings
  payroll: PayrollSettings
}
