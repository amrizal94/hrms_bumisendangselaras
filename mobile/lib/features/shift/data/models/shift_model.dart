class ShiftModel {
  final int id;
  final String name;
  final String checkInTime;
  final String checkOutTime;
  final int lateToleranceMinutes;
  final List<int> workDays;
  final bool isActive;

  const ShiftModel({
    required this.id,
    required this.name,
    required this.checkInTime,
    required this.checkOutTime,
    required this.lateToleranceMinutes,
    required this.workDays,
    required this.isActive,
  });

  factory ShiftModel.fromJson(Map<String, dynamic> json) => ShiftModel(
        id: json['id'] as int,
        name: json['name'] as String,
        checkInTime: json['check_in_time'] as String,
        checkOutTime: json['check_out_time'] as String,
        lateToleranceMinutes: json['late_tolerance_minutes'] as int,
        workDays: List<int>.from(json['work_days'] as List),
        isActive: json['is_active'] as bool? ?? true,
      );
}
