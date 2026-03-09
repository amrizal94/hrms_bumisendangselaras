class NotificationModel {
  final String id;
  final String type;
  final String title;
  final String message;
  final bool read;
  final String createdAt;
  final String? link;

  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.read,
    required this.createdAt,
    this.link,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
        id: json['id'] as String,
        type: json['type'] as String,
        title: json['title'] as String,
        message: json['message'] as String,
        read: json['read'] as bool,
        createdAt: json['created_at'] as String,
        link: json['link'] as String?,
      );

  NotificationModel copyWith({bool? read}) => NotificationModel(
        id: id,
        type: type,
        title: title,
        message: message,
        read: read ?? this.read,
        createdAt: createdAt,
        link: link,
      );
}
