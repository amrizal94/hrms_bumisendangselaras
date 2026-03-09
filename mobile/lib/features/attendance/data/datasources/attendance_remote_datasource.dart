import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/services/location_service.dart';
import '../models/attendance_policy_model.dart';
import '../models/attendance_record_model.dart';
import '../models/qr_session_model.dart';

final attendanceRemoteDataSourceProvider = Provider<AttendanceRemoteDataSource>(
  (ref) => AttendanceRemoteDataSource(ref.watch(dioClientProvider)),
);

class AttendanceRemoteDataSource {
  final Dio _dio;
  AttendanceRemoteDataSource(this._dio);

  Future<AttendancePolicyModel> getAttendancePolicy() async {
    try {
      final res = await _dio.get(ApiConstants.attendancePolicy);
      return AttendancePolicyModel.fromJson(
        res.data['data'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<AttendanceRecordModel?> getToday() async {
    try {
      final res = await _dio.get(ApiConstants.attendanceToday);
      final data = res.data['data'];
      if (data == null) return null;
      return AttendanceRecordModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<AttendanceRecordModel>> getMyAttendance({
    String? dateFrom,
    String? dateTo,
    int perPage = 30,
  }) async {
    try {
      final q = <String, dynamic>{'per_page': perPage};
      if (dateFrom != null) q['date_from'] = dateFrom;
      if (dateTo != null) q['date_to'] = dateTo;
      final res = await _dio.get(ApiConstants.attendanceMy, queryParameters: q);
      final list = res.data['data'] as List;
      return list.map((e) => AttendanceRecordModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Normal online check-in — caller provides fresh [location] (may be null).
  /// For offline sync, also pass [clientTimestamp] to preserve the real check-in time.
  Future<AttendanceRecordModel> checkIn({
    LocationResult? location,
    DateTime? clientTimestamp,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (location != null) {
        body['latitude']          = location.latitude;
        body['longitude']         = location.longitude;
        body['location_accuracy'] = location.accuracy;
        body['is_mock_location']  = location.isMocked;
      }
      if (clientTimestamp != null) {
        body['client_checked_in_at'] = clientTimestamp.toIso8601String();
      }
      final res = await _dio.post(ApiConstants.attendanceCheckIn, data: body);
      return AttendanceRecordModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Normal online check-out — caller provides fresh [location] (may be null).
  /// For offline sync, also pass [clientTimestamp].
  Future<AttendanceRecordModel> checkOut({
    LocationResult? location,
    DateTime? clientTimestamp,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (location != null) {
        body['latitude']          = location.latitude;
        body['longitude']         = location.longitude;
        body['location_accuracy'] = location.accuracy;
        body['is_mock_location']  = location.isMocked;
      }
      if (clientTimestamp != null) {
        body['client_checked_out_at'] = clientTimestamp.toIso8601String();
      }
      final res = await _dio.post(ApiConstants.attendanceCheckOut, data: body);
      return AttendanceRecordModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<AttendanceRecordModel>> getAllAttendance({
    String? date,
    String? dateFrom,
    String? dateTo,
    String? status,
    int perPage = 50,
  }) async {
    try {
      final q = <String, dynamic>{'per_page': perPage};
      if (date != null) q['date'] = date;
      if (dateFrom != null) q['date_from'] = dateFrom;
      if (dateTo != null) q['date_to'] = dateTo;
      if (status != null) q['status'] = status;
      final res = await _dio.get(ApiConstants.attendance, queryParameters: q);
      final list = res.data['data'] as List;
      return list
          .map((e) => AttendanceRecordModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// POST /attendance  (admin create)
  Future<AttendanceRecordModel> createAttendance({
    required int employeeId,
    required String date,
    required String checkIn,
    String? checkOut,
    required String status,
    String? notes,
  }) async {
    try {
      final body = <String, dynamic>{
        'employee_id': employeeId,
        'date': date,
        'check_in': checkIn,
        'status': status,
      };
      if (checkOut != null) body['check_out'] = checkOut;
      if (notes != null && notes.isNotEmpty) body['notes'] = notes;
      final res = await _dio.post(ApiConstants.attendance, data: body);
      return AttendanceRecordModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// PUT /attendance/{id}  (admin update)
  Future<AttendanceRecordModel> updateAttendance({
    required int id,
    String? checkIn,
    String? checkOut,
    required String status,
    String? notes,
  }) async {
    try {
      final body = <String, dynamic>{'status': status};
      if (checkIn != null) body['check_in'] = checkIn;
      if (checkOut != null) body['check_out'] = checkOut;
      if (notes != null) body['notes'] = notes;
      final res = await _dio.put('${ApiConstants.attendance}/$id', data: body);
      return AttendanceRecordModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// DELETE /attendance/{id}  (admin delete)
  Future<void> deleteAttendance(int id) async {
    try {
      await _dio.delete('${ApiConstants.attendance}/$id');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // ── QR Attendance ──────────────────────────────────────────────────────────

  /// POST /attendance/qr-scan — staff scans QR token
  Future<AttendanceRecordModel> scanQr({
    required String token,
    LocationResult? location,
  }) async {
    try {
      final body = <String, dynamic>{'token': token};
      if (location != null) {
        body['latitude']          = location.latitude;
        body['longitude']         = location.longitude;
        body['location_accuracy'] = location.accuracy;
        body['is_mock_location']  = location.isMocked;
      }
      final res = await _dio.post(ApiConstants.attendanceQrScan, data: body);
      return AttendanceRecordModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// POST /attendance/qr-sessions — admin/HR generate QR session
  Future<QrSessionModel> generateQrSession({
    required String type,
    required String date,
    required String validFrom,
    required String validUntil,
  }) async {
    try {
      final res = await _dio.post(ApiConstants.attendanceQrSessions, data: {
        'type':        type,
        'date':        date,
        'valid_from':  validFrom,
        'valid_until': validUntil,
      });
      return QrSessionModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /attendance/qr-sessions — admin/HR list sessions
  Future<List<QrSessionModel>> getQrSessions({String? date}) async {
    try {
      final q = <String, dynamic>{};
      if (date != null) q['date'] = date;
      final res = await _dio.get(ApiConstants.attendanceQrSessions, queryParameters: q);
      final list = res.data['data'] as List;
      return list.map((e) => QrSessionModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// POST /attendance/qr-sessions/{id}/deactivate
  Future<void> deactivateQrSession(int id) async {
    try {
      await _dio.post('${ApiConstants.attendanceQrSessions}/$id/deactivate');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
