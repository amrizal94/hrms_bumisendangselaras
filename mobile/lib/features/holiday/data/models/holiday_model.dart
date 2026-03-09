class HolidayModel {
  final int id;
  final String name;
  final String date;
  final String type;
  final String? description;

  const HolidayModel({
    required this.id,
    required this.name,
    required this.date,
    required this.type,
    this.description,
  });

  factory HolidayModel.fromJson(Map<String, dynamic> json) => HolidayModel(
        id: json['id'] as int,
        name: json['name'] as String,
        date: json['date'] as String,
        type: json['type'] as String,
        description: json['description'] as String?,
      );
}
