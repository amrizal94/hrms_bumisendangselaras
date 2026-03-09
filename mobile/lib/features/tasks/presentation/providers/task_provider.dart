import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/location_service.dart';
import '../../data/models/project_model.dart';
import '../../data/models/task_model.dart';
import '../../data/repositories/task_repository.dart';

// ── Projects (read-only) ──────────────────────────────────────────────────────

final myProjectsProvider = FutureProvider<List<ProjectModel>>(
  (ref) => ref.watch(taskRepositoryProvider).getMyProjects(),
);

final activeProjectsProvider = FutureProvider<List<ProjectModel>>(
  (ref) => ref.watch(taskRepositoryProvider).getActiveProjectsForTask(),
);

// ── Tasks (filterable + mutable) ─────────────────────────────────────────────

class MyTasksNotifier extends AsyncNotifier<List<TaskModel>> {
  String? _statusFilter;
  String? _priorityFilter;

  @override
  Future<List<TaskModel>> build() => ref
      .watch(taskRepositoryProvider)
      .getMyTasks(status: _statusFilter, priority: _priorityFilter);

  void setFilters({String? status, String? priority}) {
    _statusFilter = status;
    _priorityFilter = priority;
    ref.invalidateSelf();
  }

  Future<String?> updateStatus(int taskId, String status) async {
    try {
      await ref.read(taskRepositoryProvider).updateTaskStatus(taskId, status);
      ref.invalidateSelf();
      ref.invalidate(myProjectsProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> createTask({
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
  }) async {
    try {
      await ref.read(taskRepositoryProvider).createSelfTask(
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
      ref.invalidateSelf();
      ref.invalidate(myProjectsProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> completeWithPhoto({
    required int taskId,
    required List<int> photoBytes,
    required String filename,
    required List<int> faceBytes,
    required String faceFilename,
    String? notes,
    LocationResult? location,
  }) async {
    try {
      await ref.read(taskRepositoryProvider).completeTask(
        taskId:       taskId,
        photoBytes:   photoBytes,
        filename:     filename,
        faceBytes:    faceBytes,
        faceFilename: faceFilename,
        notes:        notes,
        location:     location,
      );
      ref.invalidateSelf();
      ref.invalidate(myProjectsProvider);
      ref.invalidate(taskDetailProvider(taskId));
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final myTasksProvider =
    AsyncNotifierProvider<MyTasksNotifier, List<TaskModel>>(() => MyTasksNotifier());

// ── Task detail (family per taskId) ─────────────────────────────────────────

final taskDetailProvider = FutureProvider.family<TaskModel, int>(
  (ref, id) => ref.watch(taskRepositoryProvider).getTask(id),
);
