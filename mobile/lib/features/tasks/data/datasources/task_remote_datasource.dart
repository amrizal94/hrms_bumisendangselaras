import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/services/location_service.dart';
import '../models/checklist_item_model.dart';
import '../models/project_model.dart';
import '../models/task_model.dart';

final taskRemoteDataSourceProvider = Provider<TaskRemoteDataSource>(
  (ref) => TaskRemoteDataSource(ref.watch(dioClientProvider)),
);

class TaskRemoteDataSource {
  final Dio _dio;
  TaskRemoteDataSource(this._dio);

  Future<List<ProjectModel>> getMyProjects() async {
    try {
      final res = await _dio.get(
        ApiConstants.projects,
        queryParameters: {'per_page': 50},
      );
      return (res.data['data'] as List)
          .map((e) => ProjectModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<TaskModel>> getMyTasks({String? status, String? priority}) async {
    try {
      final params = <String, dynamic>{'per_page': 50};
      if (status != null && status.isNotEmpty) params['status'] = status;
      if (priority != null && priority.isNotEmpty) params['priority'] = priority;

      final res = await _dio.get(ApiConstants.tasks, queryParameters: params);
      return (res.data['data'] as List)
          .map((e) => TaskModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<TaskModel> getTask(int id) async {
    try {
      final res = await _dio.get('${ApiConstants.tasks}/$id');
      return TaskModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<TaskModel> updateTaskStatus(int id, String status) async {
    try {
      final res = await _dio.put('${ApiConstants.tasks}/$id', data: {'status': status});
      return TaskModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<ProjectModel>> getActiveProjectsForTask() async {
    try {
      final res = await _dio.get(
        ApiConstants.projects,
        queryParameters: {'for_task_creation': 1, 'status': 'active', 'per_page': 100},
      );
      return (res.data['data'] as List)
          .map((e) => ProjectModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

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
  }) async {
    try {
      final formData = FormData.fromMap({
        'project_id': projectId,
        'title':      title,
        if (description != null && description.isNotEmpty) 'description': description,
        if (deadline != null && deadline.isNotEmpty) 'deadline': deadline,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        'face_image': MultipartFile.fromBytes(faceBytes, filename: faceFilename),
        'task_photo': MultipartFile.fromBytes(photoBytes, filename: photoFilename),
        if (location != null) ...{
          'latitude':          location.latitude.toString(),
          'longitude':         location.longitude.toString(),
          'location_accuracy': location.accuracy.toString(),
          'is_mock_location':  location.isMocked ? '1' : '0',
        },
      });
      final res = await _dio.post(
        ApiConstants.tasks,
        data: formData,
        options: Options(receiveTimeout: const Duration(seconds: 30)),
      );
      return TaskModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<TaskModel> completeTask({
    required int taskId,
    required List<int> photoBytes,
    required String filename,
    required List<int> faceBytes,
    required String faceFilename,
    String? notes,
    LocationResult? location,
  }) async {
    try {
      final formData = FormData.fromMap({
        'photo':      MultipartFile.fromBytes(photoBytes, filename: filename),
        'face_image': MultipartFile.fromBytes(faceBytes,  filename: faceFilename),
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        if (location != null) ...{
          'latitude':          location.latitude.toString(),
          'longitude':         location.longitude.toString(),
          'location_accuracy': location.accuracy.toString(),
          'is_mock_location':  location.isMocked ? '1' : '0',
        },
      });
      final res = await _dio.post(
        ApiConstants.completeTask(taskId),
        data: formData,
        options: Options(receiveTimeout: const Duration(seconds: 30)),
      );
      return TaskModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<ChecklistItemModel> toggleChecklistItem(int taskId, int itemId) async {
    try {
      final res = await _dio.patch(
        '${ApiConstants.tasks}/$taskId/checklist/$itemId/toggle',
      );
      final data = res.data['data'] as Map<String, dynamic>;
      // Server returns {id, is_done} — reconstruct with minimal fields
      return ChecklistItemModel(
        id: data['id'] as int,
        title: '',
        isDone: data['is_done'] as bool,
        sortOrder: 0,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
