class LeaveQuotaModel {
  final int leaveTypeId;
  final String name;
  final int quota;
  final int used;
  final int remaining;

  const LeaveQuotaModel({
    required this.leaveTypeId,
    required this.name,
    required this.quota,
    required this.used,
    required this.remaining,
  });

  factory LeaveQuotaModel.fromJson(Map<String, dynamic> json) => LeaveQuotaModel(
        leaveTypeId: json['leave_type_id'] as int,
        name: json['name'] as String,
        quota: json['quota'] as int,
        used: json['used'] as int,
        remaining: json['remaining'] as int,
      );
}
