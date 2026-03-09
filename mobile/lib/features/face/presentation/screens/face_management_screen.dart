import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../data/models/face_enrollment_model.dart';
import '../providers/face_admin_provider.dart';

class FaceManagementScreen extends ConsumerStatefulWidget {
  const FaceManagementScreen({super.key});

  @override
  ConsumerState<FaceManagementScreen> createState() => _FaceManagementScreenState();
}

class _FaceManagementScreenState extends ConsumerState<FaceManagementScreen> {
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
      ref.read(faceManagementProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(faceManagementProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Face Data Management'),
        backgroundColor: Colors.indigo.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: 'Audit Log',
            onPressed: () => context.push(AppRoutes.faceAuditLog),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(faceManagementProvider.notifier).load(),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Search + filter bar ───────────────────────────────────────
          Container(
            color: Colors.indigo.shade50,
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
            child: Column(
              children: [
                TextField(
                  controller: _searchCtrl,
                  decoration: InputDecoration(
                    hintText: 'Cari nama atau nomor karyawan...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchCtrl.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchCtrl.clear();
                              ref.read(faceManagementProvider.notifier).setSearch('');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    isDense: true,
                  ),
                  onChanged: (v) =>
                      ref.read(faceManagementProvider.notifier).setSearch(v),
                ),
                const SizedBox(height: 8),
                // Filter chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'Semua',
                        selected: state.enrolledFilter == null,
                        onTap: () => ref
                            .read(faceManagementProvider.notifier)
                            .setEnrolledFilter(null),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Enrolled',
                        selected: state.enrolledFilter == 'true',
                        color: Colors.green,
                        onTap: () => ref
                            .read(faceManagementProvider.notifier)
                            .setEnrolledFilter('true'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Belum Enrolled',
                        selected: state.enrolledFilter == 'false',
                        color: Colors.orange,
                        onTap: () => ref
                            .read(faceManagementProvider.notifier)
                            .setEnrolledFilter('false'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Error banner ──────────────────────────────────────────────
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
                            Icon(Icons.face_retouching_natural, size: 64, color: Colors.grey),
                            SizedBox(height: 12),
                            Text('Tidak ada data', style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () =>
                            ref.read(faceManagementProvider.notifier).load(),
                        child: ListView.builder(
                          controller: _scrollCtrl,
                          padding: const EdgeInsets.all(12),
                          itemCount:
                              state.items.length + (state.isLoadingMore ? 1 : 0),
                          itemBuilder: (ctx, i) {
                            if (i == state.items.length) {
                              return const Center(
                                  child: Padding(
                                padding: EdgeInsets.all(16),
                                child: CircularProgressIndicator(),
                              ));
                            }
                            return _FaceEnrollmentTile(
                              item: state.items[i],
                              onDelete: () =>
                                  _confirmDelete(context, state.items[i]),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, FaceEnrollmentModel item) async {
    if (item.faceDataId == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hapus Data Wajah'),
        content: Text(
          'Hapus data wajah milik ${item.userName}? '
          'Karyawan harus melakukan enrollment ulang untuk absensi face recognition.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    final err = await ref
        .read(faceManagementProvider.notifier)
        .deleteFace(item.faceDataId!);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(err ?? 'Data wajah berhasil dihapus'),
      backgroundColor: err != null ? Colors.red : Colors.green,
    ));
  }
}

// ── Filter chip ───────────────────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    this.color = Colors.indigo,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? color : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? color : Colors.grey.shade300),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
            color: selected ? Colors.white : Colors.grey.shade700,
          ),
        ),
      ),
    );
  }
}

// ── Enrollment tile ───────────────────────────────────────────────────────────

class _FaceEnrollmentTile extends StatelessWidget {
  final FaceEnrollmentModel item;
  final VoidCallback onDelete;

  const _FaceEnrollmentTile({required this.item, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final initial = item.userName.isNotEmpty ? item.userName[0].toUpperCase() : '?';
    final enrollColor = item.isEnrolled ? Colors.green : Colors.orange;
    final enrollLabel = item.isEnrolled ? 'Enrolled' : 'Belum';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.indigo.shade100,
          child: Text(
            initial,
            style: TextStyle(
              color: Colors.indigo.shade700,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          item.userName,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${item.employeeNumber}${item.position != null ? ' · ${item.position}' : ''}',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            if (item.departmentName != null)
              Text(
                item.departmentName!,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
              ),
            if (item.isEnrolled && item.enrolledAt != null)
              Text(
                'Enrolled: ${_fmtDate(item.enrolledAt!)}',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
              ),
          ],
        ),
        isThreeLine: true,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Status badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: enrollColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: enrollColor.withValues(alpha: 0.4)),
              ),
              child: Text(
                enrollLabel,
                style: TextStyle(
                  fontSize: 10,
                  color: enrollColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            // Delete button — only if enrolled
            if (item.isEnrolled && item.faceDataId != null) ...[
              const SizedBox(width: 4),
              IconButton(
                icon: Icon(Icons.delete_outline, color: Colors.red.shade400, size: 22),
                tooltip: 'Hapus data wajah',
                onPressed: onDelete,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _fmtDate(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${d.day} ${m[d.month - 1]} ${d.year}';
    } catch (_) {
      return iso;
    }
  }
}
