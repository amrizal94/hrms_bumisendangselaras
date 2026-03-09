import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../data/repositories/employee_repository.dart';
import '../providers/employee_provider.dart';

class EmployeeFormScreen extends ConsumerStatefulWidget {
  final int? employeeId;

  const EmployeeFormScreen({super.key, this.employeeId});

  @override
  ConsumerState<EmployeeFormScreen> createState() => _EmployeeFormScreenState();
}

class _EmployeeFormScreenState extends ConsumerState<EmployeeFormScreen> {
  final _formKey = GlobalKey<FormState>();

  // Account
  final _nameCtrl     = TextEditingController();
  final _emailCtrl    = TextEditingController();
  final _phoneCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();

  // Employment
  final _empNumCtrl   = TextEditingController();
  final _positionCtrl = TextEditingController();

  // Salary
  final _salaryCtrl   = TextEditingController();

  // Dropdowns & date
  int?      _departmentId;
  int?      _shiftId;
  String?   _employmentType;
  String?   _status;
  String    _role = 'staff';
  DateTime? _joinDate;

  bool _obscurePassword = true;
  bool _isLoading       = false;
  bool _isSubmitting    = false;

  bool get _isEdit => widget.employeeId != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) _loadEmployee();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _empNumCtrl.dispose();
    _positionCtrl.dispose();
    _salaryCtrl.dispose();
    super.dispose();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  String _fmtDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  String _isoDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  // ── Load edit data ────────────────────────────────────────────────────────

  Future<void> _loadEmployee() async {
    setState(() => _isLoading = true);
    try {
      final data = await ref
          .read(employeeRepositoryProvider)
          .getEmployee(widget.employeeId!);
      final user = data['user'] as Map<String, dynamic>?;

      setState(() {
        _nameCtrl.text     = user?['name']  as String? ?? '';
        _emailCtrl.text    = user?['email'] as String? ?? '';
        _phoneCtrl.text    = user?['phone'] as String? ?? '';
        _empNumCtrl.text   = data['employee_number'] as String? ?? '';
        _positionCtrl.text = data['position']        as String? ?? '';

        final salary = data['basic_salary'];
        if (salary != null) {
          _salaryCtrl.text =
              double.tryParse(salary.toString())?.toStringAsFixed(0) ?? '';
        }

        _departmentId   = data['department_id'] as int?;
        _shiftId        = data['shift_id']      as int?;
        _employmentType = data['employment_type'] as String?;
        _status         = data['status']          as String?;
        _role           = (data['user'] as Map<String, dynamic>?)?['role'] as String? ?? 'staff';

        final jd = data['join_date'] as String?;
        if (jd != null && jd.isNotEmpty) {
          _joinDate = DateTime.tryParse(jd);
        }

        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(
            'Gagal memuat data: ${e.toString().replaceFirst('ApiException: ', '')}'),
        backgroundColor: Colors.red,
      ));
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_joinDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Pilih tanggal bergabung'),
        backgroundColor: Colors.orange,
      ));
      return;
    }

    // Capture messenger before first await
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isSubmitting = true);

    final payload = <String, dynamic>{
      'name':            _nameCtrl.text.trim(),
      'email':           _emailCtrl.text.trim(),
      if (_phoneCtrl.text.trim().isNotEmpty) 'phone': _phoneCtrl.text.trim(),
      'employee_number': _empNumCtrl.text.trim(),
      if (_positionCtrl.text.trim().isNotEmpty)
        'position': _positionCtrl.text.trim(),
      'employment_type': _employmentType,
      'status':          _status,
      'join_date':       _isoDate(_joinDate!),
      'basic_salary':
          double.tryParse(_salaryCtrl.text.replaceAll(',', '')) ?? 0,
      if (_departmentId != null) 'department_id': _departmentId,
      if (_shiftId != null)      'shift_id':      _shiftId,
      if (!_isEdit)              'password':      _passwordCtrl.text,
      'role': _role,
    };

    final String? error;
    if (_isEdit) {
      error = await ref
          .read(employeeListProvider.notifier)
          .updateEmployee(widget.employeeId!, payload);
    } else {
      error = await ref
          .read(employeeListProvider.notifier)
          .createEmployee(payload);
    }

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (error != null) {
      messenger.showSnackBar(SnackBar(
        content: Text(error),
        backgroundColor: Colors.red,
      ));
    } else {
      context.pop(true);
    }
  }

  // ── Date picker ───────────────────────────────────────────────────────────

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _joinDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _joinDate = picked);
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final departments = ref.watch(departmentsForFormProvider);
    final shifts      = ref.watch(shiftsForFormProvider);

    final authState   = ref.read(authNotifierProvider);
    final isDirector  = authState is AuthAuthenticated && authState.user.isDirector;
    final availableRoles = isDirector
        ? ['staff', 'hr', 'manager', 'admin', 'director']
        : ['staff', 'hr', 'manager'];
    const roleLabels  = {
      'staff':    'Staff',
      'hr':       'HR',
      'manager':  'Manager',
      'admin':    'Admin',
      'director': 'Director',
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Karyawan' : 'Tambah Karyawan'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Akun ────────────────────────────────────────────
                    const _SectionHeader(title: 'Akun'),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _nameCtrl,
                      label: 'Nama Lengkap *',
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Nama wajib diisi' : null,
                    ),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _emailCtrl,
                      label: 'Email *',
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Email wajib diisi';
                        if (!v.contains('@')) return 'Format email tidak valid';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _phoneCtrl,
                      label: 'Nomor HP',
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 12),
                    _buildDropdown<String>(
                      label: 'Role *',
                      value: _role,
                      items: availableRoles
                          .map((r) => DropdownMenuItem(
                                value: r,
                                child: Text(roleLabels[r] ?? r),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() => _role = v ?? 'staff'),
                    ),
                    if (!_isEdit) ...[
                      const SizedBox(height: 12),
                      _buildPasswordField(),
                    ],

                    // ── Kepegawaian ──────────────────────────────────────
                    const SizedBox(height: 24),
                    const _SectionHeader(title: 'Kepegawaian'),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _empNumCtrl,
                      label: 'Nomor Karyawan *',
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Nomor karyawan wajib diisi'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _positionCtrl,
                      label: 'Jabatan',
                    ),
                    const SizedBox(height: 12),

                    // Department dropdown
                    departments.when(
                      loading: () => _buildDisabledDropdown(
                          label: 'Departemen', hint: 'Memuat...'),
                      error: (_, __) => _buildDisabledDropdown(
                          label: 'Departemen', hint: 'Gagal memuat'),
                      data: (depts) {
                        final validId = (_departmentId == null ||
                                depts.any((d) => d.id == _departmentId))
                            ? _departmentId
                            : null;
                        return _buildDropdown<int?>(
                          label: 'Departemen',
                          value: validId,
                          items: [
                            const DropdownMenuItem(
                                value: null, child: Text('— Tanpa Departemen —')),
                            ...depts.map((d) =>
                                DropdownMenuItem(value: d.id, child: Text(d.name))),
                          ],
                          onChanged: (v) => setState(() => _departmentId = v),
                        );
                      },
                    ),
                    const SizedBox(height: 12),

                    // Shift dropdown
                    shifts.when(
                      loading: () =>
                          _buildDisabledDropdown(label: 'Shift', hint: 'Memuat...'),
                      error: (_, __) =>
                          _buildDisabledDropdown(label: 'Shift', hint: 'Gagal memuat'),
                      data: (shiftList) {
                        final validId = (_shiftId == null ||
                                shiftList.any((s) => s.id == _shiftId))
                            ? _shiftId
                            : null;
                        return _buildDropdown<int?>(
                          label: 'Shift',
                          value: validId,
                          items: [
                            const DropdownMenuItem(
                                value: null, child: Text('— Tanpa Shift —')),
                            ...shiftList.map((s) => DropdownMenuItem(
                                  value: s.id,
                                  child: Text(
                                      '${s.name} (${s.checkInTime} - ${s.checkOutTime})'),
                                )),
                          ],
                          onChanged: (v) => setState(() => _shiftId = v),
                        );
                      },
                    ),
                    const SizedBox(height: 12),

                    // Employment type
                    _buildDropdown<String?>(
                      label: 'Tipe Karyawan *',
                      value: _employmentType,
                      validator: (v) =>
                          v == null ? 'Pilih tipe karyawan' : null,
                      items: const [
                        DropdownMenuItem(
                            value: null, child: Text('— Pilih Tipe —')),
                        DropdownMenuItem(
                            value: 'full_time', child: Text('Full Time')),
                        DropdownMenuItem(
                            value: 'part_time', child: Text('Part Time')),
                        DropdownMenuItem(
                            value: 'contract', child: Text('Kontrak')),
                        DropdownMenuItem(
                            value: 'intern', child: Text('Magang')),
                      ],
                      onChanged: (v) => setState(() => _employmentType = v),
                    ),
                    const SizedBox(height: 12),

                    // Status
                    _buildDropdown<String?>(
                      label: 'Status *',
                      value: _status,
                      validator: (v) => v == null ? 'Pilih status' : null,
                      items: const [
                        DropdownMenuItem(
                            value: null, child: Text('— Pilih Status —')),
                        DropdownMenuItem(
                            value: 'active', child: Text('Aktif')),
                        DropdownMenuItem(
                            value: 'inactive', child: Text('Nonaktif')),
                        DropdownMenuItem(
                            value: 'terminated', child: Text('Diberhentikan')),
                        DropdownMenuItem(
                            value: 'on_leave', child: Text('Cuti')),
                      ],
                      onChanged: (v) => setState(() => _status = v),
                    ),
                    const SizedBox(height: 12),

                    // Join date
                    InkWell(
                      onTap: _pickDate,
                      borderRadius: BorderRadius.circular(4),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Tanggal Bergabung *',
                          suffixIcon: Icon(Icons.calendar_today, size: 18),
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 12, vertical: 14),
                        ),
                        child: Text(
                          _joinDate != null
                              ? _fmtDate(_joinDate!)
                              : 'Pilih tanggal...',
                          style: TextStyle(
                            color: _joinDate != null ? null : Colors.grey,
                          ),
                        ),
                      ),
                    ),

                    // ── Gaji ────────────────────────────────────────────
                    const SizedBox(height: 24),
                    const _SectionHeader(title: 'Gaji'),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _salaryCtrl,
                      label: 'Gaji Pokok *',
                      keyboardType: const TextInputType.numberWithOptions(
                          decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[\d.]')),
                      ],
                      validator: (v) {
                        if (v == null || v.trim().isEmpty)
                          return 'Gaji pokok wajib diisi';
                        if (double.tryParse(v) == null)
                          return 'Format angka tidak valid';
                        return null;
                      },
                    ),

                    const SizedBox(height: 32),

                    // Submit
                    ElevatedButton(
                      onPressed: _isSubmitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.teal,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : Text(
                              _isEdit ? 'Simpan Perubahan' : 'Tambah Karyawan',
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.w600),
                            ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
    );
  }

  // ── Widget helpers ────────────────────────────────────────────────────────

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      ),
    );
  }

  Widget _buildPasswordField() {
    return TextFormField(
      controller: _passwordCtrl,
      obscureText: _obscurePassword,
      validator: (v) {
        if (v == null || v.isEmpty) return 'Password wajib diisi';
        if (v.length < 8) return 'Password minimal 8 karakter';
        return null;
      },
      decoration: InputDecoration(
        labelText: 'Password *',
        border: const OutlineInputBorder(),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        suffixIcon: IconButton(
          icon: Icon(
              _obscurePassword ? Icons.visibility_off : Icons.visibility),
          onPressed: () =>
              setState(() => _obscurePassword = !_obscurePassword),
        ),
      ),
    );
  }

  Widget _buildDropdown<T>({
    required String label,
    required T value,
    required List<DropdownMenuItem<T>> items,
    required void Function(T?) onChanged,
    String? Function(T?)? validator,
  }) {
    return DropdownButtonFormField<T>(
      value: value,
      items: items,
      onChanged: onChanged,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      ),
    );
  }

  Widget _buildDisabledDropdown(
      {required String label, required String hint}) {
    return DropdownButtonFormField<int>(
      items: const [],
      onChanged: null,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: const OutlineInputBorder(),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      ),
    );
  }
}

// ── Section header ────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Colors.teal,
          ),
        ),
        const SizedBox(width: 8),
        const Expanded(child: Divider()),
      ],
    );
  }
}
