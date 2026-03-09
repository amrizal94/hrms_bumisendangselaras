import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/router/app_routes.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/employee_model.dart';
import '../providers/employee_provider.dart';

class EmployeeListScreen extends ConsumerStatefulWidget {
  const EmployeeListScreen({super.key});

  @override
  ConsumerState<EmployeeListScreen> createState() => _EmployeeListScreenState();
}

class _EmployeeListScreenState extends ConsumerState<EmployeeListScreen> {
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 200) {
      ref.read(employeeListProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state     = ref.watch(employeeListProvider);
    final authState = ref.watch(authNotifierProvider);
    final user      = authState is AuthAuthenticated ? authState.user : null;
    final canWrite  = user != null && [
      AppConstants.roleAdmin,
      AppConstants.roleHR,
      AppConstants.roleDirector,
    ].contains(user.role);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Karyawan'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(employeeListProvider.notifier).load(),
          ),
        ],
      ),
      floatingActionButton: canWrite
          ? FloatingActionButton(
              backgroundColor: Colors.teal,
              foregroundColor: Colors.white,
              onPressed: () => _navigateToForm(),
              child: const Icon(Icons.person_add_outlined),
            )
          : null,
      body: Column(
        children: [
          // ── Search bar ────────────────────────────────────────────────
          Container(
            color: Colors.teal.shade50,
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: canWrite
                  ? 'Cari nama, email, atau nomor karyawan...'
                  : 'Cari nama atau nomor karyawan...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchCtrl.clear();
                          ref.read(employeeListProvider.notifier).setSearch('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
                isDense: true,
              ),
              onChanged: (v) =>
                  ref.read(employeeListProvider.notifier).setSearch(v),
            ),
          ),

          // ── Stats bar ─────────────────────────────────────────────────
          if (!state.isLoading && state.items.isNotEmpty)
            Container(
              color: Colors.teal.shade50,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Row(
                children: [
                  _StatChip(
                    label: 'Total',
                    count: state.items.length,
                    color: Colors.teal,
                  ),
                  const SizedBox(width: 8),
                  _StatChip(
                    label: 'Aktif',
                    count: state.items.where((e) => e.isActive).length,
                    color: Colors.green,
                  ),
                  const SizedBox(width: 8),
                  _StatChip(
                    label: 'Nonaktif',
                    count: state.items.where((e) => !e.isActive).length,
                    color: Colors.red,
                  ),
                ],
              ),
            ),

          // ── Error ─────────────────────────────────────────────────────
          if (state.error != null)
            Container(
              width: double.infinity,
              color: Colors.red.shade50,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                state.error!,
                style: TextStyle(color: Colors.red.shade700, fontSize: 13),
              ),
            ),

          // ── List ──────────────────────────────────────────────────────
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.items.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.people_outline, size: 64, color: Colors.grey),
                            SizedBox(height: 12),
                            Text('Tidak ada karyawan',
                                style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () =>
                            ref.read(employeeListProvider.notifier).load(),
                        child: ListView.builder(
                          controller: _scrollCtrl,
                          padding: const EdgeInsets.all(12),
                          itemCount: state.items.length +
                              (state.isLoadingMore ? 1 : 0),
                          itemBuilder: (ctx, i) {
                            if (i == state.items.length) {
                              return const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(16),
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }
                            final emp = state.items[i];
                            return _EmployeeTile(
                              employee: emp,
                              canWrite: canWrite,
                              isToggling: state.toggling.contains(emp.id),
                              onToggle: () => _confirmToggle(context, emp),
                              onEdit: () => _navigateToForm(employeeId: emp.id),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Future<void> _navigateToForm({int? employeeId}) async {
    final result = await context.push<bool>(
      AppRoutes.employeeForm,
      extra: employeeId,
    );
    if (result == true && mounted) {
      ref.read(employeeListProvider.notifier).load();
    }
  }

  Future<void> _confirmToggle(BuildContext context, EmployeeModel emp) async {
    final action = emp.isActive ? 'nonaktifkan' : 'aktifkan';
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('${emp.isActive ? 'Nonaktifkan' : 'Aktifkan'} Akun'),
        content: Text(
          'Yakin ingin $action akun ${emp.userName}?\n'
          '${emp.isActive ? 'Karyawan tidak bisa login setelah dinonaktifkan.' : 'Karyawan bisa login kembali setelah diaktifkan.'}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          TextButton(
            style: TextButton.styleFrom(
              foregroundColor: emp.isActive ? Colors.red : Colors.green,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: Text(emp.isActive ? 'Nonaktifkan' : 'Aktifkan'),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    final err =
        await ref.read(employeeListProvider.notifier).toggleActive(emp.id);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(err ??
          'Akun ${emp.userName} berhasil ${emp.isActive ? 'dinonaktifkan' : 'diaktifkan'}'),
      backgroundColor: err != null ? Colors.red : Colors.green,
    ));
  }
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

class _StatChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _StatChip({required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        '$label: $count',
        style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}

// ── Employee tile ─────────────────────────────────────────────────────────────

class _EmployeeTile extends StatelessWidget {
  final EmployeeModel employee;
  final bool canWrite;
  final bool isToggling;
  final VoidCallback onToggle;
  final VoidCallback onEdit;

  const _EmployeeTile({
    required this.employee,
    required this.canWrite,
    required this.isToggling,
    required this.onToggle,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final initial = employee.userName.isNotEmpty
        ? employee.userName[0].toUpperCase()
        : '?';
    final activeColor = employee.isActive ? Colors.green : Colors.red;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor:
              (employee.isActive ? Colors.teal : Colors.grey).withValues(alpha: 0.15),
          child: Text(
            initial,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: employee.isActive ? Colors.teal.shade700 : Colors.grey,
            ),
          ),
        ),
        title: Text(
          employee.userName,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: employee.isActive ? null : Colors.grey,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${employee.employeeNumber}${employee.position != null ? ' · ${employee.position}' : ''}',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            if (employee.departmentName != null)
              Text(
                employee.departmentName!,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
              ),
          ],
        ),
        isThreeLine: employee.departmentName != null,
        trailing: isToggling
            ? const SizedBox(
                width: 24, height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Edit button — admin/hr/director only
                  if (canWrite)
                    IconButton(
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      onPressed: onEdit,
                      visualDensity: VisualDensity.compact,
                      padding: EdgeInsets.zero,
                      tooltip: 'Edit',
                    ),
                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: activeColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      employee.isActive ? 'Aktif' : 'Nonaktif',
                      style: TextStyle(
                        fontSize: 10,
                        color: activeColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  // Toggle switch — admin/hr/director only
                  if (canWrite) ...[
                    const SizedBox(width: 4),
                    Switch(
                      value: employee.isActive,
                      onChanged: (_) => onToggle(),
                      activeColor: Colors.green,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ],
                ],
              ),
      ),
    );
  }
}
