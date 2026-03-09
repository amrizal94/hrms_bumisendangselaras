import 'dart:async' show unawaited;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/push_notification_service.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    dataSource: ref.watch(authRemoteDataSourceProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _dataSource;
  final SecureStorage _storage;

  AuthRepositoryImpl({required AuthRemoteDataSource dataSource, required SecureStorage storage})
      : _dataSource = dataSource,
        _storage = storage;

  @override
  Future<UserEntity> login({required String email, required String password}) async {
    final res = await _dataSource.login(email: email, password: password);
    await _storage.saveToken(res.token);
    await _storage.saveUser(res.user.toJson());
    unawaited(PushNotificationService.instance.registerToken(res.token));
    return _toEntity(res.user);
  }

  @override
  Future<void> logout() async {
    final authToken = await _storage.getToken();
    if (authToken != null) {
      await PushNotificationService.instance.clearToken(authToken);
    }
    try {
      await _dataSource.logout();
    } finally {
      await _storage.clearAll();
    }
  }

  @override
  Future<UserEntity?> getMe() async {
    final token = await _storage.getToken();
    if (token == null) return null;
    try {
      final user = await _dataSource.getMe();
      await _storage.saveUser(user.toJson());
      return _toEntity(user);
    } catch (_) {
      await _storage.clearAll();
      return null;
    }
  }

  @override
  Future<bool> hasToken() async => await _storage.getToken() != null;

  @override
  Future<UserEntity> updateProfile({
    String? name,
    String? phone,
    String? currentPassword,
    String? password,
    String? passwordConfirmation,
  }) async {
    final user = await _dataSource.updateProfile(
      name: name,
      phone: phone,
      currentPassword: currentPassword,
      password: password,
      passwordConfirmation: passwordConfirmation,
    );
    await _storage.saveUser(user.toJson());
    return _toEntity(user);
  }

  @override
  Future<UserEntity> changePassword({
    required String password,
    required String passwordConfirmation,
  }) async {
    final user = await _dataSource.changePassword(
      password: password,
      passwordConfirmation: passwordConfirmation,
    );
    await _storage.saveUser(user.toJson());
    return _toEntity(user);
  }

  UserEntity _toEntity(UserModel m) => UserEntity(
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        phone: m.phone,
        avatar: m.avatar,
        isActive: m.isActive,
        mustChangePassword: m.mustChangePassword,
      );
}
