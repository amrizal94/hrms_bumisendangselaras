import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../notifications/presentation/providers/notification_provider.dart';
import '../../../reports/data/models/reports_overview_model.dart';
import '../../../reports/presentation/providers/reports_provider.dart';

class ManagerDashboardScreen extends ConsumerWidget {
  const ManagerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;
    final isLoggingOut = authState is AuthLoggingOut;
    final overviewAsync = ref.watch(reportsOverviewProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Manager Dashboard'),
        backgroundColor: Colors.teal.shade700,
        foregroundColor: Colors.white,
        actions: [
          if (isLoggingOut)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Center(
                child: SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else ...[
            const _NotificationBadge(),
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Logout',
              onPressed: () async {
                await ref.read(authNotifierProvider.notifier).logout();
                if (context.mounted) context.go(AppRoutes.login);
              },
            ),
          ],
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(reportsOverviewProvider),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.fromLTRB(
              16, 16, 16,
              16 + MediaQuery.of(context).padding.bottom + 24,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome card
                Card(
                  color: Colors.teal.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 30,
                          backgroundColor: Colors.teal.shade700,
                          child: Text(
                            user?.name.substring(0, 1).toUpperCase() ?? 'M',
                            style: const TextStyle(
                                fontSize: 24,
                                color: Colors.white,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Welcome back,',
                                  style: Theme.of(context).textTheme.bodySmall),
                              Text(
                                user?.name ?? 'Manager',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.teal.shade700,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text('MANAGER',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Live stats
                Text('Overview',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),

                overviewAsync.when(
                  loading: () => const Center(
                      child: Padding(
                    padding: EdgeInsets.all(24),
                    child: CircularProgressIndicator(),
                  )),
                  error: (e, _) => Card(
                    child: ListTile(
                      leading: const Icon(Icons.error_outline, color: Colors.red),
                      title: const Text('Failed to load overview'),
                      subtitle: Text(e.toString()),
                      trailing: IconButton(
                        icon: const Icon(Icons.refresh),
                        onPressed: () => ref.invalidate(reportsOverviewProvider),
                      ),
                    ),
                  ),
                  data: (stats) => _ManagerStatsGrid(stats: stats),
                ),

                const SizedBox(height: 20),

                // Manager action menu
                Text('Manager Functions',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),

                _MenuTile(
                  icon: Icons.beach_access_outlined,
                  title: 'Leave Approvals',
                  subtitle: overviewAsync.maybeWhen(
                    data: (s) => s.pendingLeaves > 0
                        ? '${s.pendingLeaves} pending request${s.pendingLeaves > 1 ? 's' : ''}'
                        : 'No pending requests',
                    orElse: () => 'Review & approve leave requests',
                  ),
                  badge: overviewAsync.maybeWhen(
                    data: (s) => s.pendingLeaves,
                    orElse: () => 0,
                  ),
                  color: Colors.orange,
                  onTap: () => context.push(AppRoutes.leaveApprovals),
                ),
                _MenuTile(
                  icon: Icons.more_time,
                  title: 'Overtime Requests',
                  subtitle: overviewAsync.maybeWhen(
                    data: (s) => s.pendingOvertimes > 0
                        ? '${s.pendingOvertimes} pending'
                        : 'No pending requests',
                    orElse: () => 'Review overtime submissions',
                  ),
                  badge: overviewAsync.maybeWhen(
                    data: (s) => s.pendingOvertimes,
                    orElse: () => 0,
                  ),
                  color: Colors.amber.shade700,
                  onTap: () => context.push(AppRoutes.overtimeApprovals),
                ),
                _MenuTile(
                  icon: Icons.people_outline,
                  title: 'Attendance Records',
                  subtitle: 'Monitor employee attendance',
                  badge: 0,
                  color: Colors.teal,
                  onTap: () => context.push(AppRoutes.attendanceRecords),
                ),
                _MenuTile(
                  icon: Icons.bar_chart_outlined,
                  title: 'Reports',
                  subtitle: 'Attendance, leave & overtime reports',
                  badge: 0,
                  color: Colors.indigo,
                  onTap: () => context.push(AppRoutes.reports),
                ),
                _MenuTile(
                  icon: Icons.campaign_outlined,
                  title: 'Announcements',
                  subtitle: 'View & manage company announcements',
                  badge: 0,
                  color: Colors.purple,
                  onTap: () => context.push(AppRoutes.announcements),
                ),
                _MenuTile(
                  icon: Icons.face_retouching_natural,
                  title: 'Face Data Management',
                  subtitle: 'View & delete employee face enrollments',
                  badge: 0,
                  color: Colors.cyan,
                  onTap: () => context.push(AppRoutes.faceManagement),
                ),
                _MenuTile(
                  icon: Icons.badge_outlined,
                  title: 'Employees',
                  subtitle: 'Manage employee accounts & activation',
                  badge: 0,
                  color: Colors.teal,
                  onTap: () => context.push(AppRoutes.employeeList),
                ),
                _MenuTile(
                  icon: Icons.receipt_long_outlined,
                  title: 'Expense Approvals',
                  subtitle: overviewAsync.maybeWhen(
                    data: (s) => s.pendingExpenses > 0
                        ? '${s.pendingExpenses} pending claim${s.pendingExpenses > 1 ? 's' : ''}'
                        : 'Review & approve employee expense claims',
                    orElse: () => 'Review & approve employee expense claims',
                  ),
                  badge: overviewAsync.maybeWhen(
                    data: (s) => s.pendingExpenses,
                    orElse: () => 0,
                  ),
                  color: Colors.deepOrange,
                  onTap: () => context.push(AppRoutes.expenseApprovals),
                ),
                _MenuTile(
                  icon: Icons.qr_code,
                  title: 'QR Absensi',
                  subtitle: 'Generate & kelola QR session absensi',
                  badge: 0,
                  color: Colors.indigo,
                  onTap: () => context.push(AppRoutes.qrGenerator),
                ),
                _MenuTile(
                  icon: Icons.task_alt_outlined,
                  title: 'Tasks & Projects',
                  subtitle: 'Create, assign & monitor tasks',
                  badge: 0,
                  color: Colors.green.shade700,
                  onTap: () => context.push(AppRoutes.myTasks),
                ),
                _MenuTile(
                  icon: Icons.video_call_outlined,
                  title: 'Meetings',
                  subtitle: 'Schedule & manage team meetings',
                  badge: 0,
                  color: Colors.blue.shade700,
                  onTap: () => context.push(AppRoutes.meetings),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Manager Stats grid ─────────────────────────────────────────────────────
class _ManagerStatsGrid extends StatelessWidget {
  final ReportsOverviewModel stats;
  const _ManagerStatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.6,
      children: [
        _StatCard(
            icon: Icons.people,
            title: 'Total Employees',
            value: '${stats.totalEmployees}',
            color: Colors.teal),
        _StatCard(
            icon: Icons.check_circle_outline,
            title: 'Present Today',
            value: '${stats.presentToday}',
            color: Colors.green),
        _StatCard(
            icon: Icons.event_busy,
            title: 'On Leave Today',
            value: '${stats.onLeaveToday}',
            color: Colors.purple),
        _StatCard(
            icon: Icons.pending_actions,
            title: 'Pending Leaves',
            value: '${stats.pendingLeaves}',
            color: Colors.orange),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  final Color color;
  const _StatCard(
      {required this.icon,
      required this.title,
      required this.value,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(value,
                      style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: color)),
                  Text(title,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: Colors.grey.shade600),
                      maxLines: 2),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Notification badge ────────────────────────────────────────────────────────
class _NotificationBadge extends ConsumerWidget {
  const _NotificationBadge();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(unreadCountProvider);
    return Stack(
      children: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          tooltip: 'Notifications',
          onPressed: () => context.push(AppRoutes.notifications),
        ),
        if (unread > 0)
          Positioned(
            right: 6,
            top: 6,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
              child: Text(
                unread > 99 ? '99+' : '$unread',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}

// ── Menu tile ───────────────────────────────────────────────────────────────
class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final int badge;
  final Color color;
  final VoidCallback onTap;
  const _MenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color),
            ),
            if (badge > 0)
              Positioned(
                right: -4,
                top: -4,
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration: const BoxDecoration(
                      color: Colors.red, shape: BoxShape.circle),
                  constraints:
                      const BoxConstraints(minWidth: 16, minHeight: 16),
                  child: Text('$badge',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center),
                ),
              ),
          ],
        ),
        title: Text(title,
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
