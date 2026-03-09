class LeaveReportRow {
  final String employeeNumber;
  final String name;
  final String? department;
  final int approvedDays;
  final int pendingDays;
  final int rejectedCount;
  final int totalRequests;

  const LeaveReportRow({
    required this.employeeNumber,
    required this.name,
    this.department,
    required this.approvedDays,
    required this.pendingDays,
    required this.rejectedCount,
    required this.totalRequests,
  });

  factory LeaveReportRow.fromJson(Map<String, dynamic> j) => LeaveReportRow(
        employeeNumber: j['employee_number']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        department: j['department']?.toString(),
        approvedDays: _toInt(j['approved_days']),
        pendingDays: _toInt(j['pending_days']),
        rejectedCount: _toInt(j['rejected_count']),
        totalRequests: _toInt(j['total_requests']),
      );

  static int _toInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '') ?? 0;
  }
}

class LeaveReportResult {
  final List<LeaveReportRow> rows;
  final int year;

  const LeaveReportResult({required this.rows, required this.year});
}
