class LabelModel {
  final int id;
  final String name;
  final String color;

  const LabelModel({
    required this.id,
    required this.name,
    required this.color,
  });

  factory LabelModel.fromJson(Map<String, dynamic> json) => LabelModel(
        id: json['id'] as int,
        name: json['name'] as String,
        color: json['color'] as String,
      );
}
