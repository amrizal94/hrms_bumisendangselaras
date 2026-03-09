import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/shift_model.dart';

final shiftRemoteDataSourceProvider = Provider<ShiftRemoteDataSource>(
  (ref) => ShiftRemoteDataSource(ref.watch(dioClientProvider)),
);

class ShiftRemoteDataSource {
  final Dio _dio;
  ShiftRemoteDataSource(this._dio);

  Future<ShiftModel?> getMyShift() async {
    try {
      final res = await _dio.get(ApiConstants.myShift);
      final data = res.data['data'];
      if (data == null) return null;
      return ShiftModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
