import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/attendance_record_model.dart';
import '../providers/attendance_provider.dart';
import 'attendance_form_screen.dart';

class AttendanceRecordsScreen extends ConsumerStatefulWidget {
  const AttendanceRecordsScreen({super.key});

  @override
  ConsumerState<AttendanceRecordsScreen> createState() =>
      _AttendanceRecordsScreenState();
}

class _AttendanceRecordsScreenState
    extends ConsumerState<AttendanceRecordsScreen> {
  DateTime _selectedDate = DateTime.now();
  String? _filterStatus; // null = all

  String get _dateStr =>
      '${_selectedDate.year}-'
      '${_selectedDate.month.toString().padLeft(2, '0')}-'
      '${_selectedDate.day.toString().padLeft(2, '0')}';

  void _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    AttendanceRecordModel record,
    AllAttendanceParams params,
  ) {
    final messenger = ScaffoldMessenger.of(context);
    showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hapus Record'),
        content: Text(
          'Hapus record kehadiran ${record.employeeName ?? ''} '
          'tanggal ${record.date}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style:
                ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Hapus',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    ).then((confirmed) async {
      if (confirmed != true) return;
      final error = await ref
          .read(adminAttendanceCorrectionProvider.notifier)
          .delete(record.id);
      if (error != null) {
        messenger.showSnackBar(SnackBar(
          content: Text(error),
          backgroundColor: Colors.red,
        ));
      } else {
        ref.invalidate(allAttendanceProvider(params));
        messenger.showSnackBar(const SnackBar(
          content: Text('Record dihapus.'),
          backgroundColor: Colors.teal,
        ));
      }
    });
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  @override
  Widget build(BuildContext context) {
    final params = (date: _dateStr, status: _filterStatus);
    final asyncRecords = ref.watch(allAttendanceProvider(params));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Records'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(allAttendanceProvider(params)),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        tooltip: 'Tambah Record',
        onPressed: () async {
          final result = await Navigator.of(context).push<bool>(
            MaterialPageRoute(
              builder: (_) => const AttendanceFormScreen(),
            ),
          );
          if (result == true) {
            ref.invalidate(allAttendanceProvider(params));
          }
        },
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          // Filter bar
          Container(
            color: Colors.teal.shade50,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                // Date picker
                Expanded(
                  child: InkWell(
                    onTap: _pickDate,
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.teal.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.calendar_today,
                              size: 16, color: Colors.teal.shade700),
                          const SizedBox(width: 6),
                          Text(
                            _dateStr,
                            style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: Colors.teal.shade800),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Status filter
                DropdownButtonHideUnderline(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.teal.shade200),
                    ),
                    child: DropdownButton<String?>(
                      value: _filterStatus,
                      hint: const Text('All'),
                      items: const [
                        DropdownMenuItem(value: null, child: Text('All')),
                        DropdownMenuItem(
                            value: 'present', child: Text('Present')),
                        DropdownMenuItem(value: 'late', child: Text('Late')),
                        DropdownMenuItem(
                            value: 'absent', child: Text('Absent')),
                        DropdownMenuItem(
                            value: 'on_leave', child: Text('On Leave')),
                      ],
                      onChanged: (v) => setState(() => _filterStatus = v),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async =>
                  ref.invalidate(allAttendanceProvider(params)),
              child: asyncRecords.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: Colors.red),
                      const SizedBox(height: 12),
                      Text(e.toString(), textAlign: TextAlign.center),
                      TextButton(
                        onPressed: () =>
                            ref.invalidate(allAttendanceProvider(params)),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (records) {
                  if (records.isEmpty) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.people_outline,
                              size: 64, color: Colors.grey),
                          SizedBox(height: 12),
                          Text('No records for selected date',
                              style:
                                  TextStyle(fontSize: 16, color: Colors.grey)),
                        ],
                      ),
                    );
                  }

                  // Summary chips
                  final counts = <String, int>{};
                  for (final r in records) {
                    counts[r.status] = (counts[r.status] ?? 0) + 1;
                  }

                  return ListView(
                    padding: const EdgeInsets.all(12),
                    children: [
                      // Summary row
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          _SummaryChip(
                              label: 'Total',
                              count: records.length,
                              color: Colors.teal),
                          if (counts['present'] != null)
                            _SummaryChip(
                                label: 'Present',
                                count: counts['present']!,
                                color: Colors.green),
                          if (counts['late'] != null)
                            _SummaryChip(
                                label: 'Late',
                                count: counts['late']!,
                                color: Colors.orange),
                          if (counts['absent'] != null)
                            _SummaryChip(
                                label: 'Absent',
                                count: counts['absent']!,
                                color: Colors.red),
                          if (counts['on_leave'] != null)
                            _SummaryChip(
                                label: 'On Leave',
                                count: counts['on_leave']!,
                                color: Colors.purple),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ...records.map((r) => _AttendanceRecordTile(
                            record: r,
                            onTap: () async {
                              final result =
                                  await Navigator.of(context).push<bool>(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      AttendanceFormScreen(record: r),
                                ),
                              );
                              if (result == true) {
                                ref.invalidate(allAttendanceProvider(params));
                              }
                            },
                            onLongPress: () =>
                                _confirmDelete(context, ref, r, params),
                          )),
                    ],
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

class _SummaryChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _SummaryChip(
      {required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        '$label: $count',
        style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}

class _AttendanceRecordTile extends StatelessWidget {
  final AttendanceRecordModel record;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  const _AttendanceRecordTile({
    required this.record,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (record.status) {
      'present' => Colors.green,
      'late' => Colors.orange,
      'absent' => Colors.red,
      'on_leave' => Colors.purple,
      _ => Colors.grey,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        onLongPress: onLongPress,
        leading: CircleAvatar(
          backgroundColor: statusColor.withValues(alpha: 0.15),
          child: Text(
            (record.employeeName ?? '?').substring(0, 1).toUpperCase(),
            style: TextStyle(
                color: statusColor, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(
          record.employeeName ?? 'Unknown',
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (record.employeeNumber != null)
              Text(record.employeeNumber!,
                  style: TextStyle(
                      fontSize: 11, color: Colors.grey.shade600)),
            Text(
              '${_fmt(record.checkIn)} → ${_fmt(record.checkOut)}',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        isThreeLine: record.employeeNumber != null,
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                record.status.toUpperCase().replaceAll('_', ' '),
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: statusColor),
              ),
            ),
            if (record.workHours != null)
              Text(
                '${record.workHours!.toStringAsFixed(1)}h',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
          ],
        ),
      ),
    );
  }

  String _fmt(String? iso) {
    if (iso == null) return '—';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }
}
