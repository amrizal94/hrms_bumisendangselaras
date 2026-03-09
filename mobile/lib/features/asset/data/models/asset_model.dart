// ── Staff: one assigned asset (from GET /assets/my) ──────────────────────────

class AssetAssignmentModel {
  final int id;
  final int assetId;
  final String assetName;
  final String assetCode;
  final String? categoryName;
  final String? brand;
  final String? modelName;
  final String? serialNumber;
  final String conditionOnAssign;
  final String assignedDate;

  const AssetAssignmentModel({
    required this.id,
    required this.assetId,
    required this.assetName,
    required this.assetCode,
    this.categoryName,
    this.brand,
    this.modelName,
    this.serialNumber,
    required this.conditionOnAssign,
    required this.assignedDate,
  });

  factory AssetAssignmentModel.fromJson(Map<String, dynamic> json) {
    final asset    = json['asset']    as Map<String, dynamic>? ?? {};
    final category = asset['category'] as Map<String, dynamic>?;

    return AssetAssignmentModel(
      id:                json['id']           as int,
      assetId:           json['asset_id']     as int,
      assetName:         asset['name']        as String? ?? '',
      assetCode:         asset['asset_code']  as String? ?? '',
      categoryName:      category?['name']    as String?,
      brand:             asset['brand']       as String?,
      modelName:         asset['model']       as String?,
      serialNumber:      asset['serial_number'] as String?,
      conditionOnAssign: json['condition_on_assign'] as String? ?? 'good',
      assignedDate:      json['assigned_date']       as String? ?? '',
    );
  }

  String get conditionLabel {
    switch (conditionOnAssign) {
      case 'good': return 'Baik';
      case 'fair': return 'Cukup';
      case 'poor': return 'Buruk';
      default:     return conditionOnAssign;
    }
  }

  /// Formatted assigned date as DD/MM/YYYY. Falls back to raw string.
  String get formattedDate {
    try {
      final dt = DateTime.parse(assignedDate);
      final d  = dt.day.toString().padLeft(2, '0');
      final m  = dt.month.toString().padLeft(2, '0');
      return '$d/$m/${dt.year}';
    } catch (_) {
      return assignedDate;
    }
  }
}

// ── Admin / full asset model ──────────────────────────────────────────────────

class AssetModel {
  final int id;
  final String name;
  final String assetCode;
  final String? categoryName;
  final String? brand;
  final String? modelName;
  final String? serialNumber;
  final String condition;
  final String status;
  final String? warrantyUntil;
  final String? currentHolderName;
  final String? currentHolderNumber;
  final String? assignedDate;
  final String? assignedByName; // who recorded the assignment (HR/admin)

  const AssetModel({
    required this.id,
    required this.name,
    required this.assetCode,
    this.categoryName,
    this.brand,
    this.modelName,
    this.serialNumber,
    required this.condition,
    required this.status,
    this.warrantyUntil,
    this.currentHolderName,
    this.currentHolderNumber,
    this.assignedDate,
    this.assignedByName,
  });

  factory AssetModel.fromJson(Map<String, dynamic> json) {
    final category   = json['category']          as Map<String, dynamic>?;
    final assignment = json['current_assignment'] as Map<String, dynamic>?;
    final employee   = assignment?['employee']   as Map<String, dynamic>?;
    final user       = employee?['user']         as Map<String, dynamic>?;

    // assigned_by is either a User object (when loaded) or an int FK
    final assignedByRaw = assignment?['assigned_by'];
    String? assignedByNameVal;
    if (assignedByRaw is Map<String, dynamic>) {
      assignedByNameVal = assignedByRaw['name'] as String?;
    }

    return AssetModel(
      id:                  json['id']            as int,
      name:                json['name']          as String? ?? '',
      assetCode:           json['asset_code']    as String? ?? '',
      categoryName:        category?['name']     as String?,
      brand:               json['brand']         as String?,
      modelName:           json['model']         as String?,
      serialNumber:        json['serial_number'] as String?,
      condition:           json['condition']     as String? ?? 'good',
      status:              json['status']        as String? ?? 'available',
      warrantyUntil:       json['warranty_until'] as String?,
      currentHolderName:   user?['name']                as String?,
      currentHolderNumber: employee?['employee_number'] as String?,
      assignedDate:        assignment?['assigned_date']  as String?,
      assignedByName:      assignedByNameVal,
    );
  }

  String get statusLabel {
    switch (status) {
      case 'available':   return 'Tersedia';
      case 'in_use':      return 'Dipinjam';
      case 'maintenance': return 'Servis';
      case 'disposed':    return 'Dibuang';
      default:            return status;
    }
  }

  String get conditionLabel {
    switch (condition) {
      case 'good': return 'Baik';
      case 'fair': return 'Cukup';
      case 'poor': return 'Buruk';
      default:     return condition;
    }
  }

  /// Formatted warranty date as DD/MM/YYYY.
  String? get formattedWarranty {
    if (warrantyUntil == null) return null;
    try {
      final dt = DateTime.parse(warrantyUntil!);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return warrantyUntil;
    }
  }

  /// True when warranty has expired.
  bool get isWarrantyExpired {
    if (warrantyUntil == null) return false;
    try {
      return DateTime.parse(warrantyUntil!).isBefore(DateTime.now());
    } catch (_) {
      return false;
    }
  }
}
