import 'package:flutter/material.dart';
import 'package:printing/printing.dart';

import '../../data/models/payslip_model.dart';
import '../utils/payslip_pdf_service.dart';

class PayslipDetailScreen extends StatelessWidget {
  final PayslipModel slip;
  const PayslipDetailScreen({super.key, required this.slip});

  Future<void> _sharePdf(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final bytes = await PayslipPdfService.generate(slip);
      final month = _monthName(slip.periodMonth).toLowerCase();
      await Printing.sharePdf(
        bytes: bytes,
        filename: 'payslip-$month-${slip.periodYear}.pdf',
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(content: Text('Gagal membuat PDF: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final monthName = _monthName(slip.periodMonth);

    return Scaffold(
      appBar: AppBar(
        title: Text('$monthName ${slip.periodYear}'),
        backgroundColor: Colors.purple.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            tooltip: 'Bagikan PDF',
            onPressed: () => _sharePdf(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Header card
            _HeaderCard(slip: slip, monthName: monthName),
            const SizedBox(height: 16),

            // Attendance summary
            _Section(
              title: 'Attendance',
              rows: [
                _Row('Working Days', '${slip.workingDays} days'),
                _Row('Present Days', '${slip.presentDays} days'),
                _Row('Leave Days',   '${slip.leaveDays} days'),
                _Row('Absent Days',  '${slip.absentDays} days'),
              ],
            ),
            const SizedBox(height: 12),

            // Earnings
            _Section(
              title: 'Earnings',
              rows: [
                _Row('Basic Salary',  _fmt(slip.basicSalary)),
                _Row('Allowances',    _fmt(slip.allowances)),
                _Row('Overtime Pay',  _fmt(slip.overtimePay)),
                _Row('Gross Salary',  _fmt(slip.grossSalary), bold: true),
              ],
            ),
            const SizedBox(height: 12),

            // Deductions
            _Section(
              title: 'Deductions',
              rows: [
                _Row('Absent Deduction', _fmt(slip.absentDeduction)),
                _Row('Tax (PPh21)',       _fmt(slip.taxDeduction)),
                _Row('BPJS',             _fmt(slip.bpjsDeduction)),
                _Row('Other',            _fmt(slip.otherDeductions)),
                _Row('Total Deductions', _fmt(slip.totalDeductions),
                    bold: true, color: Colors.red),
              ],
            ),
            const SizedBox(height: 12),

            // Net salary
            Card(
              color: Colors.purple.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Net Salary',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      _fmt(slip.netSalary),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.purple.shade700,
                          ),
                    ),
                  ],
                ),
              ),
            ),

            // Paid date / notes
            if (slip.paidAt != null || slip.notes != null) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Column(
                    children: [
                      if (slip.paidAt != null)
                        _Row('Paid Date', _fmtDate(slip.paidAt!)),
                      if (slip.notes != null)
                        _Row('Notes', slip.notes!),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  String _monthName(int m) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months[m - 1];
  }

  String _fmt(double v) {
    final s = v.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (m) => '.',
    );
    return 'Rp $s';
  }

  String _fmtDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return iso;
    }
  }
}

class _HeaderCard extends StatelessWidget {
  final PayslipModel slip;
  final String monthName;
  const _HeaderCard({required this.slip, required this.monthName});

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (slip.status) {
      'paid'      => Colors.green,
      'finalized' => Colors.blue,
      _           => Colors.orange,
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: Colors.purple.shade100,
              child: Icon(Icons.receipt_long,
                  color: Colors.purple.shade700, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Payslip · $monthName ${slip.periodYear}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      slip.status.toUpperCase(),
                      style: TextStyle(
                          fontSize: 11,
                          color: statusColor,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<_Row> rows;
  const _Section({required this.title, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 15)),
            const Divider(),
            ...rows,
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final bool bold;
  final Color? color;
  const _Row(this.label, this.value, {this.bold = false, this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade700)),
          Text(
            value,
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
