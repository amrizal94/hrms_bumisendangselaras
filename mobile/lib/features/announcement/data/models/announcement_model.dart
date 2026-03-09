class AnnouncementModel {
  final int id;
  final String title;
  final String content;
  final String category;
  final String priority;
  final String targetRoles;
  final String? createdBy;
  final String? createdAt;

  const AnnouncementModel({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.priority,
    required this.targetRoles,
    this.createdBy,
    this.createdAt,
  });

  factory AnnouncementModel.fromJson(Map<String, dynamic> j) {
    return AnnouncementModel(
      id:          j['id'] as int,
      title:       j['title'] as String,
      content:     j['content'] as String,
      category:    j['category'] as String,
      priority:    j['priority'] as String,
      targetRoles: j['target_roles'] as String,
      createdBy:   j['created_by'] as String?,
      createdAt:   j['created_at'] as String?,
    );
  }
}
