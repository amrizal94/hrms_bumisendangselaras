import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/user_entity.dart';

// ── Auth state ────────────────────────────────────────────────────────────────
sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthCheckingSession extends AuthState {
  const AuthCheckingSession();
}

class AuthSubmittingLogin extends AuthState {
  const AuthSubmittingLogin();
}

class AuthLoggingOut extends AuthState {
  const AuthLoggingOut();
}

class AuthAuthenticated extends AuthState {
  final UserEntity user;
  const AuthAuthenticated(this.user);
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
}

// ── Notifier ──────────────────────────────────────────────────────────────────
class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthInitial();

  Future<void> checkAuthStatus() async {
    state = const AuthCheckingSession();
    try {
      final user = await ref.read(authRepositoryProvider).getMe();
      state = user != null ? AuthAuthenticated(user) : const AuthUnauthenticated();
    } catch (_) {
      state = const AuthUnauthenticated();
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = const AuthSubmittingLogin();
    try {
      final user = await ref.read(authRepositoryProvider).login(email: email, password: password);
      state = AuthAuthenticated(user);
    } catch (e) {
      state = AuthError(e.toString().replaceFirst('ApiException: ', ''));
    }
  }

  Future<void> logout() async {
    state = const AuthLoggingOut();
    try {
      await ref.read(authRepositoryProvider).logout();
    } catch (_) {
      // Always clear
    } finally {
      state = const AuthUnauthenticated();
    }
  }

  Future<String?> updateProfile({
    String? name,
    String? phone,
    String? currentPassword,
    String? password,
    String? passwordConfirmation,
  }) async {
    try {
      final updated = await ref.read(authRepositoryProvider).updateProfile(
        name: name,
        phone: phone,
        currentPassword: currentPassword,
        password: password,
        passwordConfirmation: passwordConfirmation,
      );
      state = AuthAuthenticated(updated);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> changePassword({
    required String password,
    required String passwordConfirmation,
  }) async {
    try {
      final updated = await ref.read(authRepositoryProvider).changePassword(
        password: password,
        passwordConfirmation: passwordConfirmation,
      );
      state = AuthAuthenticated(updated);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  void clearError() {
    if (state is AuthError) state = const AuthUnauthenticated();
  }
}

final authNotifierProvider = NotifierProvider<AuthNotifier, AuthState>(() => AuthNotifier());
