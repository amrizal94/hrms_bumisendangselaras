class QrSessionModel {
  final int id;
  final String token;
  final String type;       // 'check_in' | 'check_out'
  final String date;
  final String validFrom;
  final String validUntil;
  final bool isActive;
  final String? createdByName;
  final String? createdAt;

  const QrSessionModel({
    required this.id,
    required this.token,
    required this.type,
    required this.date,
    required this.validFrom,
    required this.validUntil,
    required this.isActive,
    this.createdByName,
    this.createdAt,
  });

  factory QrSessionModel.fromJson(Map<String, dynamic> json) {
    final createdBy = json['created_by'] as Map<String, dynamic>?;
    return QrSessionModel(
      id:            json['id'] as int,
      token:         json['token'] as String,
      type:          json['type'] as String,
      date:          json['date'] as String,
      validFrom:     json['valid_from'] as String,
      validUntil:    json['valid_until'] as String,
      isActive:      json['is_active'] as bool,
      createdByName: createdBy?['name'] as String?,
      createdAt:     json['created_at'] as String?,
    );
  }

  bool get isCheckIn => type == 'check_in';

  String get label => isCheckIn ? 'Check-In' : 'Check-Out';
}
