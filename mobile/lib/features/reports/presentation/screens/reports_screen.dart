import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/reports_provider.dart';
import '../../data/models/attendance_report_model.dart';
import '../../data/models/leave_report_model.dart';
import '../../data/models/overtime_report_model.dart';
import '../../data/models/payroll_report_model.dart';

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Reports'),
          backgroundColor: Colors.indigo.shade700,
          foregroundColor: Colors.white,
          bottom: const TabBar(
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white60,
            indicatorColor: Colors.white,
            tabs: [
              Tab(text: 'Attendance'),
              Tab(text: 'Leave'),
              Tab(text: 'Payroll'),
              Tab(text: 'Overtime'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _AttendanceTab(),
            _LeaveTab(),
            _PayrollTab(),
            _OvertimeTab(),
          ],
        ),
      ),
    );
  }
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

final _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

String _fmtRupiah(double v) {
  if (v >= 1e9) return 'Rp ${(v / 1e9).toStringAsFixed(1)}M';
  if (v >= 1e6) return 'Rp ${(v / 1e6).toStringAsFixed(1)}jt';
  final s = v.toStringAsFixed(0);
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
    buf.write(s[i]);
  }
  return 'Rp $buf';
}

Widget _buildYearMonthFilter({
  required int year,
  required int month,
  required ValueChanged<int> onYearChanged,
  required ValueChanged<int> onMonthChanged,
}) {
  final now = DateTime.now();
  final years = List.generate(3, (i) => now.year - 2 + i);
  return Container(
    color: Colors.indigo.shade50,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    child: Row(
      children: [
        const Icon(Icons.filter_list, size: 18, color: Colors.indigo),
        const SizedBox(width: 8),
        DropdownButton<int>(
          value: year,
          isDense: true,
          items: years
              .map((y) => DropdownMenuItem(value: y, child: Text('$y')))
              .toList(),
          onChanged: (v) { if (v != null) onYearChanged(v); },
        ),
        const SizedBox(width: 12),
        DropdownButton<int>(
          value: month,
          isDense: true,
          items: List.generate(
            12,
            (i) => DropdownMenuItem(value: i + 1, child: Text(_months[i])),
          ),
          onChanged: (v) { if (v != null) onMonthChanged(v); },
        ),
      ],
    ),
  );
}

Widget _buildYearFilter({
  required int year,
  required ValueChanged<int> onYearChanged,
}) {
  final now = DateTime.now();
  final years = List.generate(3, (i) => now.year - 2 + i);
  return Container(
    color: Colors.indigo.shade50,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    child: Row(
      children: [
        const Icon(Icons.filter_list, size: 18, color: Colors.indigo),
        const SizedBox(width: 8),
        DropdownButton<int>(
          value: year,
          isDense: true,
          items: years
              .map((y) => DropdownMenuItem(value: y, child: Text('$y')))
              .toList(),
          onChanged: (v) { if (v != null) onYearChanged(v); },
        ),
        const Spacer(),
        Text(
          'Annual Leave Report',
          style: TextStyle(fontSize: 12, color: Colors.indigo.shade700),
        ),
      ],
    ),
  );
}


Widget _sectionHeader(String text, {Color? color}) => Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: color ?? Colors.grey.shade600,
          letterSpacing: 0.5,
        ),
      ),
    );

// ── Attendance Tab ─────────────────────────────────────────────────────────────

class _AttendanceTab extends ConsumerStatefulWidget {
  const _AttendanceTab();

  @override
  ConsumerState<_AttendanceTab> createState() => _AttendanceTabState();
}

class _AttendanceTabState extends ConsumerState<_AttendanceTab> {
  late int _year;
  late int _month;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _year = now.year;
    _month = now.month;
  }

  @override
  Widget build(BuildContext context) {
    final params = (year: _year, month: _month);
    final async = ref.watch(attendanceReportProvider(params));

    return Column(
      children: [
        _buildYearMonthFilter(
          year: _year,
          month: _month,
          onYearChanged: (y) => setState(() => _year = y),
          onMonthChanged: (m) => setState(() => _month = m),
        ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  Text(e.toString(), textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () =>
                        ref.invalidate(attendanceReportProvider(params)),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
            data: (result) => _AttendanceList(result: result),
          ),
        ),
      ],
    );
  }
}

class _AttendanceList extends StatelessWidget {
  final AttendanceReportResult result;
  const _AttendanceList({required this.result});

