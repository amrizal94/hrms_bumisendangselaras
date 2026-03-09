class AttendanceReportRow {
  final String employeeNumber;
  final String name;
  final String? department;
  final int workingDays;
  final int presentDays;
  final int lateDays;
  final int leaveDays;
  final int absentDays;
  final double totalHours;
  final double attendanceRate;

  const AttendanceReportRow({
    required this.employeeNumber,
    required this.name,
    this.department,
    required this.workingDays,
    required this.presentDays,
    required this.lateDays,
    required this.leaveDays,
    required this.absentDays,
    required this.totalHours,
    required this.attendanceRate,
  });

  factory AttendanceReportRow.fromJson(Map<String, dynamic> j) =>
      AttendanceReportRow(
        employeeNumber: j['employee_number']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        department: j['department']?.toString(),
        workingDays: _toInt(j['working_days']),
        presentDays: _toInt(j['present_days']),
        lateDays: _toInt(j['late_days']),
        leaveDays: _toInt(j['leave_days']),
        absentDays: _toInt(j['absent_days']),
        totalHours: _toDouble(j['total_hours']),
        attendanceRate: _toDouble(j['attendance_rate']),
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

class AttendanceReportResult {
  final List<AttendanceReportRow> rows;
  final int workingDays;
  final int year;
  final int month;

  const AttendanceReportResult({
    required this.rows,
    required this.workingDays,
    required this.year,
    required this.month,
  });
}
