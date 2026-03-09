import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/router/app_routes.dart';
import '../../../../../core/services/location_service.dart';
import '../../../../../core/widgets/mock_gps_warning_dialog.dart';
import '../../../attendance/data/models/attendance_policy_model.dart';
import '../../../attendance/presentation/providers/attendance_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../notifications/presentation/providers/notification_provider.dart';
import '../../../shift/presentation/providers/shift_provider.dart';

class StaffDashboardScreen extends ConsumerStatefulWidget {
  const StaffDashboardScreen({super.key});

  @override
  ConsumerState<StaffDashboardScreen> createState() => _StaffDashboardScreenState();
}

class _StaffDashboardScreenState extends ConsumerState<StaffDashboardScreen> {
  late Timer _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String get _timeString {
    final h = _now.hour.toString().padLeft(2, '0');
    final m = _now.minute.toString().padLeft(2, '0');
    final s = _now.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  String get _dateString {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${days[_now.weekday % 7]}, ${_now.day} ${months[_now.month - 1]} ${_now.year}';
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;
    final isLoggingOut = authState is AuthLoggingOut;
    final todayAsync = ref.watch(todayAttendanceProvider);
    final syncState = ref.watch(attendanceSyncProvider);
    final policy = ref.watch(attendancePolicyProvider).asData?.value
        ?? const AttendancePolicyModel(checkInMethod: 'any');
    final shiftAsync = ref.watch(myShiftProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('My Dashboard'),
        backgroundColor: Colors.indigo.shade700,
        foregroundColor: Colors.white,
        actions: [
          const _NotificationBadge(),
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
          else
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Logout',
              onPressed: () async {
                await ref.read(authNotifierProvider.notifier).logout();
                if (context.mounted) context.go(AppRoutes.login);
              },
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(todayAttendanceProvider),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.fromLTRB(
              16,
              16,
              16,
              16 + MediaQuery.of(context).padding.bottom + 24,
            ),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome card
              Card(
                color: Colors.indigo.shade700,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: Colors.white.withValues(alpha: 0.2),
                        child: Text(
                          user?.name.substring(0, 1).toUpperCase() ?? 'S',
                          style: const TextStyle(
                            fontSize: 22,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Welcome back,',
                              style: TextStyle(color: Colors.white70, fontSize: 13),
                            ),
                            Text(
                              user?.name ?? 'Employee',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Clock + Check-in/out card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Text(
                        _timeString,
                        style: Theme.of(context).textTheme.displaySmall?.copyWith(
                              fontWeight: FontWeight.w300,
                              color: Colors.indigo.shade700,
                              fontFeatures: const [FontFeature.tabularFigures()],
                            ),
                      ),
                      Text(
                        _dateString,
                        style: const TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                      const SizedBox(height: 16),

                      // Offline / pending sync banner
                      if (syncState.pendingCount > 0)
                        Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.amber.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.amber.shade300),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                syncState.isSyncing
                                    ? Icons.sync
                                    : Icons.cloud_upload_outlined,
                                size: 15,
                                color: Colors.amber.shade800,
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  syncState.isSyncing
                                      ? 'Syncing attendance...'
                                      : 'Attendance saved offline — will sync when connected',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.amber.shade800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Shift info
                      if (shiftAsync.asData?.value != null) ...[
                        Text(
                          'Shift: ${shiftAsync.asData!.value!.checkInTime} – ${shiftAsync.asData!.value!.checkOutTime}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey[600],
                              ),
                        ),
                        const SizedBox(height: 8),
                      ],

                      // Today's status
                      todayAsync.when(
                        loading: () => const CircularProgressIndicator(),
                        error: (_, __) => const Text('Could not load attendance'),
                        data: (record) => _AttendanceStatusWidget(
                          record: record,
                          policy: policy,
                          onCheckIn: () => _doCheckIn(context),
                          onCheckOut: () => _doCheckOut(context),
                          onFaceCheckIn: () => context.push(
                            AppRoutes.faceCheckin,
                            extra: 'check_in',
                          ),
                          onFaceCheckOut: () => context.push(
                            AppRoutes.faceCheckin,
                            extra: 'check_out',
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Menu tiles
              Text(
                'Quick Access',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),

              _MenuTile(
                icon: Icons.qr_code_scanner,
                title: 'Scan QR Absensi',
                subtitle: 'Scan QR code untuk absensi masuk/pulang',
                color: Colors.blue,
                onTap: () => context.push(AppRoutes.qrScan),
              ),
              _MenuTile(
                icon: Icons.schedule_outlined,
                title: 'Jadwal Kerja',
                subtitle: shiftAsync.asData?.value?.name ?? 'Belum diatur',
                color: Colors.indigo,
                onTap: () => context.push(AppRoutes.myShift),
              ),
              _MenuTile(
                icon: Icons.access_time,
                title: 'My Attendance',
                subtitle: 'View your attendance history',
                color: Colors.indigo,
                onTap: () => context.push(AppRoutes.myAttendance),
              ),
              _MenuTile(
                icon: Icons.beach_access_outlined,
                title: 'Leave Request',
                subtitle: 'Submit & track leave requests',
                color: Colors.orange,
                onTap: () => context.push(AppRoutes.myLeaves),
              ),
              _MenuTile(
                icon: Icons.receipt_long_outlined,
                title: 'Payslip',
                subtitle: 'View your salary details',
                color: Colors.purple,
                onTap: () => context.push(AppRoutes.myPayslips),
              ),
              _MenuTile(
                icon: Icons.more_time,
                title: 'Overtime',
                subtitle: 'Submit & track overtime requests',
                color: Colors.amber.shade700,
                onTap: () => context.push(AppRoutes.myOvertime),
              ),
              _MenuTile(
                icon: Icons.receipt_long_outlined,
                title: 'Expenses',
                subtitle: 'Submit & track expense reimbursements',
                color: Colors.deepOrange,
                onTap: () => context.push(AppRoutes.myExpenses),
              ),
              _MenuTile(
                icon: Icons.event_outlined,
                title: 'Holidays',
                subtitle: 'View public & company holidays',
                color: Colors.teal,
                onTap: () => context.push(AppRoutes.holidays),
              ),
              _MenuTile(
                icon: Icons.task_alt_outlined,
                title: 'My Tasks',
                subtitle: 'View and update your assigned tasks',
                color: Colors.blue.shade700,
                onTap: () => context.push(AppRoutes.myTasks),
              ),
              _MenuTile(
                icon: Icons.campaign_outlined,
                title: 'Announcements',
                subtitle: 'Company announcements & updates',
                color: Colors.purple,
                onTap: () => context.push(AppRoutes.announcements),
              ),
              _MenuTile(
                icon: Icons.video_call_outlined,
                title: 'Meetings',
                subtitle: 'View upcoming meetings & RSVP',
                color: Colors.blue.shade700,
                onTap: () => context.push(AppRoutes.meetings),
              ),
              _MenuTile(
                icon: Icons.inventory_2,
                title: 'Aset Saya',
                subtitle: 'Lihat aset yang dipinjamkan kepada Anda',
                color: Colors.brown.shade600,
                onTap: () => context.push(AppRoutes.myAssets),
              ),
              _MenuTile(
                icon: Icons.notifications_outlined,
                title: 'Notifications',
                subtitle: 'View your notifications',
                color: Colors.blue.shade700,
                onTap: () => context.push(AppRoutes.notifications),
              ),
              _MenuTile(
                icon: Icons.person_outline,
                title: 'My Profile',
                subtitle: 'View & edit your profile and password',
                color: Colors.grey.shade700,
                onTap: () => context.push(AppRoutes.profile),
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }

  Future<void> _doCheckIn(BuildContext context) async {
    // Capture messenger synchronously before any await
    final messenger = ScaffoldMessenger.of(context);
    final location = await LocationService.getCurrentLocation();
    if (!mounted) return;
    if (location != null && location.isMocked) {
      // ignore: use_build_context_synchronously
      await showMockGpsWarningDialog(context);
      return;
    }
    final err = await ref.read(todayAttendanceProvider.notifier).checkIn();
    if (!mounted) return;
    if (err != null) {
      messenger.showSnackBar(SnackBar(content: Text(err)));
    } else {
      final isPending = ref.read(todayAttendanceProvider).value?.isPending == true;
      messenger.showSnackBar(SnackBar(
        content: Text(isPending
            ? 'Check-in saved offline. Will sync when connected.'
            : 'Check-in recorded!'),
        backgroundColor: isPending ? Colors.amber.shade700 : Colors.green,
      ));
    }
  }

  Future<void> _doCheckOut(BuildContext context) async {
    // Capture messenger synchronously before any await
    final messenger = ScaffoldMessenger.of(context);
    final location = await LocationService.getCurrentLocation();
    if (!mounted) return;
    if (location != null && location.isMocked) {
      // ignore: use_build_context_synchronously
      await showMockGpsWarningDialog(context);
      return;
    }
    final err = await ref.read(todayAttendanceProvider.notifier).checkOut();
    if (!mounted) return;
    if (err != null) {
      messenger.showSnackBar(SnackBar(content: Text(err)));
    } else {
      final isPending = ref.read(todayAttendanceProvider).value?.isPending == true;
      messenger.showSnackBar(SnackBar(
        content: Text(isPending
            ? 'Check-out saved offline. Will sync when connected.'
            : 'Check-out recorded!'),
        backgroundColor: isPending ? Colors.amber.shade700 : Colors.blue,
      ));
    }
  }
}

// ── Today attendance status widget ──────────────────────────────────────────
class _AttendanceStatusWidget extends StatelessWidget {
  final dynamic record; // AttendanceRecordModel?
  final AttendancePolicyModel policy;
  final VoidCallback onCheckIn;
  final VoidCallback onCheckOut;
  final VoidCallback onFaceCheckIn;
  final VoidCallback onFaceCheckOut;

  const _AttendanceStatusWidget({
    required this.record,
    required this.policy,
    required this.onCheckIn,
    required this.onCheckOut,
    required this.onFaceCheckIn,
    required this.onFaceCheckOut,
  });

  @override
  Widget build(BuildContext context) {
    if (record == null) {
      // Not yet checked in — show buttons based on policy
      final showManual = !policy.isFaceOnly;
      final showFace   = !policy.isManualOnly;

      return Column(
        children: [
          const Text('Not checked in yet', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 12),
          if (showManual)
            ElevatedButton.icon(
              onPressed: onCheckIn,
              icon: const Icon(Icons.login),
              label: const Text('Check In'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
              ),
            ),
          if (showManual && showFace) const SizedBox(height: 8),
          if (showFace)
            OutlinedButton.icon(
              onPressed: onFaceCheckIn,
              icon: const Icon(Icons.face_retouching_natural),
              label: const Text('Face Check-In'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.green,
                side: const BorderSide(color: Colors.green),
                minimumSize: const Size(double.infinity, 44),
              ),
            ),
        ],
      );
    }

    final checkInTime = _fmtTime(record.checkIn);
    final checkOutTime = _fmtTime(record.checkOut);
    final statusColor = switch (record.status) {
      'present'  => Colors.green,
      'late'     => Colors.orange,
      'on_leave' => Colors.purple,
      _          => Colors.grey,
    };

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _TimeChip(label: 'Check In', time: checkInTime, color: Colors.green),
            _TimeChip(label: 'Check Out', time: checkOutTime, color: Colors.blue),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            record.status.toUpperCase(),
            style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
          ),
        ),
        if (record.checkOut == null) ...[
          const SizedBox(height: 12),
          if (!policy.isFaceOnly)
            ElevatedButton.icon(
              onPressed: onCheckOut,
              icon: const Icon(Icons.logout),
              label: const Text('Check Out'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
              ),
            ),
          if (!policy.isFaceOnly && !policy.isManualOnly) const SizedBox(height: 8),
          if (!policy.isManualOnly)
            OutlinedButton.icon(
              onPressed: onFaceCheckOut,
              icon: const Icon(Icons.face_retouching_natural),
              label: const Text('Face Check-Out'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.blue,
                side: const BorderSide(color: Colors.blue),
                minimumSize: const Size(double.infinity, 44),
              ),
            ),
        ] else if (record.workHours != null) ...[
          const SizedBox(height: 4),
          Text(
            'Work hours: ${record.workHours!.toStringAsFixed(1)}h',
            style: const TextStyle(color: Colors.grey, fontSize: 13),
          ),
        ],
      ],
    );
  }

  String _fmtTime(String? iso) {
    if (iso == null) return '—:—';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '—:—';
    }
  }
}

class _TimeChip extends StatelessWidget {
  final String label;
  final String time;
  final Color color;
  const _TimeChip({required this.label, required this.time, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 2),
        Text(
          time,
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color),
        ),
      ],
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
  final Color color;
  final VoidCallback onTap;

  const _MenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
