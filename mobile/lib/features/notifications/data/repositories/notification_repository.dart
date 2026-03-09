import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/notification_remote_datasource.dart';
import '../models/notification_model.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>(
  (ref) => NotificationRepository(ref.watch(notificationRemoteDataSourceProvider)),
);

class NotificationRepository {
  final NotificationRemoteDataSource _ds;
  NotificationRepository(this._ds);

  Future<List<NotificationModel>> getNotifications() => _ds.getNotifications();
  Future<void> markRead(String id) => _ds.markRead(id);
  Future<void> markAllRead() => _ds.markAllRead();
}
