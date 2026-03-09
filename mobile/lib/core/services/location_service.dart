import 'package:geolocator/geolocator.dart';

class LocationResult {
  final double latitude;
  final double longitude;
  final double accuracy;
  final bool isMocked;

  const LocationResult({
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    required this.isMocked,
  });
}

class LocationService {
  /// Returns current position, or a human-readable error string on failure.
  /// Returns null if location is disabled or permission denied — callers
  /// should treat null as "location unavailable, proceed without GPS".
  static Future<LocationResult?> getCurrentLocation() async {
    // Check if location services are enabled
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return null;

    // Request permission if needed
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return null;
    }
    if (permission == LocationPermission.deniedForever) return null;

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      return LocationResult(
        latitude:  position.latitude,
        longitude: position.longitude,
        accuracy:  position.accuracy,
        isMocked:  position.isMocked,
      );
    } catch (_) {
      return null;
    }
  }
}
