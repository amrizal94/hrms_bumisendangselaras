import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/expense_model.dart';
import '../models/expense_type_model.dart';

class ExpenseRemoteDatasource {
  final Dio _dio;
  ExpenseRemoteDatasource(this._dio);

  Future<List<ExpenseTypeModel>> getExpenseTypes() async {
    try {
      final res  = await _dio.get(ApiConstants.expenseTypes);
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List;
      return data.map((e) => ExpenseTypeModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<ExpenseModel>> getMyExpenses({String? status, int page = 1}) async {
    try {
      final params = <String, dynamic>{'page': page, 'per_page': 20};
      if (status != null && status != 'all') params['status'] = status;

      final res  = await _dio.get(ApiConstants.myExpenses, queryParameters: params);
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List;
      return data.map((e) => ExpenseModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<ExpenseModel> submitExpense({
    required String expenseDate,
    required double amount,
    required int expenseTypeId,
    required String description,
    required List<int> fileBytes,
    required String filename,
  }) async {
    try {
      final formData = FormData.fromMap({
        'expense_date':    expenseDate,
        'amount':          amount.toStringAsFixed(0),
        'expense_type_id': expenseTypeId.toString(),
        'description':     description,
        'receipt':         MultipartFile.fromBytes(fileBytes, filename: filename),
      });

      final res  = await _dio.post(ApiConstants.expenses, data: formData);
      final body = res.data as Map<String, dynamic>;
      if (body['success'] != true) {
        throw ApiException(message: body['message']?.toString() ?? 'Submit failed');
      }
      return ExpenseModel.fromJson(body['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> deleteExpense(int id) async {
    try {
      await _dio.delete('${ApiConstants.expenses}/$id');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<ExpenseModel>> getExpenses({
    String? status,
    String? category,
    String? search,
    int page = 1,
  }) async {
    try {
      final params = <String, dynamic>{'page': page, 'per_page': 20};
      if (status != null && status != 'all')     params['status']   = status;
      if (category != null && category != 'all') params['category'] = category;
      if (search != null && search.isNotEmpty)   params['search']   = search;

      final res  = await _dio.get(ApiConstants.expenses, queryParameters: params);
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List;
      return data.map((e) => ExpenseModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<ExpenseModel> approveExpense(int id) async {
    try {
      final res  = await _dio.post('${ApiConstants.expenses}/$id/approve');
      final body = res.data as Map<String, dynamic>;
      if (body['success'] != true) {
        throw ApiException(message: body['message']?.toString() ?? 'Approve failed');
      }
      return ExpenseModel.fromJson(body['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<ExpenseModel> rejectExpense(int id, String reason) async {
    try {
      final res  = await _dio.post(
        '${ApiConstants.expenses}/$id/reject',
        data: {'rejection_reason': reason},
      );
      final body = res.data as Map<String, dynamic>;
      if (body['success'] != true) {
        throw ApiException(message: body['message']?.toString() ?? 'Reject failed');
      }
      return ExpenseModel.fromJson(body['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}

final expenseRemoteDatasourceProvider = Provider<ExpenseRemoteDatasource>(
  (ref) => ExpenseRemoteDatasource(ref.watch(dioClientProvider)),
);
