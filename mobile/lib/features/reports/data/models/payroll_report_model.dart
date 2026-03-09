class PayrollReportRow {
  final String employeeNumber;
  final String name;
  final String? department;
  final double basicSalary;
  final double grossSalary;
  final double totalDeductions;
  final double netSalary;
  final int presentDays;
  final int absentDays;
  final String status;

  const PayrollReportRow({
    required this.employeeNumber,
    required this.name,
    this.department,
    required this.basicSalary,
    required this.grossSalary,
    required this.totalDeductions,
    required this.netSalary,
    required this.presentDays,
    required this.absentDays,
    required this.status,
  });

  factory PayrollReportRow.fromJson(Map<String, dynamic> j) => PayrollReportRow(
        employeeNumber: j['employee_number']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        department: j['department']?.toString(),
        basicSalary: _toDouble(j['basic_salary']),
        grossSalary: _toDouble(j['gross_salary']),
        totalDeductions: _toDouble(j['total_deductions']),
        netSalary: _toDouble(j['net_salary']),
        presentDays: _toInt(j['present_days']),
        absentDays: _toInt(j['absent_days']),
        status: j['status']?.toString() ?? '',
      );

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  static int _toInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '') ?? 0;
  }
}

class PayrollReportResult {
  final List<PayrollReportRow> rows;
  final double totalGross;
  final double totalNet;
  final double totalDeductions;
  final int countDraft;
  final int countFinalized;
  final int countPaid;
  final int year;
  final int month;

  const PayrollReportResult({
    required this.rows,
    required this.totalGross,
    required this.totalNet,
    required this.totalDeductions,
    required this.countDraft,
    required this.countFinalized,
    required this.countPaid,
    required this.year,
    required this.month,
  });
}
