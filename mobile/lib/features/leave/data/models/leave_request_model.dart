class LeaveRequestModel {
  final int id;
  final int leaveTypeId;
  final String leaveTypeName;
  final String startDate;
  final String endDate;
  final int totalDays;
  final String reason;
  final String status;
  final String? rejectReason;
  final String? createdAt;

  // Present only when admin/HR fetches all leave requests
  final String? employeeName;
  final String? employeeNumber;

  const LeaveRequestModel({
    required this.id,
    required this.leaveTypeId,
    required this.leaveTypeName,
    required this.startDate,
    required this.endDate,
    required this.totalDays,
    required this.reason,
    required this.status,
    this.rejectReason,
    this.createdAt,
    this.employeeName,
    this.employeeNumber,
  });

  factory LeaveRequestModel.fromJson(Map<String, dynamic> json) {
    // leave_type can come as nested object or flat field
    final leaveTypeObj = json['leave_type'] as Map<String, dynamic>?;
    final leaveTypeName = leaveTypeObj?['name'] as String? ??
        json['leave_type_name'] as String? ??
        '';

    // employee nested object (admin/HR view)
    final employeeObj = json['employee'] as Map<String, dynamic>?;

    return LeaveRequestModel(
      id: json['id'] as int,
      leaveTypeId: json['leave_type_id'] as int,
      leaveTypeName: leaveTypeName,
      startDate: json['start_date'] as String,
      endDate: json['end_date'] as String,
      totalDays: json['total_days'] as int,
      reason: json['reason'] as String,
      status: json['status'] as String,
      rejectReason: json['reject_reason'] as String?,
      createdAt: json['created_at'] as String?,
      employeeName: employeeObj?['name'] as String?,
      employeeNumber: employeeObj?['employee_number'] as String?,
    );
  }
}