  @override
  Widget build(BuildContext context) {
    final rows = result.rows;
    if (rows.isEmpty) {
      return const Center(child: Text('No data for this period.'));
    }

    final avgRate = rows.isEmpty
        ? 0.0
        : rows.map((r) => r.attendanceRate).reduce((a, b) => a + b) /
            rows.length;

    return ListView(
      children: [
        // Summary card
        Card(
          margin: const EdgeInsets.all(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _SummaryChip(
                    label: 'Employees',
                    value: '${rows.length}',
                    color: Colors.blue),
                _SummaryChip(
                    label: 'Working Days',
                    value: '${result.workingDays}',
                    color: Colors.indigo),
                _SummaryChip(
                    label: 'Avg Rate',
                    value: '${avgRate.toStringAsFixed(1)}%',
                    color: avgRate >= 80 ? Colors.green : Colors.orange),
              ],
            ),
          ),
        ),
        _sectionHeader('${_months[result.month - 1]} ${result.year} — ${rows.length} employees'),
        ...rows.map((r) => _AttendanceRow(row: r)),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _AttendanceRow extends StatelessWidget {
  final AttendanceReportRow row;
  const _AttendanceRow({required this.row});

  @override
  Widget build(BuildContext context) {
    final rateColor = row.attendanceRate >= 80
        ? Colors.green
        : row.attendanceRate >= 60
            ? Colors.orange
            : Colors.red;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
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
                      Text(row.name,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text(
                        '${row.employeeNumber}${row.department != null ? ' · ${row.department}' : ''}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: rateColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${row.attendanceRate.toStringAsFixed(1)}%',
                    style: TextStyle(
                        color: rateColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 13),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _DayStat(label: 'Present', value: row.presentDays, color: Colors.green),
                _DayStat(label: 'Late', value: row.lateDays, color: Colors.orange),
                _DayStat(label: 'Leave', value: row.leaveDays, color: Colors.purple),
                _DayStat(label: 'Absent', value: row.absentDays, color: Colors.red),
                _DayStat(
                    label: 'Hours',
                    value: null,
                    valueStr: row.totalHours.toStringAsFixed(1),
                    color: Colors.indigo),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DayStat extends StatelessWidget {
  final String label;
  final int? value;
  final String? valueStr;
  final Color color;
  const _DayStat(
      {required this.label, this.value, this.valueStr, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(valueStr ?? '${value ?? 0}',
            style: TextStyle(fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
      ],
    );
  }
}

// ── Leave Tab ──────────────────────────────────────────────────────────────────

class _LeaveTab extends ConsumerStatefulWidget {
  const _LeaveTab();

  @override
  ConsumerState<_LeaveTab> createState() => _LeaveTabState();
}

class _LeaveTabState extends ConsumerState<_LeaveTab> {
  late int _year;

  @override
  void initState() {
    super.initState();
    _year = DateTime.now().year;
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(leaveReportProvider(_year));

    return Column(
      children: [
        _buildYearFilter(
          year: _year,
          onYearChanged: (y) => setState(() => _year = y),
        ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  Text(e.toString(), textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(leaveReportProvider(_year)),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
            data: (result) => _LeaveList(result: result),
          ),
        ),
      ],
    );
  }
}

class _LeaveList extends StatelessWidget {
  final LeaveReportResult result;
  const _LeaveList({required this.result});

  @override
  Widget build(BuildContext context) {
    final rows = result.rows;
    if (rows.isEmpty) {
      return const Center(child: Text('No leave data for this year.'));
    }

    final totalApproved = rows.fold(0, (s, r) => s + r.approvedDays);
    final totalPending = rows.fold(0, (s, r) => s + r.pendingDays);

    return ListView(
      children: [
        Card(
          margin: const EdgeInsets.all(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _SummaryChip(
                    label: 'Employees',
                    value: '${rows.length}',
                    color: Colors.blue),
                _SummaryChip(
                    label: 'Approved Days',
                    value: '$totalApproved',
                    color: Colors.green),
                _SummaryChip(
                    label: 'Pending Days',
                    value: '$totalPending',
                    color: Colors.orange),
              ],
            ),
          ),
        ),
        _sectionHeader('${result.year} — ${rows.length} employees'),
        ...rows.map((r) => _LeaveRow(row: r)),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _LeaveRow extends StatelessWidget {
  final LeaveReportRow row;
  const _LeaveRow({required this.row});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        title: Text(row.name,
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          '${row.employeeNumber}${row.department != null ? ' · ${row.department}' : ''}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${row.approvedDays}d approved',
              style: const TextStyle(
                  color: Colors.green,
                  fontWeight: FontWeight.bold,
                  fontSize: 13),
            ),
            if (row.pendingDays > 0)
              Text(
                '${row.pendingDays}d pending',
                style: const TextStyle(color: Colors.orange, fontSize: 11),
              ),
            if (row.rejectedCount > 0)
              Text(
                '${row.rejectedCount} rejected',
                style: const TextStyle(color: Colors.red, fontSize: 11),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Payroll Tab ────────────────────────────────────────────────────────────────

class _PayrollTab extends ConsumerStatefulWidget {
  const _PayrollTab();

  @override
  ConsumerState<_PayrollTab> createState() => _PayrollTabState();
}

class _PayrollTabState extends ConsumerState<_PayrollTab> {
  late int _year;
  late int _month;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _year = now.year;
    _month = now.month;
  }

  @override
  Widget build(BuildContext context) {
    final params = (year: _year, month: _month);
    final async = ref.watch(payrollReportProvider(params));

    return Column(
      children: [
        _buildYearMonthFilter(
          year: _year,
          month: _month,
          onYearChanged: (y) => setState(() => _year = y),
          onMonthChanged: (m) => setState(() => _month = m),
        ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  Text(e.toString(), textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () =>
                        ref.invalidate(payrollReportProvider(params)),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
            data: (result) => _PayrollList(result: result),
          ),
        ),
      ],
    );
  }
}

class _PayrollList extends StatelessWidget {
  final PayrollReportResult result;
  const _PayrollList({required this.result});

  @override
  Widget build(BuildContext context) {
    final rows = result.rows;
    if (rows.isEmpty) {
      return const Center(child: Text('No payroll data for this period.'));
    }

    return ListView(
      children: [
        // Totals card
        Card(
          margin: const EdgeInsets.all(16),
          color: Colors.indigo.shade50,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_months[result.month - 1]} ${result.year} Summary',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _SummaryChip(
                        label: 'Total Gross',
                        value: _fmtRupiah(result.totalGross),
                        color: Colors.indigo),
                    _SummaryChip(
                        label: 'Total Net',
                        value: _fmtRupiah(result.totalNet),
                        color: Colors.green),
                    _SummaryChip(
                        label: 'Deductions',
                        value: _fmtRupiah(result.totalDeductions),
                        color: Colors.red),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _StatusChip('Draft', result.countDraft, Colors.grey),
                    const SizedBox(width: 8),
                    _StatusChip('Final', result.countFinalized, Colors.blue),
                    const SizedBox(width: 8),
                    _StatusChip('Paid', result.countPaid, Colors.green),
                  ],
                ),
              ],
            ),
          ),
        ),
        _sectionHeader('${rows.length} employees'),
        ...rows.map((r) => _PayrollRow(row: r)),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _StatusChip(this.label, this.count, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text('$count $label',
          style:
              TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }
}

class _PayrollRow extends StatelessWidget {
  final PayrollReportRow row;
  const _PayrollRow({required this.row});

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (row.status) {
      'paid' => Colors.green,
      'finalized' => Colors.blue,
      _ => Colors.grey,
    };

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(row.name,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(
                    '${row.employeeNumber}${row.department != null ? ' · ${row.department}' : ''}',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Gross: ${_fmtRupiah(row.grossSalary)}  Deduct: ${_fmtRupiah(row.totalDeductions)}',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  _fmtRupiah(row.netSalary),
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Colors.green),
                ),
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    row.status.toUpperCase(),
                    style: TextStyle(
                        fontSize: 10,
                        color: statusColor,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Overtime Tab ───────────────────────────────────────────────────────────────

class _OvertimeTab extends ConsumerStatefulWidget {
  const _OvertimeTab();

  @override
  ConsumerState<_OvertimeTab> createState() => _OvertimeTabState();
}

class _OvertimeTabState extends ConsumerState<_OvertimeTab> {
  late int _year;
  late int _month;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _year = now.year;
    _month = now.month;
  }

  @override
  Widget build(BuildContext context) {
    final params = (year: _year, month: _month);
    final async = ref.watch(overtimeReportProvider(params));

    return Column(
      children: [
        _buildYearMonthFilter(
          year: _year,
          month: _month,
          onYearChanged: (y) => setState(() => _year = y),
          onMonthChanged: (m) => setState(() => _month = m),
        ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  Text(e.toString(), textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () =>
                        ref.invalidate(overtimeReportProvider(params)),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
            data: (result) => _OvertimeList(result: result),
          ),
        ),
      ],
    );
  }
}

class _OvertimeList extends StatelessWidget {
  final OvertimeReportResult result;
  const _OvertimeList({required this.result});

  @override
  Widget build(BuildContext context) {
    final rows = result.rows;
    if (rows.isEmpty) {
      return const Center(child: Text('No overtime data for this period.'));
    }

    return ListView(
      children: [
        Card(
          margin: const EdgeInsets.all(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _SummaryChip(
                    label: 'Employees',
                    value: '${rows.length}',
                    color: Colors.blue),
                _SummaryChip(
                    label: 'Approved Hrs',
                    value: result.totalApprovedHours.toStringAsFixed(1),
                    color: Colors.green),
                _SummaryChip(
                    label: 'Pending',
                    value: '${result.totalPending}',
                    color: Colors.orange),
              ],
            ),
          ),
        ),
        _sectionHeader(
            '${_months[result.month - 1]} ${result.year} — ${rows.length} employees with overtime'),
        ...rows.map((r) => _OvertimeRow(row: r)),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _OvertimeRow extends StatelessWidget {
  final OvertimeReportRow row;
  const _OvertimeRow({required this.row});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        title: Text(row.name,
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          '${row.employeeNumber}${row.department != null ? ' · ${row.department}' : ''}'
          ' · ${row.totalRequests} request${row.totalRequests != 1 ? 's' : ''}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${row.approvedHours.toStringAsFixed(1)}h',
              style: const TextStyle(
                  color: Colors.green,
                  fontWeight: FontWeight.bold,
                  fontSize: 16),
            ),
            if (row.pendingHours > 0)
              Text(
                '${row.pendingHours.toStringAsFixed(1)}h pending',
                style: const TextStyle(color: Colors.orange, fontSize: 11),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Shared summary chip ────────────────────────────────────────────────────────
class _SummaryChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _SummaryChip(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        Text(label,
            style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ],
    );
  }
}
