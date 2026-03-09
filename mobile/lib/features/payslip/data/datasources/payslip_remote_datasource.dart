import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/payslip_model.dart';

final payslipRemoteDataSourceProvider = Provider<PayslipRemoteDataSource>(
  (ref) => PayslipRemoteDataSource(ref.watch(dioClientProvider)),
);

class PayslipRemoteDataSource {
  final Dio _dio;
  PayslipRemoteDataSource(this._dio);

  Future<List<PayslipModel>> getMyPayslips() async {
    try {
      final res = await _dio.get(ApiConstants.payrollMy);
      return (res.data['data'] as List)
          .map((e) => PayslipModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
