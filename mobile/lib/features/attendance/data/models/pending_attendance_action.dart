import 'dart:convert';

class PendingAttendanceAction {
  final String id;       // milliseconds timestamp (unique per device session)
  final String action;   // 'check_in' | 'check_out'
  final DateTime timestamp;
  final double? latitude;
  final double? longitude;
  final double? locationAccuracy;
  final bool isMockLocation;

  const PendingAttendanceAction({
    required this.id,
    required this.action,
    required this.timestamp,
    this.latitude,
    this.longitude,
    this.locationAccuracy,
    this.isMockLocation = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'action': action,
        'timestamp': timestamp.toIso8601String(),
        'latitude': latitude,
        'longitude': longitude,
        'location_accuracy': locationAccuracy,
        'is_mock_location': isMockLocation,
      };

  factory PendingAttendanceAction.fromJson(Map<String, dynamic> json) =>
      PendingAttendanceAction(
        id: json['id'] as String,
        action: json['action'] as String,
        timestamp: DateTime.parse(json['timestamp'] as String),
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        locationAccuracy: (json['location_accuracy'] as num?)?.toDouble(),
        isMockLocation: json['is_mock_location'] as bool? ?? false,
      );

  factory PendingAttendanceAction.fromJsonString(String s) =>
      PendingAttendanceAction.fromJson(jsonDecode(s) as Map<String, dynamic>);
}
