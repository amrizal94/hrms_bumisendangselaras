class OvertimeReportRow {
  final String employeeNumber;
  final String name;
  final String? department;
  final int totalRequests;
  final double approvedHours;
  final double pendingHours;

  const OvertimeReportRow({
    required this.employeeNumber,
    required this.name,
    this.department,
    required this.totalRequests,
    required this.approvedHours,
    required this.pendingHours,
  });

  factory OvertimeReportRow.fromJson(Map<String, dynamic> j) =>
      OvertimeReportRow(
        employeeNumber: j['employee_number']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        department: j['department']?.toString(),
        totalRequests: _toInt(j['total_requests']),
        approvedHours: _toDouble(j['approved_hours']),
        pendingHours: _toDouble(j['pending_hours']),
      );

  static int _toInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '') ?? 0;
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }
}

class OvertimeReportResult {
  final List<OvertimeReportRow> rows;
  final double totalApprovedHours;
  final int totalPending;
  final int year;
  final int month;

  const OvertimeReportResult({
    required this.rows,
    required this.totalApprovedHours,
    required this.totalPending,
    required this.year,
    required this.month,
  });
}
