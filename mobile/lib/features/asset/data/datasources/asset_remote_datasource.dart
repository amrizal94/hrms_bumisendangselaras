import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/asset_model.dart';

class AssetRemoteDatasource {
  final Dio _dio;
  AssetRemoteDatasource(this._dio);

  // ── Staff: my assigned assets ─────────────────────────────────────────────

  Future<List<AssetAssignmentModel>> getMyAssets() async {
    try {
      final res  = await _dio.get(ApiConstants.myAssets);
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List;
      return data
          .map((e) => AssetAssignmentModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // ── Admin/HR: all assets ──────────────────────────────────────────────────

  Future<Map<String, dynamic>> getAssets({
    String? status,
    int? categoryId,
    String? search,
    int page = 1,
  }) async {
    try {
      final params = <String, dynamic>{'page': page, 'per_page': 20};
      if (status != null && status != 'all') params['status']      = status;
      if (categoryId != null)                params['category_id'] = categoryId;
      if (search != null && search.isNotEmpty) params['search']    = search;

      final res  = await _dio.get(ApiConstants.assets, queryParameters: params);
      final body = res.data as Map<String, dynamic>;
      final data = (body['data'] as List)
          .map((e) => AssetModel.fromJson(e as Map<String, dynamic>))
          .toList();
      return {'data': data, 'meta': body['meta']};
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Map<String, dynamic>> getAssetStats() async {
    try {
      final res  = await _dio.get(ApiConstants.assetStats);
      final body = res.data as Map<String, dynamic>;
      return body['data'] as Map<String, dynamic>? ?? {};
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> assignAsset(
    int id, {
    required int employeeId,
    required String assignedDate,
    required String conditionOnAssign,
    String? notes,
  }) async {
    try {
      final payload = <String, dynamic>{
        'employee_id':        employeeId,
        'assigned_date':      assignedDate,
        'condition_on_assign': conditionOnAssign,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      };
      final res  = await _dio.post('${ApiConstants.assets}/$id/assign', data: payload);
      final body = res.data as Map<String, dynamic>;
      if (body['success'] != true) {
        throw ApiException(message: body['message']?.toString() ?? 'Assign failed');
      }
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> returnAsset(
    int id, {
    required String returnedDate,
    required String conditionOnReturn,
    String? notes,
  }) async {
    try {
      final payload = <String, dynamic>{
        'returned_date':       returnedDate,
        'condition_on_return': conditionOnReturn,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      };
      final res  = await _dio.post('${ApiConstants.assets}/$id/return', data: payload);
      final body = res.data as Map<String, dynamic>;
      if (body['success'] != true) {
        throw ApiException(message: body['message']?.toString() ?? 'Return failed');
      }
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> createAsset({
    required String name,
    required String assetCode,
    int? categoryId,
    String? brand,
    String? model,
    String? serialNumber,
    String? purchaseDate,
    double? purchasePrice,
    String condition = 'good',
    String? notes,
  }) async {
    try {
      final payload = <String, dynamic>{
        'name':       name,
        'asset_code': assetCode,
        'condition':  condition,
        if (categoryId    != null) 'category_id':    categoryId,
        if (brand         != null) 'brand':          brand,
        if (model         != null) 'model':          model,
        if (serialNumber  != null) 'serial_number':  serialNumber,
        if (purchaseDate  != null) 'purchase_date':  purchaseDate,
        if (purchasePrice != null) 'purchase_price': purchasePrice,
        if (notes         != null) 'notes':          notes,
      };
      final res  = await _dio.post(ApiConstants.assets, data: payload);
      final body = res.data as Map<String, dynamic>;
      if (body['success'] != true) {
        throw ApiException(message: body['message']?.toString() ?? 'Create failed');
      }
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> updateAsset(
    int id, {
    String? name,
    String? assetCode,
    int? categoryId,
    String? brand,
    String? model,
    String? serialNumber,
    String? purchaseDate,
    double? purchasePrice,
    String? condition,
    String? notes,
  }) async {
    try {
      final payload = <String, dynamic>{
        if (name          != null) 'name':           name,
        if (assetCode     != null) 'asset_code':     assetCode,
        if (categoryId    != null) 'category_id':    categoryId,
        if (brand         != null) 'brand':          brand,
        if (model         != null) 'model':          model,
        if (serialNumber  != null) 'serial_number':  serialNumber,
        if (purchaseDate  != null) 'purchase_date':  purchaseDate,
        if (purchasePrice != null) 'purchase_price': purchasePrice,
        if (condition     != null) 'condition':      condition,
        if (notes         != null) 'notes':          notes,
      };
      final res  = await _dio.put('${ApiConstants.assets}/$id', data: payload);
      final body = res.data as Map<String, dynamic>;
      if (body['success'] != true) {
        throw ApiException(message: body['message']?.toString() ?? 'Update failed');
      }
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> disposeAsset(int id, {String? notes}) async {
    try {
      final payload = <String, dynamic>{
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      };
      final res  = await _dio.post('${ApiConstants.assets}/$id/dispose', data: payload);
      final body = res.data as Map<String, dynamic>;
      if (body['success'] != true) {
        throw ApiException(message: body['message']?.toString() ?? 'Dispose failed');
      }
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> deleteAsset(int id) async {
    try {
      await _dio.delete('${ApiConstants.assets}/$id');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<Map<String, dynamic>>> getActiveEmployees() async {
    try {
      final res  = await _dio.get(ApiConstants.employees, queryParameters: {'status': 'active', 'per_page': 200});
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List<dynamic>? ?? [];
      return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<Map<String, dynamic>>> getAssetCategories() async {
    try {
      final res  = await _dio.get(ApiConstants.assetCategories);
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List<dynamic>? ?? [];
      return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}

final assetRemoteDatasourceProvider = Provider<AssetRemoteDatasource>(
  (ref) => AssetRemoteDatasource(ref.watch(dioClientProvider)),
);
