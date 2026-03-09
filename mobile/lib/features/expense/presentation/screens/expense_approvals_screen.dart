import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/expense_provider.dart';
import '../../data/models/expense_model.dart';

const _statusFilters = [
  ('all',      'Semua'),
  ('pending',  'Pending'),
  ('approved', 'Disetujui'),
  ('rejected', 'Ditolak'),
];

const _categoryFilters = [
  ('all',           'Semua'),
  ('transport',     'Transport'),
  ('meal',          'Meal'),
  ('accommodation', 'Akomodasi'),
  ('supplies',      'Supplies'),
  ('communication', 'Komunikasi'),
  ('other',         'Lain-lain'),
];

class ExpenseApprovalsScreen extends ConsumerWidget {
  const ExpenseApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expAsync = ref.watch(adminExpenseProvider);
    final notifier = ref.read(adminExpenseProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expense Approvals'),
        backgroundColor: Colors.indigo.shade700,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Status filter chips
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: _statusFilters.map((f) {
                final selected = notifier.statusFilter == f.$1;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(f.$2),
                    selected: selected,
                    onSelected: (_) => notifier.setStatusFilter(f.$1),
                    selectedColor: Colors.indigo.shade100,
                    checkmarkColor: Colors.indigo.shade700,
                  ),
                );
              }).toList(),
            ),
          ),

          // Category filter chips
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              children: _categoryFilters.map((f) {
                final selected = notifier.categoryFilter == f.$1;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f.$2, style: const TextStyle(fontSize: 12)),
                    selected: selected,
                    onSelected: (_) => notifier.setCategoryFilter(f.$1),
                    selectedColor: Colors.teal.shade100,
                  ),
                );
              }).toList(),
            ),
          ),

          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(adminExpenseProvider),
              child: expAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 40),
                      const SizedBox(height: 8),
                      Text(e.toString(), textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(adminExpenseProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (expenses) {
                  if (expenses.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inbox_outlined, size: 56, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          Text('No expenses found', style: TextStyle(color: Colors.grey.shade600)),
                        ],
                      ),
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 24),
                    itemCount: expenses.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _AdminExpenseTile(
                      expense: expenses[i],
                      onApprove: (id) async {
                        final messenger = ScaffoldMessenger.of(context);
                        final err = await ref.read(adminExpenseProvider.notifier).approve(id);
                        if (err != null) {
                          messenger.showSnackBar(
                            SnackBar(content: Text(err), backgroundColor: Colors.red),
                          );
                        } else {
                          messenger.showSnackBar(
                            const SnackBar(content: Text('Expense approved.'), backgroundColor: Colors.green),
                          );
                        }
                      },
                      onReject: (id) async {
                        final reason = await _showRejectDialog(context);
                        if (reason == null || reason.isEmpty) return;
                        final messenger = ScaffoldMessenger.of(context);
                        final err = await ref.read(adminExpenseProvider.notifier).reject(id, reason);
                        if (err != null) {
                          messenger.showSnackBar(
                            SnackBar(content: Text(err), backgroundColor: Colors.red),
                          );
                        } else {
                          messenger.showSnackBar(
                            const SnackBar(content: Text('Expense rejected.'), backgroundColor: Colors.orange),
                          );
                        }
                      },
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<String?> _showRejectDialog(BuildContext context) {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject Expense'),
        content: TextField(
          controller: ctrl,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Rejection Reason',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
            child: const Text('Reject', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _AdminExpenseTile extends StatelessWidget {
  final ExpenseModel expense;
  final void Function(int) onApprove;
  final void Function(int) onReject;

  const _AdminExpenseTile({
    required this.expense,
    required this.onApprove,
    required this.onReject,
  });

  Color get _statusColor => switch (expense.status) {
        'approved' => Colors.green,
        'rejected' => Colors.red,
        _          => Colors.orange,
      };

  String get _fmtAmount {
    final s = expense.amount.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
    return 'Rp $s';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        expense.employeeName ?? 'Unknown',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      if (expense.departmentName != null)
                        Text(expense.departmentName!,
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                    ],
                  ),
                ),
                Text(
                  _fmtAmount,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    expense.status,
                    style: TextStyle(
                      color: _statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    expense.category,
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
                const Spacer(),
                Text(expense.expenseDate,
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
              ],
            ),
            const SizedBox(height: 4),
            Text(expense.description,
                style: const TextStyle(fontSize: 13),
                maxLines: 2,
                overflow: TextOverflow.ellipsis),
            if (expense.status == 'rejected' && expense.rejectionReason != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Reason: ${expense.rejectionReason}',
                  style: const TextStyle(fontSize: 12, color: Colors.red),
                ),
              ),

            if (expense.status == 'pending') ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.close, size: 16),
                      label: const Text('Reject'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                      ),
                      onPressed: () => onReject(expense.id),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Approve'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () => onApprove(expense.id),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
