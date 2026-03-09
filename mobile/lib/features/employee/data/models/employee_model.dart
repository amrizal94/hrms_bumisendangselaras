class EmployeeModel {
  final int id;
  final String employeeNumber;
  final String? position;
  final String? employmentType;
  final String? status;
  final String userName;
  final String userEmail;
  final String? userPhone;
  final bool isActive;
  final String? departmentName;
  final String? shiftName;
  final String? userRole;

  const EmployeeModel({
    required this.id,
    required this.employeeNumber,
    this.position,
    this.employmentType,
    this.status,
    required this.userName,
    required this.userEmail,
    this.userPhone,
    required this.isActive,
    this.departmentName,
    this.shiftName,
    this.userRole,
  });

  factory EmployeeModel.fromJson(Map<String, dynamic> j) {
    final user = j['user']       as Map<String, dynamic>?;
    final dept = j['department'] as Map<String, dynamic>?;
    final shift = j['shift']     as Map<String, dynamic>?;

    return EmployeeModel(
      id:             j['id'] as int,
      employeeNumber: j['employee_number'] as String? ?? '',
      position:       j['position'] as String?,
      employmentType: j['employment_type'] as String?,
      status:         j['status'] as String?,
      userName:       user?['name'] as String? ?? '',
      userEmail:      user?['email'] as String? ?? '',
      userPhone:      user?['phone'] as String?,
      isActive:       user?['is_active'] as bool? ?? true,
      departmentName: dept?['name'] as String?,
      shiftName:      shift?['name'] as String?,
      userRole:       user?['role'] as String?,
    );
  }

  EmployeeModel copyWith({bool? isActive}) {
    return EmployeeModel(
      id:             id,
      employeeNumber: employeeNumber,
      position:       position,
      employmentType: employmentType,
      status:         status,
      userName:       userName,
      userEmail:      userEmail,
      userPhone:      userPhone,
      isActive:       isActive ?? this.isActive,
      departmentName: departmentName,
      shiftName:      shiftName,
      userRole:       userRole,
    );
  }
}
