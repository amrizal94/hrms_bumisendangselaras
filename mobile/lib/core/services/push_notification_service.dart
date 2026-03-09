import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';

import '../constants/api_constants.dart';
import '../router/app_routes.dart';

// Must be top-level — FCM background handler cannot be a class method.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // FCM automatically shows system tray notification — nothing to do here.
}

class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  static GoRouter? _router;

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const String _channelId   = 'bsshrms_notifications';
  static const String _channelName = 'BSS HRMS Notifications';

  /// Call once from main() after Firebase.initializeApp().
  static Future<void> initialize() async {
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request permission (primarily for iOS; Android 13+ uses POST_NOTIFICATIONS).
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // iOS foreground presentation.
    await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // Init local notifications plugin for foreground heads-up on Android.
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    await instance._localNotifications.initialize(
      const InitializationSettings(android: androidSettings),
    );

    // Create Android notification channel.
    await instance._localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(
          const AndroidNotificationChannel(
            _channelId,
            _channelName,
            importance: Importance.high,
          ),
        );

    // Foreground message → show local heads-up (FCM suppresses banner in foreground).
    FirebaseMessaging.onMessage.listen((message) {
      instance._showLocalNotification(message);
    });

    // App backgrounded, user taps notification → navigate.
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      // Security login alert is informational only — no navigation.
      if (message.data['type'] == 'security_login') return;
      instance._navigateFromLink(message.data['link'] as String?);
    });
  }

  /// Called by app_router.dart to give the service a GoRouter reference.
  static void setRouter(GoRouter router) => _router = router;

  /// Called from BSSHRMSApp.build() via addPostFrameCallback to handle
  /// cold-start notification tap.
  Future<void> handleInitialMessage() async {
    final msg = await FirebaseMessaging.instance.getInitialMessage();
    if (msg != null) _navigateFromLink(msg.data['link'] as String?);
  }

  /// Called after login — fetches FCM token and registers it on the backend.
  /// Also sets up automatic re-registration on token refresh.
  Future<void> registerToken(String authToken) async {
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) await _sendToBackend(authToken, token);
    FirebaseMessaging.instance.onTokenRefresh.listen(
      (t) => _sendToBackend(authToken, t),
    );
  }

  /// Called before logout — clears the token from both Firebase and the backend.
  Future<void> clearToken(String authToken) async {
    await _sendToBackend(authToken, null);
    await FirebaseMessaging.instance.deleteToken();
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    await _localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
    );
  }

  void _navigateFromLink(String? link) {
    if (link == null) return;
    _router?.go(_mapLinkToRoute(link));
  }

  String _mapLinkToRoute(String link) => switch (link) {
        '/staff/tasks'           => AppRoutes.myTasks,
        '/staff/leave'           => AppRoutes.myLeaves,
        '/staff/overtime'        => AppRoutes.myOvertime,
        '/hr/attendance-records' => AppRoutes.attendanceRecords,
        '/announcements'         => AppRoutes.announcements,
        _                        => AppRoutes.notifications,
      };

  /// Creates a one-shot Dio (no ProviderContainer needed) and sends the token
  /// to PUT /auth/fcm-token. Failure is non-fatal.
  Future<void> _sendToBackend(String authToken, String? token) async {
    try {
      final dio = Dio(BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {'Authorization': 'Bearer $authToken'},
      ));
      await dio.put(ApiConstants.fcmToken, data: {'fcm_token': token});
    } catch (_) {
      // Token update failure is non-fatal — app works without push.
    }
  }
}
