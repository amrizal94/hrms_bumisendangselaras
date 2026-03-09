import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/leave_quota_model.dart';
import '../models/leave_request_model.dart';
import '../models/leave_type_model.dart';

final leaveRemoteDataSourceProvider = Provider<LeaveRemoteDataSource>(
  (ref) => LeaveRemoteDataSource(ref.watch(dioClientProvider)),
);

class LeaveRemoteDataSource {
  final Dio _dio;
  LeaveRemoteDataSource(this._dio);

  Future<List<LeaveTypeModel>> getLeaveTypes() async {
    try {
      final res = await _dio.get(ApiConstants.leaveTypes);
      return (res.data['data'] as List)
          .map((e) => LeaveTypeModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<LeaveRequestModel>> getMyLeaves() async {
    try {
      final res = await _dio.get(ApiConstants.leaveMy);
      return (res.data['data'] as List)
          .map((e) => LeaveRequestModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<LeaveQuotaModel>> getLeaveQuota() async {
    try {
      final res = await _dio.get(ApiConstants.leaveQuota);
      return (res.data['data'] as List)
          .map((e) => LeaveQuotaModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<LeaveRequestModel> applyLeave({
    required int leaveTypeId,
    required String startDate,
    required String endDate,
    required String reason,
  }) async {
    try {
      final res = await _dio.post(ApiConstants.leave, data: {
        'leave_type_id': leaveTypeId,
        'start_date': startDate,
        'end_date': endDate,
        'reason': reason,
      });
      return LeaveRequestModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> cancelLeave(int id) async {
    try {
      await _dio.delete('${ApiConstants.leave}/$id');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // ── Admin / HR ──────────────────────────────────────────────────────────────

  Future<List<LeaveRequestModel>> getLeaveRequests({String? status}) async {
    try {
      final res = await _dio.get(
        ApiConstants.leave,
        queryParameters: {
          if (status != null) 'status': status,
          'per_page': 50,
        },
      );
      return (res.data['data'] as List)
          .map((e) => LeaveRequestModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> approveLeave(int id) async {
    try {
      await _dio.post('${ApiConstants.leave}/$id/approve');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> rejectLeave(int id, String reason) async {
    try {
      await _dio.post(
        '${ApiConstants.leave}/$id/reject',
        data: {'rejection_reason': reason},
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
