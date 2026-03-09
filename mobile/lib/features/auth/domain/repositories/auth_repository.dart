import '../entities/user_entity.dart';

abstract class AuthRepository {
  /// Login with email and password. Returns the authenticated user.
  Future<UserEntity> login({
    required String email,
    required String password,
  });

  /// Logout the current user.
  Future<void> logout();

  /// Get the current authenticated user. Returns null if not authenticated.
  Future<UserEntity?> getMe();

  /// Check if user has a stored auth token.
  Future<bool> hasToken();

  /// Update profile information.
  Future<UserEntity> updateProfile({
    String? name,
    String? phone,
    String? currentPassword,
    String? password,
    String? passwordConfirmation,
  });

  /// Force-change password (first login). Returns updated user.
  Future<UserEntity> changePassword({
    required String password,
    required String passwordConfirmation,
  });
}
