import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/notification_model.dart';
import '../../data/repositories/notification_repository.dart';

class NotificationsNotifier extends AsyncNotifier<List<NotificationModel>> {
  @override
  Future<List<NotificationModel>> build() =>
      ref.watch(notificationRepositoryProvider).getNotifications();

  Future<String?> markRead(String id) async {
    try {
      await ref.read(notificationRepositoryProvider).markRead(id);
      // Optimistically update without full reload
      final current = switch (state) { AsyncData(:final value) => value, _ => null };
      if (current != null) {
        state = AsyncData(
          current.map((n) => n.id == id ? n.copyWith(read: true) : n).toList(),
        );
      }
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> markAllRead() async {
    try {
      await ref.read(notificationRepositoryProvider).markAllRead();
      final current = switch (state) { AsyncData(:final value) => value, _ => null };
      if (current != null) {
        state = AsyncData(current.map((n) => n.copyWith(read: true)).toList());
      }
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<NotificationModel>>(
        () => NotificationsNotifier());

final unreadCountProvider = Provider<int>((ref) {
  final notifAsync = ref.watch(notificationsProvider);
  return switch (notifAsync) {
    AsyncData(:final value) => value.where((n) => !n.read).length,
    _ => 0,
  };
});
