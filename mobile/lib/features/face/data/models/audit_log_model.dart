class AuditLogModel {
  final int id;
  final String action;
  final String? actorName;
  final String? actorEmail;
  final int? targetEmployeeId;
  final String? targetEmployeeName;
  final String? targetEmployeeNumber;
  final String? ipAddress;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  const AuditLogModel({
    required this.id,
    required this.action,
    this.actorName,
    this.actorEmail,
    this.targetEmployeeId,
    this.targetEmployeeName,
    this.targetEmployeeNumber,
    this.ipAddress,
    this.metadata,
    required this.createdAt,
  });

  factory AuditLogModel.fromJson(Map<String, dynamic> j) {
    final actor  = j['actor']           as Map<String, dynamic>?;
    final target = j['target_employee'] as Map<String, dynamic>?;

    return AuditLogModel(
      id:                   j['id'] as int,
      action:               j['action'] as String? ?? '',
      actorName:            actor?['name'] as String?,
      actorEmail:           actor?['email'] as String?,
      targetEmployeeId:     target?['id'] as int?,
      targetEmployeeName:   target?['name'] as String?,
      targetEmployeeNumber: target?['employee_number'] as String?,
      ipAddress:            j['ip_address'] as String?,
      metadata:             j['metadata'] as Map<String, dynamic>?,
      createdAt:            DateTime.parse(j['created_at'] as String),
    );
  }

  /// Ringkas metadata: confidence, distance, detected_via
  String get metaSummary {
    if (metadata == null) return '';
    final parts = <String>[];
    final conf = metadata!['confidence'];
    final dist = metadata!['distance'];
    final via  = metadata!['detected_via'];
    if (conf != null) parts.add('${(conf as num).toStringAsFixed(1)}%');
    if (dist != null) parts.add('d=${(dist as num).toStringAsFixed(3)}');
    if (via  != null) parts.add(via as String);
    return parts.join(' · ');
  }

  /// Label untuk action
  String get actionLabel {
    switch (action) {
      case 'face.enroll':               return 'Enroll';
      case 'face.delete':               return 'Hapus';
      case 'face.self_enroll':          return 'Self-Enroll';
      case 'face.attendance.check_in':  return 'Masuk';
      case 'face.attendance.check_out': return 'Keluar';
      case 'face.attendance.no_match':  return 'No Match';
      default:
        if (action.startsWith('fake_gps')) return 'GPS Fraud';
        return action;
    }
  }

  /// Nama yang ditampilkan di tile
  String get displayName =>
      targetEmployeeName ?? targetEmployeeNumber ?? actorName ?? '—';
}
