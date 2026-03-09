import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/location_service.dart';
import '../datasources/task_remote_datasource.dart';
import '../models/checklist_item_model.dart';
import '../models/project_model.dart';
import '../models/task_model.dart';

final taskRepositoryProvider = Provider<TaskRepository>(
  (ref) => TaskRepository(ref.watch(taskRemoteDataSourceProvider)),
);

class TaskRepository {
  final TaskRemoteDataSource _ds;
  TaskRepository(this._ds);

  Future<List<ProjectModel>> getMyProjects() => _ds.getMyProjects();
  Future<List<ProjectModel>> getActiveProjectsForTask() => _ds.getActiveProjectsForTask();
  Future<List<TaskModel>> getMyTasks({String? status, String? priority}) =>
      _ds.getMyTasks(status: status, priority: priority);
  Future<TaskModel> getTask(int id) => _ds.getTask(id);
  Future<TaskModel> updateTaskStatus(int id, String status) =>
      _ds.updateTaskStatus(id, status);
  Future<TaskModel> createSelfTask({
    required int projectId,
    required String title,
    String? description,
    String? deadline,
    String? notes,
    required List<int> faceBytes,
    required String faceFilename,
    required List<int> photoBytes,
    required String photoFilename,
    LocationResult? location,
  }) => _ds.createSelfTask(
    projectId:     projectId,
    title:         title,
    description:   description,
    deadline:      deadline,
    notes:         notes,
    faceBytes:     faceBytes,
    faceFilename:  faceFilename,
    photoBytes:    photoBytes,
    photoFilename: photoFilename,
    location:      location,
  );
  Future<TaskModel> completeTask({
    required int taskId,
    required List<int> photoBytes,
    required String filename,
    required List<int> faceBytes,
    required String faceFilename,
    String? notes,
    LocationResult? location,
  }) => _ds.completeTask(
    taskId:       taskId,
    photoBytes:   photoBytes,
    filename:     filename,
    faceBytes:    faceBytes,
    faceFilename: faceFilename,
    notes:        notes,
    location:     location,
  );
  Future<ChecklistItemModel> toggleChecklistItem(int taskId, int itemId) =>
      _ds.toggleChecklistItem(taskId, itemId);
}
