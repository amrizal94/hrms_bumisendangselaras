class LeaveTypeModel {
  final int id;
  final String name;
  final int? quota;
  final String? description;
  final bool isActive;

  const LeaveTypeModel({
    required this.id,
    required this.name,
    this.quota,
    this.description,
    this.isActive = true,
  });

  factory LeaveTypeModel.fromJson(Map<String, dynamic> json) => LeaveTypeModel(
        id: json['id'] as int,
        name: json['name'] as String,
        quota: json['quota'] as int?,
        description: json['description'] as String?,
        isActive: json['is_active'] as bool? ?? true,
      );
}
