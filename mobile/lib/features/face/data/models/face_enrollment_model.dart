class FaceEnrollmentModel {
  final int employeeId;
  final String employeeNumber;
  final String? position;
  final String userName;
  final bool userIsActive;
  final String? departmentName;
  final bool isEnrolled;
  final int? faceDataId;
  final String? enrolledAt;
  final String? imageUrl;
  final String? enrolledByName;

  const FaceEnrollmentModel({
    required this.employeeId,
    required this.employeeNumber,
    this.position,
    required this.userName,
    required this.userIsActive,
    this.departmentName,
    required this.isEnrolled,
    this.faceDataId,
    this.enrolledAt,
    this.imageUrl,
    this.enrolledByName,
  });

  factory FaceEnrollmentModel.fromJson(Map<String, dynamic> j) {
    final user       = j['user']       as Map<String, dynamic>?;
    final dept       = j['department'] as Map<String, dynamic>?;
    final faceData   = j['face_data']  as Map<String, dynamic>?;
    final enrolledBy = faceData?['enrolled_by'] as Map<String, dynamic>?;

    return FaceEnrollmentModel(
      employeeId:    (j['employee_id'] ?? j['id']) as int,
      employeeNumber: j['employee_number'] as String? ?? '',
      position:       j['position'] as String?,
      userName:       user?['name'] as String? ?? '',
      userIsActive:   user?['is_active'] as bool? ?? true,
      departmentName: dept?['name'] as String?,
      isEnrolled:     j['is_enrolled'] as bool? ?? false,
      faceDataId:     faceData?['id'] as int?,
      enrolledAt:     faceData?['enrolled_at'] as String?,
      imageUrl:       faceData?['image_url'] as String?,
      enrolledByName: enrolledBy?['name'] as String?,
    );
  }
}
