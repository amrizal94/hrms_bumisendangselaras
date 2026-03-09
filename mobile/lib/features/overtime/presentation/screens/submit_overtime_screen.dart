import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/overtime_provider.dart';

class SubmitOvertimeScreen extends ConsumerStatefulWidget {
  const SubmitOvertimeScreen({super.key});

  @override
  ConsumerState<SubmitOvertimeScreen> createState() => _SubmitOvertimeScreenState();
}

class _SubmitOvertimeScreenState extends ConsumerState<SubmitOvertimeScreen> {
  final _formKey = GlobalKey<FormState>();
  DateTime? _selectedDate;
  final _hoursController = TextEditingController();
  final _reasonController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _hoursController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  String _detectOvertimeType(DateTime date) {
    // Saturday=6, Sunday=7
    if (date.weekday == DateTime.saturday || date.weekday == DateTime.sunday) {
      return 'weekend';
    }
    return 'regular';
  }

  String get _overtimeType {
    if (_selectedDate == null) return 'regular';
    return _detectOvertimeType(_selectedDate!);
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 7)),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Please select a date')));
      return;
    }

    final hours = double.tryParse(_hoursController.text.trim());
    if (hours == null || hours <= 0 || hours > 12) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enter valid hours (0–12)')));
      return;
    }

    setState(() => _isSubmitting = true);
    final err = await ref.read(myOvertimesProvider.notifier).submitOvertime(
          date: _selectedDate!.toIso8601String().substring(0, 10),
          overtimeHours: hours,
          overtimeType: _overtimeType,
          reason: _reasonController.text.trim(),
        );
    setState(() => _isSubmitting = false);

    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Overtime request submitted!')));
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final typeColor = switch (_overtimeType) {
      'weekend' => Colors.blue,
      'holiday' => Colors.purple,
      _         => Colors.teal,
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('Submit Overtime'),
        backgroundColor: Colors.amber.shade700,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Date picker
              InkWell(
                onTap: _pickDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Overtime Date',
                    border: OutlineInputBorder(),
                    suffixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    _selectedDate == null
                        ? 'Select date'
                        : _selectedDate!.toIso8601String().substring(0, 10),
                    style: TextStyle(
                      color: _selectedDate == null ? Colors.grey : null,
                    ),
                  ),
                ),
              ),

              if (_selectedDate != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: typeColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Type: ${_overtimeType.toUpperCase()}',
                        style: TextStyle(
                            color: typeColor,
                            fontWeight: FontWeight.w600,
                            fontSize: 12),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      '(auto-detected)',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 16),

              // Hours input
              TextFormField(
                controller: _hoursController,
                decoration: const InputDecoration(
                  labelText: 'Overtime Hours',
                  border: OutlineInputBorder(),
                  suffixText: 'hours',
                  hintText: 'e.g. 2',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                onChanged: (_) => setState(() {}),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Enter hours';
                  final h = double.tryParse(v.trim());
                  if (h == null || h <= 0 || h > 12) return 'Enter valid hours (0–12)';
                  return null;
                },
              ),
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
                  backgroundColor: Colors.amber.shade700,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Submit Overtime Request'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
