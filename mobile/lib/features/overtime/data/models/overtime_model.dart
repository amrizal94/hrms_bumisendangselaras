class OvertimeModel {
  final int id;
  final String date;
  final double overtimeHours;
  final String overtimeType;
  final String reason;
  final String status;
  final String? rejectionReason;
  final String? approvedByName;
  final String? createdAt;
  // Admin/HR view
  final String? employeeName;
  final String? employeeNumber;

  const OvertimeModel({
    required this.id,
    required this.date,
    required this.overtimeHours,
    required this.overtimeType,
    required this.reason,
    required this.status,
    this.rejectionReason,
    this.approvedByName,
    this.createdAt,
    this.employeeName,
    this.employeeNumber,
  });

  factory OvertimeModel.fromJson(Map<String, dynamic> json) {
    final employeeObj = json['employee'] as Map<String, dynamic>?;
    return OvertimeModel(
      id: json['id'] as int,
      date: json['date'] as String,
      overtimeHours: (json['overtime_hours'] as num).toDouble(),
      overtimeType: json['overtime_type'] as String,
      reason: json['reason'] as String,
      status: json['status'] as String,
      rejectionReason: json['rejection_reason'] as String?,
      approvedByName: json['approved_by_name'] as String?,
      createdAt: json['created_at'] as String?,
      employeeName: employeeObj?['name'] as String? ?? json['employee_name'] as String?,
      employeeNumber: employeeObj?['employee_number'] as String? ?? json['employee_number'] as String?,
    );
  }
}
