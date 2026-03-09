import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../providers/expense_provider.dart';
import '../../data/models/expense_model.dart';

const _filters = [
  ('all',      'Semua'),
  ('pending',  'Pending'),
  ('approved', 'Disetujui'),
  ('rejected', 'Ditolak'),
];

class MyExpensesScreen extends ConsumerWidget {
  const MyExpensesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expAsync = ref.watch(myExpenseProvider);
    final notifier = ref.read(myExpenseProvider.notifier);
    final filter   = notifier.statusFilter;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Expenses'),
        backgroundColor: Colors.indigo.shade700,
        foregroundColor: Colors.white,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push(AppRoutes.submitExpense),
        backgroundColor: Colors.indigo.shade700,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Column(
        children: [
          // Summary card
          expAsync.maybeWhen(
            data: (expenses) {
              final now     = DateTime.now();
              final monthPfx = '${now.year}-${now.month.toString().padLeft(2, '0')}';
              final pending  = expenses.where((e) => e.status == 'pending').length;
              final approved = expenses.where((e) => e.status == 'approved').length;
              final totalMonth = expenses
                  .where((e) => e.expenseDate.startsWith(monthPfx))
                  .fold(0.0, (sum, e) => sum + e.amount);
              final fmtAmount = 'Rp ${totalMonth.toStringAsFixed(0).replaceAllMapped(
                RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}';
              return Container(
                margin: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.indigo.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.indigo.shade100),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _SummaryItem(label: 'Pending',  value: '$pending',  color: Colors.orange),
                    _SummaryDivider(),
                    _SummaryItem(label: 'Approved', value: '$approved', color: Colors.green),
                    _SummaryDivider(),
                    _SummaryItem(label: 'Bulan Ini', value: fmtAmount,  color: Colors.indigo),
                  ],
                ),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),

          // Filter chips
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: _filters.map((f) {
                final selected = filter == f.$1;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(f.$2),
                    selected: selected,
                    onSelected: (_) => notifier.setFilter(f.$1),
                    selectedColor: Colors.indigo.shade100,
                    checkmarkColor: Colors.indigo.shade700,
                  ),
                );
              }).toList(),
            ),
          ),

          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(myExpenseProvider),
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
                        onPressed: () => ref.invalidate(myExpenseProvider),
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
                          Icon(Icons.receipt_long_outlined, size: 56, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          Text('No expenses found', style: TextStyle(color: Colors.grey.shade600)),
                        ],
                      ),
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
                    itemCount: expenses.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _ExpenseTile(
                      expense: expenses[i],
                      onDelete: (id) async {
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Delete Expense?'),
                            content: const Text('This pending expense will be permanently deleted.'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                              TextButton(
                                onPressed: () => Navigator.pop(ctx, true),
                                child: const Text('Delete', style: TextStyle(color: Colors.red)),
                              ),
                            ],
                          ),
                        );
                        if (confirm == true) {
                          final err = await ref.read(myExpenseProvider.notifier).delete(id);
                          if (err != null && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(err), backgroundColor: Colors.red),
                            );
                          }
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
}

class _SummaryItem extends StatelessWidget {
  final String label;
  final String value;
  final Color  color;
  const _SummaryItem({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(value,
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: color),
            overflow: TextOverflow.ellipsis),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
      ],
    );
  }
}

class _SummaryDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(height: 30, width: 1, color: Colors.indigo.shade100);
  }
}

class _ExpenseTile extends StatelessWidget {
  final ExpenseModel expense;
  final void Function(int id) onDelete;

  const _ExpenseTile({required this.expense, required this.onDelete});

  Color get _statusColor => switch (expense.status) {
        'approved' => Colors.green,
        'rejected' => Colors.red,
        _          => Colors.orange,
      };

  IconData get _statusIcon => switch (expense.status) {
        'approved' => Icons.check_circle,
        'rejected' => Icons.cancel,
        _          => Icons.hourglass_top,
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
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _statusColor.withValues(alpha: 0.12),
          child: Icon(_statusIcon, color: _statusColor, size: 20),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                expense.displayCategory,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            Text(_fmtAmount, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(expense.description, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12)),
            const SizedBox(height: 2),
            Text(expense.expenseDate,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
            if (expense.status == 'rejected' && expense.rejectionReason != null)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  'Reason: ${expense.rejectionReason}',
                  style: const TextStyle(fontSize: 11, color: Colors.red),
                  maxLines: 2,
                ),
              ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (expense.receiptUrl != null)
              Tooltip(
                message: expense.receiptUrl!,
                child: const Icon(Icons.receipt_outlined, size: 18, color: Colors.grey),
              ),
            if (expense.status == 'pending')
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                onPressed: () => onDelete(expense.id),
                tooltip: 'Delete',
              ),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }
}
