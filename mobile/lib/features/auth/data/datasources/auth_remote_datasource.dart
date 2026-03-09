import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>(
  (ref) => AuthRemoteDataSource(ref.watch(dioClientProvider)),
);

class AuthRemoteDataSource {
  final Dio _dio;
  AuthRemoteDataSource(this._dio);

  Future<AuthResponse> login({required String email, required String password}) async {
    try {
      final res = await _dio.post(ApiConstants.login, data: {'email': email, 'password': password});
      return AuthResponse.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post(ApiConstants.logout);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<UserModel> getMe() async {
    try {
      final res = await _dio.get(ApiConstants.me);
      final data = res.data['data']['user'];
      return UserModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> updateFcmToken(String? token) async {
    try {
      await _dio.put(ApiConstants.fcmToken, data: {'fcm_token': token});
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<UserModel> updateProfile({
    String? name,
    String? phone,
    String? currentPassword,
    String? password,
    String? passwordConfirmation,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (phone != null) body['phone'] = phone;
      if (currentPassword != null) body['current_password'] = currentPassword;
      if (password != null) {
        body['password'] = password;
        body['password_confirmation'] = passwordConfirmation;
      }
      final res = await _dio.put(ApiConstants.profile, data: body);
      return UserModel.fromJson(res.data['data']['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<UserModel> changePassword({
    required String password,
    required String passwordConfirmation,
  }) async {
    try {
      final res = await _dio.post(ApiConstants.changePassword, data: {
        'password': password,
        'password_confirmation': passwordConfirmation,
      });
      return UserModel.fromJson(res.data['data']['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
