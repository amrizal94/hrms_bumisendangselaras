class ChecklistItemModel {
  final int id;
  final String title;
  final bool isDone;
  final int sortOrder;

  const ChecklistItemModel({
    required this.id,
    required this.title,
    required this.isDone,
    required this.sortOrder,
  });

  factory ChecklistItemModel.fromJson(Map<String, dynamic> json) =>
      ChecklistItemModel(
        id: json['id'] as int,
        title: json['title'] as String,
        isDone: json['is_done'] as bool,
        sortOrder: json['sort_order'] as int,
      );

  ChecklistItemModel copyWith({bool? isDone}) => ChecklistItemModel(
        id: id,
        title: title,
        isDone: isDone ?? this.isDone,
        sortOrder: sortOrder,
      );
}
