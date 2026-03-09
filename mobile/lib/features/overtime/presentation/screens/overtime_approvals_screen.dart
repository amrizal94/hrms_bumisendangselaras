import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/overtime_model.dart';
import '../providers/overtime_approvals_provider.dart';

class OvertimeApprovalsScreen extends ConsumerWidget {
  const OvertimeApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final approvalsAsync = ref.watch(overtimeApprovalsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Overtime Approvals'),
        backgroundColor: Colors.amber.shade700,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(overtimeApprovalsProvider),
        child: approvalsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (requests) => requests.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle_outline,
                          size: 64, color: Colors.green),
                      SizedBox(height: 12),
                      Text('No pending overtime requests',
                          style: TextStyle(fontSize: 16, color: Colors.grey)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: requests.length,
                  itemBuilder: (context, i) =>
                      _OvertimeApprovalCard(request: requests[i], ref: ref),
                ),
        ),
      ),
    );
  }
}

class _OvertimeApprovalCard extends StatelessWidget {
  final OvertimeModel request;
  final WidgetRef ref;
  const _OvertimeApprovalCard({required this.request, required this.ref});

  Future<void> _approve(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Approve Overtime'),
        content: Text(
            'Approve overtime request from ${request.employeeName ?? 'this employee'}?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Approve')),
        ],
      ),
    );
    if (confirm != true || !context.mounted) return;
    final err = await ref
        .read(overtimeApprovalsProvider.notifier)
        .approve(request.id);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(err ?? 'Overtime approved'),
        backgroundColor: err != null ? Colors.red : Colors.green,
      ),
    );
  }

  Future<void> _reject(BuildContext context) async {
    final reasonCtrl = TextEditingController();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Reject Overtime'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
                'Reject overtime request from ${request.employeeName ?? 'this employee'}?'),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              decoration: const InputDecoration(
                labelText: 'Rejection reason',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Reject'),
          ),
        ],
      ),
    );
    if (confirm != true || !context.mounted) return;
    final err = await ref
        .read(overtimeApprovalsProvider.notifier)
        .reject(request.id, reasonCtrl.text.trim());
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(err ?? 'Overtime rejected'),
        backgroundColor: err != null ? Colors.red : Colors.orange,
      ),
    );
  }

  String _typeLabel(String type) => switch (type) {
        'weekend' => 'Weekend',
        'holiday' => 'Holiday',
        _ => 'Regular',
      };

  Color _typeColor(String type) => switch (type) {
        'weekend' => Colors.purple,
        'holiday' => Colors.red,
        _ => Colors.amber.shade700,
      };

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Employee info
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: Colors.amber.shade100,
                  child: Text(
                    (request.employeeName ?? '?').substring(0, 1).toUpperCase(),
                    style: TextStyle(
                        color: Colors.amber.shade800,
                        fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        request.employeeName ?? 'Unknown Employee',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      if (request.employeeNumber != null)
                        Text(
                          request.employeeNumber!,
                          style: TextStyle(
                              fontSize: 11, color: Colors.grey.shade600),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _typeColor(request.overtimeType).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _typeLabel(request.overtimeType),
                    style: TextStyle(
                        fontSize: 11,
                        color: _typeColor(request.overtimeType),
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),

            const Divider(height: 16),

            // Date + hours
            Row(
              children: [
                const Icon(Icons.date_range, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(request.date,
                    style: const TextStyle(fontSize: 13)),
                const Spacer(),
                const Icon(Icons.schedule, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  '${request.overtimeHours.toStringAsFixed(1)} hrs',
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ],
            ),

            const SizedBox(height: 6),

            // Reason
            Text(
              request.reason,
              style: const TextStyle(fontSize: 13, color: Colors.black87),
            ),

            const SizedBox(height: 12),

            // Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                  ),
                  icon: const Icon(Icons.close, size: 16),
                  label: const Text('Reject'),
                  onPressed: () => _reject(context),
                ),
                const SizedBox(width: 10),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                      backgroundColor: Colors.green),
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Approve'),
                  onPressed: () => _approve(context),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
