import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/services/location_service.dart';
import '../models/audit_log_model.dart';
import '../models/face_enrollment_model.dart';

class FaceRemoteDatasource {
  final Dio _dio;
  FaceRemoteDatasource(this._dio);

  /// POST /face/attendance-image
  /// Returns the backend success message (e.g. "Welcome, John! Checked in at 08:00.")
  Future<String> faceAttendance({
    required List<int> imageBytes,
    required String action,
    required String filename,
    LocationResult? location,
    bool livenessVerified = false,
  }) async {
    try {
      final fields = <String, dynamic>{
        'action':             action,
        'image':              MultipartFile.fromBytes(imageBytes, filename: filename),
        'liveness_verified':  livenessVerified ? '1' : '0',
      };
      if (location != null) {
        fields['latitude']          = location.latitude.toString();
        fields['longitude']         = location.longitude.toString();
        fields['location_accuracy'] = location.accuracy.toString();
        fields['is_mock_location']  = location.isMocked ? '1' : '0';
      }
      final formData = FormData.fromMap(fields);

      final response = await _dio.post(
        ApiConstants.faceAttendanceImage,
        data: formData,
        options: Options(receiveTimeout: const Duration(seconds: 30)),
      );

      final body = response.data as Map<String, dynamic>;
      if (body['success'] != true) {
        throw ApiException(
          message: body['message']?.toString() ?? 'Face attendance failed',
        );
      }
      return body['message']?.toString() ?? 'Berhasil!';
    } on DioException catch (e) {
      if (e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const ApiException(message: 'Proses terlalu lama. Coba lagi.');
      }
      if (e.type == DioExceptionType.connectionError) {
        throw const ApiException(
          message: 'Koneksi gagal. Periksa jaringan dan coba lagi.',
        );
      }
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /face/me
  /// Returns whether the current user's face is enrolled.
  Future<bool> getMyFaceStatus() async {
    try {
      final response = await _dio.get(ApiConstants.faceMe);
      final body = response.data as Map<String, dynamic>;
      return (body['data'] as Map<String, dynamic>?)?['enrolled'] as bool? ?? false;
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError) {
        throw const ApiException(message: 'Koneksi gagal. Periksa jaringan dan coba lagi.');
      }
      throw ApiException.fromDioError(e);
    }
  }

  /// POST /face/self-enroll-image
  /// Enrolls the current user's own face. Returns the backend success message.
  Future<String> selfEnrollFace({
    required List<int> imageBytes,
    required String filename,
    bool livenessVerified = false,
  }) async {
    try {
      final formData = FormData.fromMap({
        'image':             MultipartFile.fromBytes(imageBytes, filename: filename),
        'liveness_verified': livenessVerified ? '1' : '0',
      });

      final response = await _dio.post(
        ApiConstants.faceSelfEnroll,
        data: formData,
        options: Options(receiveTimeout: const Duration(seconds: 30)),
      );

      final body = response.data as Map<String, dynamic>;
      if (body['success'] != true) {
        throw ApiException(
          message: body['message']?.toString() ?? 'Pendaftaran wajah gagal',
        );
      }
      return body['message']?.toString() ?? 'Wajah berhasil didaftarkan!';
    } on DioException catch (e) {
      if (e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const ApiException(message: 'Proses terlalu lama. Coba lagi.');
      }
      if (e.type == DioExceptionType.connectionError) {
        throw const ApiException(message: 'Koneksi gagal. Periksa jaringan dan coba lagi.');
      }
      throw ApiException.fromDioError(e);
    }
  }

  // ── Admin: list face enrollments ─────────────────────────────────────────

  /// GET /face?page=N&search=...
  Future<({List<FaceEnrollmentModel> items, int total, int lastPage})>
      getFaceEnrollments({int page = 1, String? search, String? enrolled}) async {
    try {
      final params = <String, dynamic>{'page': page, 'per_page': 20};
      if (search != null && search.isNotEmpty) params['search'] = search;
      if (enrolled != null) params['enrolled'] = enrolled;

      final res = await _dio.get(ApiConstants.faceAdmin, queryParameters: params);
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List;
      final meta = body['meta'] as Map<String, dynamic>?;

      return (
        items: data
            .map((e) => FaceEnrollmentModel.fromJson(e as Map<String, dynamic>))
            .toList(),
        total: meta?['total'] as int? ?? data.length,
        lastPage: meta?['last_page'] as int? ?? 1,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // ── Admin: delete face data ───────────────────────────────────────────────

  /// DELETE /face/{faceDataId}
  Future<void> deleteFaceData(int faceDataId) async {
    try {
      await _dio.delete('${ApiConstants.faceAdmin}/$faceDataId');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // ── Audit logs ────────────────────────────────────────────────────────────

  /// GET /audit-logs?action=...&from=...&to=...&page=N&per_page=20
  Future<({List<AuditLogModel> items, int total, int lastPage})>
      getAuditLogs({
    int page = 1,
    String action = 'face',
    String? from,
    String? to,
  }) async {
    try {
      final params = <String, dynamic>{
        'page':     page,
        'per_page': 20,
        'action':   action,
      };
      if (from != null) params['from'] = from;
      if (to   != null) params['to']   = to;

      final res  = await _dio.get(ApiConstants.auditLogs, queryParameters: params);
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List;
      final meta = body['meta'] as Map<String, dynamic>?;

      return (
        items:    data.map((e) => AuditLogModel.fromJson(e as Map<String, dynamic>)).toList(),
        total:    meta?['total']     as int? ?? data.length,
        lastPage: meta?['last_page'] as int? ?? 1,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}

final faceRemoteDatasourceProvider = Provider<FaceRemoteDatasource>(
  (ref) => FaceRemoteDatasource(ref.watch(dioClientProvider)),
);
