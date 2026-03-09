import 'user_model.dart';

class AuthResponse {
  final String token;
  final String tokenType;
  final UserModel user;

  const AuthResponse({
    required this.token,
    required this.tokenType,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        token: json['token'] as String,
        tokenType: json['token_type'] as String? ?? 'Bearer',
        user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      );
}
