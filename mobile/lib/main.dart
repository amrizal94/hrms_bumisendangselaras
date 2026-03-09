import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/router/app_router.dart';
import 'core/services/push_notification_service.dart';
import 'core/theme/app_theme.dart';
import 'features/onboarding/presentation/screens/permission_setup_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await PushNotificationService.initialize();
  final prefs = await SharedPreferences.getInstance();
  final setupDone = prefs.getBool('permission_setup_done') ?? false;

  runApp(
    ProviderScope(
      overrides: [
        permissionSetupDoneProvider.overrideWith(
          () => PermissionSetupDoneNotifier(setupDone),
        ),
      ],
      child: const BSSHRMSApp(),
    ),
  );
}

class BSSHRMSApp extends ConsumerWidget {
  const BSSHRMSApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      PushNotificationService.instance.handleInitialMessage();
    });

    return MaterialApp.router(
      title: 'BSS HRMS',
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
