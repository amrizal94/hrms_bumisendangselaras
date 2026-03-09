import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/leave_provider.dart';

class ApplyLeaveScreen extends ConsumerStatefulWidget {
  const ApplyLeaveScreen({super.key});

  @override
  ConsumerState<ApplyLeaveScreen> createState() => _ApplyLeaveScreenState();
}

class _ApplyLeaveScreenState extends ConsumerState<ApplyLeaveScreen> {
  final _formKey = GlobalKey<FormState>();
  int? _selectedLeaveTypeId;
  DateTime? _startDate;
  DateTime? _endDate;
  final _reasonController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  int get _totalDays {
    if (_startDate == null || _endDate == null) return 0;
    return _endDate!.difference(_startDate!).inDays + 1;
  }

  Future<void> _pickDate(bool isStart) async {
    final initial = isStart ? (_startDate ?? DateTime.now()) : (_endDate ?? _startDate ?? DateTime.now());
    final first = isStart ? DateTime.now() : (_startDate ?? DateTime.now());

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: first,
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
        if (_endDate != null && _endDate!.isBefore(picked)) _endDate = picked;
      } else {
        _endDate = picked;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedLeaveTypeId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a leave type')));
      return;
    }
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select dates')));
      return;
    }

    setState(() => _isSubmitting = true);
    final err = await ref.read(myLeavesProvider.notifier).applyLeave(
      leaveTypeId: _selectedLeaveTypeId!,
      startDate: _startDate!.toIso8601String().substring(0, 10),
      endDate: _endDate!.toIso8601String().substring(0, 10),
      reason: _reasonController.text.trim(),
    );
    setState(() => _isSubmitting = false);

    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Leave request submitted!')));
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final typesAsync = ref.watch(leaveTypesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Apply for Leave'),
        backgroundColor: Colors.orange.shade700,
        foregroundColor: Colors.white,
      ),
      body: typesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error loading leave types: $e')),
        data: (types) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Leave type dropdown
                DropdownButtonFormField<int>(
                  initialValue: _selectedLeaveTypeId,
                  decoration: const InputDecoration(
                    labelText: 'Leave Type',
                    border: OutlineInputBorder(),
                  ),
                  items: types.map((t) => DropdownMenuItem(
                    value: t.id,
                    child: Text(t.name),
                  )).toList(),
                  onChanged: (v) => setState(() => _selectedLeaveTypeId = v),
                  validator: (v) => v == null ? 'Select a leave type' : null,
                ),
                const SizedBox(height: 16),

                // Start date
                InkWell(
                  onTap: () => _pickDate(true),
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Start Date',
                      border: OutlineInputBorder(),
                      suffixIcon: Icon(Icons.calendar_today),
                    ),
                    child: Text(
                      _startDate == null
                          ? 'Select start date'
                          : _startDate!.toIso8601String().substring(0, 10),
                      style: TextStyle(
                        color: _startDate == null ? Colors.grey : null,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // End date
                InkWell(
                  onTap: () => _pickDate(false),
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'End Date',
                      border: OutlineInputBorder(),
                      suffixIcon: Icon(Icons.calendar_today),
                    ),
                    child: Text(
                      _endDate == null
                          ? 'Select end date'
                          : _endDate!.toIso8601String().substring(0, 10),
                      style: TextStyle(
                        color: _endDate == null ? Colors.grey : null,
                      ),
                    ),
                  ),
                ),

                if (_totalDays > 0) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Duration: $_totalDays day${_totalDays > 1 ? 's' : ''}',
                    style: const TextStyle(fontSize: 13, color: Colors.grey),
                  ),
                ],
                const SizedBox(height: 16),

                // Reason
                TextFormField(
                  controller: _reasonController,
                  decoration: const InputDecoration(
                    labelText: 'Reason',
                    border: OutlineInputBorder(),
                    alignLabelWithHint: true,
                  ),
                  maxLines: 3,
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Please provide a reason' : null,
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange.shade700,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Submit Leave Request'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
