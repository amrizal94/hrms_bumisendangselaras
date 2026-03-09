import 'package:flutter/material.dart';

/// Hard-blocking dialog shown when mock GPS is detected on the client.
/// Caller must return/abort after awaiting this — no API call should follow.
Future<void> showMockGpsWarningDialog(BuildContext context) {
  return showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (_) => AlertDialog(
      icon: Icon(Icons.gps_off_rounded, color: Colors.orange.shade700, size: 48),
      title: const Text('GPS Palsu Terdeteksi'),
      content: const Text(
        'Terdeteksi penggunaan Mock Location atau aplikasi GPS palsu.\n\n'
        'Non-aktifkan Mock GPS dan coba lagi.\n'
        'Percobaan ini telah dicatat dan dilaporkan ke admin.',
      ),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.orange.shade700,
            foregroundColor: Colors.white,
          ),
          child: const Text('OK, Mengerti'),
        ),
      ],
    ),
  );
}
