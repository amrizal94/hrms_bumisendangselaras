import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/router/app_routes.dart';
import '../../data/models/overtime_model.dart';
import '../providers/overtime_provider.dart';

class MyOvertimeScreen extends ConsumerWidget {
  const MyOvertimeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overtimesAsync = ref.watch(myOvertimesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Overtime'),
        backgroundColor: Colors.amber.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Submit Overtime',
            onPressed: () => context.push(AppRoutes.submitOvertime),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myOvertimesProvider),
        child: overtimesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (overtimes) => overtimes.isEmpty
              ? const Center(child: Text('No overtime requests yet.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: overtimes.length,
                  itemBuilder: (context, i) =>
                      _OvertimeCard(overtime: overtimes[i], ref: ref),
                ),
        ),
      ),
    );
  }
}

class _OvertimeCard extends StatelessWidget {
  final OvertimeModel overtime;
  final WidgetRef ref;
  const _OvertimeCard({required this.overtime, required this.ref});

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (overtime.status) {
      'approved'  => Colors.green,
      'rejected'  => Colors.red,
      'cancelled' => Colors.grey,
      _           => Colors.amber.shade700,
    };

    final typeColor = switch (overtime.overtimeType) {
      'weekend' => Colors.blue,
      'holiday' => Colors.purple,
      _         => Colors.teal,
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
                  overtime.date,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    overtime.status.toUpperCase(),
                    style: TextStyle(
                        fontSize: 11, color: statusColor, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: typeColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    overtime.overtimeType.toUpperCase(),
                    style: TextStyle(fontSize: 10, color: typeColor, fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${overtime.overtimeHours}h overtime',
                  style: const TextStyle(fontSize: 13, color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(overtime.reason, style: const TextStyle(fontSize: 13)),
            if (overtime.rejectionReason != null) ...[
              const SizedBox(height: 4),
              Text(
                'Rejection: ${overtime.rejectionReason}',
                style: const TextStyle(fontSize: 12, color: Colors.red),
              ),
            ],
            if (overtime.approvedByName != null && overtime.status == 'approved') ...[
              const SizedBox(height: 4),
              Text(
                'Approved by: ${overtime.approvedByName}',
                style: const TextStyle(fontSize: 12, color: Colors.green),
              ),
            ],
            if (overtime.status == 'pending') ...[
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
                        title: const Text('Cancel Overtime'),
                        content: const Text(
                            'Are you sure you want to cancel this overtime request?'),
                        actions: [
                          TextButton(
                              onPressed: () => Navigator.pop(context, false),
                              child: const Text('No')),
                          TextButton(
                              onPressed: () => Navigator.pop(context, true),
                              child: const Text('Yes')),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      final err =
                          await ref.read(myOvertimesProvider.notifier).cancelOvertime(overtime.id);
                      if (err != null && context.mounted) {
                        ScaffoldMessenger.of(context)
                            .showSnackBar(SnackBar(content: Text(err)));
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
