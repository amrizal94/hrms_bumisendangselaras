import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/notification_model.dart';
import '../providers/notification_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        actions: [
          notifsAsync.maybeWhen(
            data: (notifs) {
              final hasUnread = notifs.any((n) => !n.read);
              if (!hasUnread) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () async {
                  final err =
                      await ref.read(notificationsProvider.notifier).markAllRead();
                  if (err != null && context.mounted) {
                    ScaffoldMessenger.of(context)
                        .showSnackBar(SnackBar(content: Text(err)));
                  }
                },
                icon: const Icon(Icons.done_all, color: Colors.white, size: 18),
                label: const Text('Mark all read',
                    style: TextStyle(color: Colors.white, fontSize: 12)),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(notificationsProvider),
        child: notifsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (notifs) => notifs.isEmpty
              ? const Center(child: Text('No notifications yet.'))
              : ListView.builder(
                  itemCount: notifs.length,
                  itemBuilder: (context, i) =>
                      _NotifTile(notif: notifs[i], ref: ref),
                ),
        ),
      ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  final NotificationModel notif;
  final WidgetRef ref;
  const _NotifTile({required this.notif, required this.ref});

  String _relativeTime(String isoStr) {
    try {
      final dt = DateTime.parse(isoStr).toLocal();
      final diff = DateTime.now().difference(dt);
      if (diff.inSeconds < 60) return 'just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return isoStr.substring(0, 10);
    } catch (_) {
      return isoStr;
    }
  }

  IconData _iconForType(String type) => switch (type) {
        'leave_status'    => Icons.beach_access_outlined,
        'overtime_status' => Icons.access_time_filled,
        _                 => Icons.notifications_outlined,
      };

  @override
  Widget build(BuildContext context) {
    final isUnread = !notif.read;
    final typeIcon = _iconForType(notif.type);

    return InkWell(
      onTap: () async {
        if (isUnread) {
          await ref.read(notificationsProvider.notifier).markRead(notif.id);
        }
      },
      child: Container(
        color: isUnread ? Colors.blue.shade50 : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.shade700.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(typeIcon, color: Colors.blue.shade700, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notif.title,
                            style: TextStyle(
                              fontWeight:
                                  isUnread ? FontWeight.bold : FontWeight.w500,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        if (isUnread)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Colors.blue,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      notif.message,
                      style: const TextStyle(fontSize: 13, color: Colors.black87),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _relativeTime(notif.createdAt),
                      style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
