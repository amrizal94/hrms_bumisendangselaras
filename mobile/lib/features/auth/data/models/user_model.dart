class UserModel {
  final int id;
  final String name;
  final String email;
  final String role;
  final String? phone;
  final String? avatar;
  final bool isActive;
  final bool mustChangePassword;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.avatar,
    this.isActive = true,
    this.mustChangePassword = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as int,
        name: json['name'] as String,
        email: json['email'] as String,
        role: json['role'] as String,
        phone: json['phone'] as String?,
        avatar: json['avatar'] as String?,
        isActive: json['is_active'] as bool? ?? true,
        mustChangePassword: json['must_change_password'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        if (phone != null) 'phone': phone,
        if (avatar != null) 'avatar': avatar,
        'is_active': isActive,
        'must_change_password': mustChangePassword,
      };
}
