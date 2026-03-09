import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/router/app_routes.dart';
import '../../data/models/leave_quota_model.dart';
import '../../data/models/leave_request_model.dart';
import '../providers/leave_provider.dart';

class MyLeavesScreen extends ConsumerWidget {
  const MyLeavesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leavesAsync = ref.watch(myLeavesProvider);
    final quotaAsync  = ref.watch(leaveQuotaProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Leaves'),
        backgroundColor: Colors.orange.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Apply Leave',
            onPressed: () => context.push(AppRoutes.applyLeave),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myLeavesProvider);
          ref.invalidate(leaveQuotaProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Quota cards
              quotaAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const SizedBox.shrink(),
                data: (quotas) => _QuotaSection(quotas: quotas),
              ),

              const SizedBox(height: 16),

              Text(
                'Leave Requests',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),

              leavesAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Text('Error: $e'),
                data: (leaves) => leaves.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.only(top: 32),
                        child: Center(child: Text('No leave requests yet.')),
                      )
                    : Column(
                        children: leaves.map((l) => _LeaveCard(leave: l, ref: ref)).toList(),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuotaSection extends StatelessWidget {
  final List<LeaveQuotaModel> quotas;
  const _QuotaSection({required this.quotas});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Leave Balance',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        ...quotas.map((q) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(q.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                        Text(
                          '${q.remaining}/${q.quota} days left',
                          style: TextStyle(
                            fontSize: 12,
                            color: q.remaining > 0 ? Colors.green : Colors.red,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    LinearProgressIndicator(
                      value: q.quota > 0 ? q.used / q.quota : 0,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        q.remaining > 0 ? Colors.orange : Colors.red,
                      ),
                    ),
                  ],
                ),
              ),
            )),
      ],
    );
  }
}

class _LeaveCard extends StatelessWidget {
  final LeaveRequestModel leave;
  final WidgetRef ref;
  const _LeaveCard({required this.leave, required this.ref});

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (leave.status) {
      'approved' => Colors.green,
      'rejected' => Colors.red,
      'pending'  => Colors.orange,
      _          => Colors.grey,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  leave.leaveTypeName,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    leave.status.toUpperCase(),
                    style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${leave.startDate} → ${leave.endDate}  (${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''})',
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
            Text(leave.reason, style: const TextStyle(fontSize: 13)),
            if (leave.rejectReason != null) ...[
              const SizedBox(height: 4),
              Text(
                'Reason: ${leave.rejectReason}',
                style: const TextStyle(fontSize: 12, color: Colors.red),
              ),
            ],
            if (leave.status == 'pending') ...[
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  style: TextButton.styleFrom(foregroundColor: Colors.red),
                  icon: const Icon(Icons.cancel_outlined, size: 16),
                  label: const Text('Cancel', style: TextStyle(fontSize: 12)),
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('Cancel Leave'),
                        content: const Text('Are you sure you want to cancel this leave request?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
                          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Yes')),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      final err = await ref.read(myLeavesProvider.notifier).cancelLeave(leave.id);
                      if (err != null && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
                      }
                    }
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
