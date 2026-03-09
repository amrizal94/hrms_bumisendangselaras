class AttendancePolicyModel {
  /// 'any' | 'face_only' | 'manual_only'
  final String checkInMethod;

  const AttendancePolicyModel({required this.checkInMethod});

  factory AttendancePolicyModel.fromJson(Map<String, dynamic> json) =>
      AttendancePolicyModel(
        checkInMethod: json['check_in_method'] as String? ?? 'any',
      );

  bool get isFaceOnly   => checkInMethod == 'face_only';
  bool get isManualOnly => checkInMethod == 'manual_only';
  bool get isAny        => checkInMethod == 'any';
}
