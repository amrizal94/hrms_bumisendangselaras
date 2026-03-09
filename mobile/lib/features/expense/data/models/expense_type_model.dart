class ExpenseTypeModel {
  final int    id;
  final String name;
  final String code;
  final String? description;
  final bool   isActive;

  const ExpenseTypeModel({
    required this.id,
    required this.name,
    required this.code,
    this.description,
    required this.isActive,
  });

  factory ExpenseTypeModel.fromJson(Map<String, dynamic> json) {
    return ExpenseTypeModel(
      id:          json['id'] as int,
      name:        json['name'] as String,
      code:        json['code'] as String,
      description: json['description'] as String?,
      isActive:    json['is_active'] as bool? ?? true,
    );
  }
}
