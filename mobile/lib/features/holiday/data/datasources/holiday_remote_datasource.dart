import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/holiday_model.dart';

final holidayRemoteDataSourceProvider = Provider<HolidayRemoteDataSource>(
  (ref) => HolidayRemoteDataSource(ref.watch(dioClientProvider)),
);

class HolidayRemoteDataSource {
  final Dio _dio;
  HolidayRemoteDataSource(this._dio);

  Future<List<HolidayModel>> getHolidays(int year) async {
    try {
      final res = await _dio.get(ApiConstants.holidays, queryParameters: {'year': year});
      return (res.data['data'] as List)
          .map((e) => HolidayModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
