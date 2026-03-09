import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/overtime_model.dart';

final overtimeRemoteDataSourceProvider = Provider<OvertimeRemoteDataSource>(
  (ref) => OvertimeRemoteDataSource(ref.watch(dioClientProvider)),
);

class OvertimeRemoteDataSource {
  final Dio _dio;
  OvertimeRemoteDataSource(this._dio);

  Future<List<OvertimeModel>> getMyOvertimes() async {
    try {
      final res = await _dio.get(ApiConstants.overtimeMy, queryParameters: {'per_page': 50});
      return (res.data['data'] as List)
          .map((e) => OvertimeModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<OvertimeModel> submitOvertime({
    required String date,
    required double overtimeHours,
    required String overtimeType,
    required String reason,
  }) async {
    try {
      final res = await _dio.post(ApiConstants.overtime, data: {
        'date': date,
        'overtime_hours': overtimeHours,
        'overtime_type': overtimeType,
        'reason': reason,
      });
      return OvertimeModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> cancelOvertime(int id) async {
    try {
      await _dio.delete('${ApiConstants.overtime}/$id');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<OvertimeModel>> getOvertimeRequests({String? status}) async {
    try {
      final res = await _dio.get(
        ApiConstants.overtime,
        queryParameters: {
          'per_page': 50,
          if (status != null) 'status': status,
        },
      );
      return (res.data['data'] as List)
          .map((e) => OvertimeModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> approveOvertime(int id) async {
    try {
      await _dio.post('${ApiConstants.overtime}/$id/approve');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> rejectOvertime(int id, String reason) async {
    try {
      await _dio.post(
        '${ApiConstants.overtime}/$id/reject',
        data: {'rejection_reason': reason},
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
