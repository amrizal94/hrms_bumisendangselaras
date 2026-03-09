class UserEntity {
  final int id;
  final String name;
  final String email;
  final String role;
  final String? phone;
  final String? avatar;
  final bool isActive;
  final bool mustChangePassword;

  const UserEntity({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.avatar,
    this.isActive = true,
    this.mustChangePassword = false,
  });

  bool get isAdmin => role == 'admin';
  bool get isHR => role == 'hr';
  bool get isStaff => role == 'staff';
  bool get isManager => role == 'manager';
  bool get isDirector => role == 'director';
}
