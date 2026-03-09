class ProjectModel {
  final int id;
  final String name;
  final String? description;
  final String status;
  final String? deadline;
  final int progress;
  final int taskCount;

  const ProjectModel({
    required this.id,
    required this.name,
    this.description,
    required this.status,
    this.deadline,
    required this.progress,
    required this.taskCount,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) => ProjectModel(
        id: json['id'] as int,
        name: json['name'] as String,
        description: json['description'] as String?,
        status: json['status'] as String,
        deadline: json['deadline'] as String?,
        progress: json['progress'] as int,
        taskCount: json['task_count'] as int,
      );
}
