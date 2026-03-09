import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../employee/data/repositories/employee_repository.dart';
import '../../data/models/attendance_record_model.dart';
import '../providers/attendance_provider.dart';

/// Pass [record] = null for create mode, non-null for edit mode.
class AttendanceFormScreen extends ConsumerStatefulWidget {
  final AttendanceRecordModel? record;
  const AttendanceFormScreen({super.key, this.record});

  @override
  ConsumerState<AttendanceFormScreen> createState() =>
      _AttendanceFormScreenState();
}

class _AttendanceFormScreenState extends ConsumerState<AttendanceFormScreen> {
  final _formKey = GlobalKey<FormState>();

  bool get _isEdit => widget.record != null;

  // Employee dropdown (create mode only)
  int? _selectedEmployeeId;
  String? _selectedEmployeeName;

  // Date
  DateTime _date = DateTime.now();

  // Times
  TimeOfDay? _checkInTime;
  TimeOfDay? _checkOutTime;

  // Status
  String _status = 'present';

  // Notes
  final _notesCtrl = TextEditingController();

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      final r = widget.record!;
      _date = DateTime.tryParse(r.date) ?? DateTime.now();
      if (r.checkIn != null) {
        final dt = DateTime.tryParse(r.checkIn!)?.toLocal();
        if (dt != null) _checkInTime = TimeOfDay(hour: dt.hour, minute: dt.minute);
      }
      if (r.checkOut != null) {
        final dt = DateTime.tryParse(r.checkOut!)?.toLocal();
        if (dt != null) _checkOutTime = TimeOfDay(hour: dt.hour, minute: dt.minute);
      }
      _status = r.status;
      _notesCtrl.text = r.notes ?? '';
    }
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  String get _dateStr =>
      '${_date.year}-${_date.month.toString().padLeft(2, '0')}-'
      '${_date.day.toString().padLeft(2, '0')}';

  String _fmtTime(TimeOfDay? t) =>
      t == null ? '—' : '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  /// Combines _date + TimeOfDay into "yyyy-MM-dd HH:mm:ss"
  String? _combineDateTime(TimeOfDay? t) {
    if (t == null) return null;
    return '$_dateStr ${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}:00';
  }

  // ── Pickers ──────────────────────────────────────────────────────────────────

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickCheckIn() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _checkInTime ?? const TimeOfDay(hour: 8, minute: 0),
    );
    if (picked != null) setState(() => _checkInTime = picked);
  }

  Future<void> _pickCheckOut() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _checkOutTime ?? const TimeOfDay(hour: 17, minute: 0),
    );
    if (picked != null) setState(() => _checkOutTime = picked);
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_checkInTime == null) {
      _showError('Waktu check-in harus diisi.');
      return;
    }
    if (!_isEdit && _selectedEmployeeId == null) {
      _showError('Pilih karyawan terlebih dahulu.');
      return;
    }

    setState(() => _isSubmitting = true);

    final messenger = ScaffoldMessenger.of(context);
    final notifier = ref.read(adminAttendanceCorrectionProvider.notifier);

    String? error;
    if (_isEdit) {
      error = await notifier.update(
        id: widget.record!.id,
        checkIn: _combineDateTime(_checkInTime),
        checkOut: _combineDateTime(_checkOutTime),
        status: _status,
        notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      );
    } else {
      error = await notifier.create(
        employeeId: _selectedEmployeeId!,
        date: _dateStr,
        checkIn: _combineDateTime(_checkInTime)!,
        checkOut: _combineDateTime(_checkOutTime),
        status: _status,
        notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      );
    }

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (error != null) {
      messenger.showSnackBar(SnackBar(
        content: Text(error),
        backgroundColor: Colors.red,
      ));
    } else {
      messenger.showSnackBar(SnackBar(
        content: Text(_isEdit ? 'Record diperbarui.' : 'Record ditambahkan.'),
        backgroundColor: Colors.teal,
      ));
      Navigator.of(context).pop(true);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red),
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Attendance' : 'Add Attendance'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ── Employee selector (create only) ─────────────────────────────
            if (!_isEdit) ...[
              const Text('Employee',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 6),
              _EmployeePicker(
                selectedId: _selectedEmployeeId,
                selectedName: _selectedEmployeeName,
                onSelected: (id, name) => setState(() {
                  _selectedEmployeeId = id;
                  _selectedEmployeeName = name;
                }),
              ),
              const SizedBox(height: 16),
            ] else ...[
              // Show employee name in edit mode (read-only)
              ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.person, color: Colors.teal),
                title: Text(
                  widget.record!.employeeName ?? 'Unknown',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: widget.record!.employeeNumber != null
                    ? Text(widget.record!.employeeNumber!)
                    : null,
              ),
              const SizedBox(height: 8),
            ],

            // ── Date ─────────────────────────────────────────────────────────
            const Text('Date',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            InkWell(
              onTap: _isEdit ? null : _pickDate,
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade400),
                  borderRadius: BorderRadius.circular(8),
                  color: _isEdit ? Colors.grey.shade100 : null,
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today,
                        size: 18, color: Colors.teal),
                    const SizedBox(width: 8),
                    Text(_dateStr,
                        style: const TextStyle(fontSize: 15)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // ── Times ────────────────────────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Check-in *',
                          style: TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 13)),
                      const SizedBox(height: 6),
                      InkWell(
                        onTap: _pickCheckIn,
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 14),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade400),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.login,
                                  size: 18, color: Colors.teal),
                              const SizedBox(width: 8),
                              Text(_fmtTime(_checkInTime),
                                  style: const TextStyle(fontSize: 15)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Check-out',
                          style: TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 13)),
                      const SizedBox(height: 6),
                      InkWell(
                        onTap: _pickCheckOut,
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 14),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade400),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.logout,
                                  size: 18, color: Colors.grey),
                              const SizedBox(width: 8),
                              Text(_fmtTime(_checkOutTime),
                                  style: const TextStyle(fontSize: 15)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Status ───────────────────────────────────────────────────────
            const Text('Status',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: InputDecoration(
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 14),
              ),
              items: const [
                DropdownMenuItem(value: 'present', child: Text('Present')),
                DropdownMenuItem(value: 'late', child: Text('Late')),
                DropdownMenuItem(value: 'absent', child: Text('Absent')),
                DropdownMenuItem(value: 'on_leave', child: Text('On Leave')),
              ],
              onChanged: (v) => setState(() => _status = v ?? _status),
            ),
            const SizedBox(height: 16),

            // ── Notes ────────────────────────────────────────────────────────
            const Text('Notes (optional)',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            TextFormField(
              controller: _notesCtrl,
              minLines: 2,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Catatan tambahan...',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 12),
              ),
            ),
            const SizedBox(height: 28),

            // ── Submit ───────────────────────────────────────────────────────
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : Text(_isEdit ? 'Update' : 'Simpan',
                        style: const TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Employee picker widget ────────────────────────────────────────────────────

class _EmployeePicker extends ConsumerWidget {
  final int? selectedId;
  final String? selectedName;
  final void Function(int id, String name) onSelected;

  const _EmployeePicker({
    required this.selectedId,
    required this.selectedName,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncEmployees = ref.watch(
      _employeeDropdownProvider,
    );

    return asyncEmployees.when(
      loading: () => const LinearProgressIndicator(),
      error: (e, _) => Text('Gagal memuat karyawan: $e',
          style: const TextStyle(color: Colors.red)),
      data: (employees) => DropdownButtonFormField<int>(
        value: selectedId,
        isExpanded: true,
        decoration: InputDecoration(
          hintText: 'Pilih karyawan...',
          border:
              OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        ),
        items: employees
            .map((e) => DropdownMenuItem(
                  value: e.id,
                  child: Text(e.name, overflow: TextOverflow.ellipsis),
                ))
            .toList(),
        onChanged: (id) {
          if (id == null) return;
          final emp = employees.firstWhere((e) => e.id == id);
          onSelected(id, emp.name);
        },
        validator: (v) => v == null ? 'Wajib pilih karyawan' : null,
      ),
    );
  }
}

// Simple record for dropdown
class _EmpOption {
  final int id;
  final String name;
  const _EmpOption(this.id, this.name);
}

final _employeeDropdownProvider = FutureProvider<List<_EmpOption>>((ref) async {
  final repo = ref.watch(employeeRepositoryProvider);
  final result = await repo.getEmployees(perPage: 200);
  return result.items
      .map((e) => _EmpOption(e.id, e.userName.isNotEmpty ? e.userName : e.employeeNumber))
      .toList();
});
