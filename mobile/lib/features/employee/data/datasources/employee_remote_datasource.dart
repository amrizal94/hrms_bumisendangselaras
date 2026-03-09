import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/employee_model.dart';

final employeeRemoteDataSourceProvider = Provider<EmployeeRemoteDataSource>(
  (ref) => EmployeeRemoteDataSource(ref.watch(dioClientProvider)),
);

class EmployeeRemoteDataSource {
  final Dio _dio;
  EmployeeRemoteDataSource(this._dio);

  /// GET /employees?page=N&search=...
  Future<({List<EmployeeModel> items, int total, int lastPage})> getEmployees({
    int page = 1,
    int perPage = 20,
    String? search,
    String? departmentId,
  }) async {
    try {
      final params = <String, dynamic>{'page': page, 'per_page': perPage};
      if (search != null && search.isNotEmpty) params['search'] = search;
      if (departmentId != null) params['department_id'] = departmentId;

      final res = await _dio.get(ApiConstants.employees, queryParameters: params);
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List;
      final meta = body['meta'] as Map<String, dynamic>?;

      return (
        items: data
            .map((e) => EmployeeModel.fromJson(e as Map<String, dynamic>))
            .toList(),
        total:    meta?['total'] as int? ?? data.length,
        lastPage: meta?['last_page'] as int? ?? 1,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /employees/{id}
  Future<Map<String, dynamic>> getEmployee(int id) async {
    try {
      final res = await _dio.get('${ApiConstants.employees}/$id');
      return res.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// POST /employees
  Future<EmployeeModel> createEmployee(Map<String, dynamic> data) async {
    try {
      final res = await _dio.post(ApiConstants.employees, data: data);
      return EmployeeModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// PUT /employees/{id}
  Future<EmployeeModel> updateEmployee(int id, Map<String, dynamic> data) async {
    try {
      final res = await _dio.put('${ApiConstants.employees}/$id', data: data);
      return EmployeeModel.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /departments?per_page=100
  Future<List<({int id, String name})>> getDepartments() async {
    try {
      final res = await _dio.get(
        ApiConstants.departments,
        queryParameters: {'per_page': 100},
      );
      final data = res.data['data'] as List;
      return data
          .map((e) => (id: e['id'] as int, name: e['name'] as String))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /shifts?per_page=100
  Future<List<({int id, String name, String checkInTime, String checkOutTime})>>
      getShifts() async {
    try {
      final res = await _dio.get(
        ApiConstants.shifts,
        queryParameters: {'per_page': 100},
      );
      final data = res.data['data'] as List;
      return data
          .map((e) => (
                id:           e['id'] as int,
                name:         e['name'] as String,
                checkInTime:  e['check_in_time']  as String? ?? '',
                checkOutTime: e['check_out_time'] as String? ?? '',
              ))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// PATCH /employees/{id}/toggle-active
  Future<EmployeeModel> toggleActive(int employeeId) async {
    try {
      final res = await _dio.patch(
        '${ApiConstants.employees}/$employeeId/toggle-active',
      );
      return EmployeeModel.fromJson(
        res.data['data'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
