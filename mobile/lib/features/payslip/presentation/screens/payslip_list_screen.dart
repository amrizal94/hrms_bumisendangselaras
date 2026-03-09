import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/router/app_routes.dart';
import '../../data/models/payslip_model.dart';
import '../providers/payslip_provider.dart';

class PayslipListScreen extends ConsumerWidget {
  const PayslipListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncSlips = ref.watch(myPayslipsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Payslips'),
        backgroundColor: Colors.purple.shade700,
        foregroundColor: Colors.white,
      ),
      body: asyncSlips.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (slips) => slips.isEmpty
            ? const Center(child: Text('No payslip records found.'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: slips.length,
                itemBuilder: (_, i) => _PayslipCard(slip: slips[i]),
              ),
      ),
    );
  }
}

class _PayslipCard extends StatelessWidget {
  final PayslipModel slip;
  const _PayslipCard({required this.slip});

  @override
  Widget build(BuildContext context) {
    final monthName = _monthName(slip.periodMonth);
    final statusColor = switch (slip.status) {
      'paid'      => Colors.green,
      'finalized' => Colors.blue,
      _           => Colors.orange,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.purple.shade50,
          child: Icon(Icons.receipt_long, color: Colors.purple.shade700),
        ),
        title: Text(
          '$monthName ${slip.periodYear}',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          'Net: ${_fmtCurrency(slip.netSalary)}',
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                slip.status.toUpperCase(),
                style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.bold),
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
        onTap: () => context.push(
          AppRoutes.payslipDetail.replaceFirst(':id', slip.id.toString()),
          extra: slip,
        ),
      ),
    );
  }

  String _monthName(int m) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[m - 1];
  }

  String _fmtCurrency(double v) {
    final s = v.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (m) => '.',
    );
    return 'Rp $s';
  }
}
