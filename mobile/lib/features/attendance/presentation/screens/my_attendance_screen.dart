import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/attendance_record_model.dart';
import '../providers/attendance_provider.dart';

class MyAttendanceScreen extends ConsumerWidget {
  const MyAttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final now = DateTime.now();
    final dateFrom = DateTime(now.year, now.month, 1).toIso8601String().substring(0, 10);
    final dateTo = now.toIso8601String().substring(0, 10);

    final asyncList = ref.watch(myAttendanceListProvider((dateFrom: dateFrom, dateTo: dateTo)));

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Attendance'),
        backgroundColor: Colors.indigo.shade700,
        foregroundColor: Colors.white,
      ),
      body: asyncList.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 12),
              Text(e.toString(), textAlign: TextAlign.center),
              TextButton(
                onPressed: () => ref.invalidate(myAttendanceListProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (records) => records.isEmpty
            ? const Center(child: Text('No attendance records this month.'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: records.length,
                itemBuilder: (_, i) => _AttendanceTile(record: records[i]),
              ),
      ),
    );
  }
}

class _AttendanceTile extends StatelessWidget {
  final AttendanceRecordModel record;
  const _AttendanceTile({required this.record});

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (record.status) {
      'present'  => Colors.green,
      'late'     => Colors.orange,
      'absent'   => Colors.red,
      'on_leave' => Colors.purple,
      _          => Colors.grey,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: statusColor.withValues(alpha: 0.15),
          child: Icon(Icons.calendar_today, color: statusColor, size: 20),
        ),
        title: Text(record.date, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('${_fmt(record.checkIn)} → ${_fmt(record.checkOut)}'),
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
                record.status.toUpperCase(),
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
              ),
            ),
            if (record.workHours != null)
              Text('${record.workHours!.toStringAsFixed(1)}h',
                  style: const TextStyle(fontSize: 12, color: Colors.grey)),
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
