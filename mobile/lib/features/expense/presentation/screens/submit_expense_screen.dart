import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/expense_provider.dart';
import '../providers/expense_type_provider.dart';

class SubmitExpenseScreen extends ConsumerStatefulWidget {
  const SubmitExpenseScreen({super.key});

  @override
  ConsumerState<SubmitExpenseScreen> createState() => _SubmitExpenseScreenState();
}

class _SubmitExpenseScreenState extends ConsumerState<SubmitExpenseScreen> {
  final _formKey    = GlobalKey<FormState>();
  final _amountCtrl = TextEditingController();
  final _descCtrl   = TextEditingController();

  String  _date          = '';
  int?    _expenseTypeId;
  bool    _submitting    = false;

  List<int>? _fileBytes;
  String?    _fileName;

  @override
  void dispose() {
    _amountCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    final f = result.files.first;
    setState(() {
      _fileBytes = f.bytes?.toList();
      _fileName  = f.name;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_fileBytes == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please attach a receipt.')),
      );
      return;
    }

    final messenger = ScaffoldMessenger.of(context);
    setState(() => _submitting = true);

    final err = await ref.read(myExpenseProvider.notifier).submit(
          expenseDate:   _date,
          amount:        double.tryParse(_amountCtrl.text) ?? 0,
          expenseTypeId: _expenseTypeId!,
          description:   _descCtrl.text.trim(),
          fileBytes:     _fileBytes!,
          filename:      _fileName!,
        );

    if (!mounted) return;
    setState(() => _submitting = false);

    if (err != null) {
      messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
    } else {
      messenger.showSnackBar(
        const SnackBar(content: Text('Expense submitted!'), backgroundColor: Colors.green),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final typesAsync = ref.watch(expenseTypesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Submit Expense'),
        backgroundColor: Colors.indigo.shade700,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date
                TextFormField(
                  readOnly: true,
                  decoration: InputDecoration(
                    labelText: 'Expense Date',
                    suffixIcon: const Icon(Icons.calendar_today),
                    border: const OutlineInputBorder(),
                    hintText: _date.isEmpty ? 'Select date' : _date,
                  ),
                  controller: TextEditingController(text: _date),
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now(),
                    );
                    if (picked != null) {
                      setState(() {
                        _date = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
                      });
                    }
                  },
                  validator: (_) => _date.isEmpty ? 'Select a date' : null,
                ),
                const SizedBox(height: 12),

                // Amount
                TextFormField(
                  controller: _amountCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Amount (Rp)',
                    border: OutlineInputBorder(),
                    prefixText: 'Rp ',
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Enter amount';
                    if (double.tryParse(v) == null || double.parse(v) <= 0) return 'Invalid amount';
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                // Category — from API
                typesAsync.when(
                  loading: () => DropdownButtonFormField<int>(
                    items: const [],
                    onChanged: null,
                    decoration: const InputDecoration(
                      labelText: 'Category',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  error: (_, __) => DropdownButtonFormField<int>(
                    value: _expenseTypeId,
                    decoration: const InputDecoration(
                      labelText: 'Category',
                      border: OutlineInputBorder(),
                    ),
                    items: const [],
                    onChanged: null,
                    hint: const Text('Failed to load categories'),
                  ),
                  data: (types) => DropdownButtonFormField<int>(
                    value: _expenseTypeId,
                    decoration: const InputDecoration(
                      labelText: 'Category',
                      border: OutlineInputBorder(),
                    ),
                    items: types
                        .map((t) => DropdownMenuItem(value: t.id, child: Text(t.name)))
                        .toList(),
                    onChanged: (v) => setState(() => _expenseTypeId = v),
                    validator: (v) => v == null ? 'Select a category' : null,
                  ),
                ),
                const SizedBox(height: 12),

                // Description
                TextFormField(
                  controller: _descCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    border: OutlineInputBorder(),
                    alignLabelWithHint: true,
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter description' : null,
                ),
                const SizedBox(height: 16),

                // Receipt upload
                const Text('Receipt *', style: TextStyle(fontWeight: FontWeight.w500)),
                const SizedBox(height: 6),
                InkWell(
                  onTap: _pickFile,
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: _fileBytes != null ? Colors.green : Colors.grey.shade400,
                        style: BorderStyle.solid,
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          _fileBytes != null ? Icons.check_circle : Icons.upload_file,
                          size: 32,
                          color: _fileBytes != null ? Colors.green : Colors.grey,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _fileName ?? 'Tap to upload receipt\n(JPG, PNG, PDF — max 5 MB)',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: _fileBytes != null ? Colors.green.shade700 : Colors.grey.shade600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.indigo.shade700,
                      foregroundColor: Colors.white,
                    ),
                    child: _submitting
                        ? const SizedBox(
                            height: 20, width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Submit Expense', style: TextStyle(fontSize: 16)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
