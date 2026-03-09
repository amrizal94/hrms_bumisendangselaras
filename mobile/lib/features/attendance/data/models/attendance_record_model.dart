class AttendanceRecordModel {
  final int id;
  final String date;
  final String? checkIn;
  final String? checkOut;
  final String status;
  final double? workHours;
  final String? notes;
  // Admin/HR view
  final String? employeeName;
  final String? employeeNumber;
  // Local-only: true when saved offline, not yet synced to server
  final bool isPending;

  const AttendanceRecordModel({
    required this.id,
    required this.date,
    this.checkIn,
    this.checkOut,
    required this.status,
    this.workHours,
    this.notes,
    this.employeeName,
    this.employeeNumber,
    this.isPending = false,
  });

  AttendanceRecordModel copyWith({
    String? checkOut,
    bool? isPending,
  }) =>
      AttendanceRecordModel(
        id: id,
        date: date,
        checkIn: checkIn,
        checkOut: checkOut ?? this.checkOut,
        status: status,
        workHours: workHours,
        notes: notes,
        employeeName: employeeName,
        employeeNumber: employeeNumber,
        isPending: isPending ?? this.isPending,
      );

  factory AttendanceRecordModel.fromJson(Map<String, dynamic> json) {
    final employeeObj = json['employee'] as Map<String, dynamic>?;
    return AttendanceRecordModel(
      id: _toInt(json['id']),
      date: (json['date'] ?? '').toString(),
      checkIn: json['check_in']?.toString(),
      checkOut: json['check_out']?.toString(),
      status: (json['status'] ?? '').toString(),
      workHours: _toDoubleNullable(json['work_hours']),
      notes: json['notes']?.toString(),
      employeeName: employeeObj?['name'] as String? ?? json['employee_name'] as String?,
      employeeNumber: employeeObj?['employee_number'] as String? ?? json['employee_number'] as String?,
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static double? _toDoubleNullable(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }
}
