class PayslipModel {
  final int id;
  final int periodYear;
  final int periodMonth;
  final String? periodLabel;

  // Earnings
  final double basicSalary;
  final double allowances;
  final double overtimePay;
  final double reimbursement;
  final double grossSalary;

  // Deductions
  final double absentDeduction;
  final double taxDeduction;
  final double bpjsDeduction;
  final double otherDeductions;
  final double totalDeductions;

  final double netSalary;

  // Attendance
  final int presentDays;
  final int absentDays;
  final int leaveDays;
  final int workingDays;

  final String status;
  final String? paidAt;
  final String? notes;

  // Employee info (from /payroll/my with employee loaded)
  final String? employeeName;
  final String? employeeNumber;
  final String? position;
  final String? departmentName;

  const PayslipModel({
    required this.id,
    required this.periodYear,
    required this.periodMonth,
    this.periodLabel,
    required this.basicSalary,
    this.allowances = 0,
    this.overtimePay = 0,
    this.reimbursement = 0,
    required this.grossSalary,
    this.absentDeduction = 0,
    this.taxDeduction = 0,
    this.bpjsDeduction = 0,
    this.otherDeductions = 0,
    this.totalDeductions = 0,
    required this.netSalary,
    this.presentDays = 0,
    this.absentDays = 0,
    this.leaveDays = 0,
    this.workingDays = 0,
    required this.status,
    this.paidAt,
    this.notes,
    this.employeeName,
    this.employeeNumber,
    this.position,
    this.departmentName,
  });

  factory PayslipModel.fromJson(Map<String, dynamic> json) {
    final emp  = json['employee']   as Map<String, dynamic>?;
    final user = emp?['user']       as Map<String, dynamic>?;
    final dept = emp?['department'] as Map<String, dynamic>?;

    final absentDed = (json['absent_deduction']  as num?)?.toDouble() ?? 0;
    final taxDed    = (json['tax_deduction']      as num?)?.toDouble() ?? 0;
    final bpjsDed   = (json['bpjs_deduction']     as num?)?.toDouble() ?? 0;
    final otherDed  = (json['other_deductions']   as num?)?.toDouble() ?? 0;
    final totalDed  = (json['total_deductions']   as num?)?.toDouble()
        ?? (absentDed + taxDed + bpjsDed + otherDed);

    return PayslipModel(
      id:              json['id'] as int,
      periodYear:      json['period_year'] as int,
      periodMonth:     json['period_month'] as int,
      periodLabel:     json['period_label'] as String?,
      basicSalary:     (json['basic_salary'] as num).toDouble(),
      allowances:      (json['allowances']    as num?)?.toDouble() ?? 0,
      overtimePay:     (json['overtime_pay']  as num?)?.toDouble() ?? 0,
      reimbursement:   (json['reimbursement'] as num?)?.toDouble() ?? 0,
      grossSalary:     (json['gross_salary']  as num).toDouble(),
      absentDeduction: absentDed,
      taxDeduction:    taxDed,
      bpjsDeduction:   bpjsDed,
      otherDeductions: otherDed,
      totalDeductions: totalDed,
      netSalary:       (json['net_salary'] as num).toDouble(),
      presentDays:     json['present_days'] as int? ?? 0,
      absentDays:      json['absent_days']  as int? ?? 0,
      leaveDays:       json['leave_days']   as int? ?? 0,
      workingDays:     json['working_days'] as int? ?? 0,
      status:          json['status'] as String,
      paidAt:          json['paid_at'] as String?,
      notes:           json['notes'] as String?,
      employeeName:    user?['name']           as String?,
      employeeNumber:  emp?['employee_number'] as String?,
      position:        emp?['position']        as String?,
      departmentName:  dept?['name']           as String?,
    );
  }
}
