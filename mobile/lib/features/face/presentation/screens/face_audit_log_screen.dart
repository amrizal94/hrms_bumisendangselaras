import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/audit_log_model.dart';
import '../providers/face_admin_provider.dart';

// ── Filter config ─────────────────────────────────────────────────────────────

const _filters = [
  (label: 'Semua',     value: 'face',                       color: Colors.indigo),
  (label: 'Enroll',    value: 'face.enroll',                color: Colors.blue),
  (label: 'Hapus',     value: 'face.delete',                color: Colors.red),
  (label: 'Masuk',     value: 'face.attendance.check_in',   color: Colors.green),
  (label: 'Keluar',    value: 'face.attendance.check_out',  color: Colors.teal),
  (label: 'No Match',  value: 'face.attendance.no_match',   color: Colors.orange),
];

// ── Action color helper ───────────────────────────────────────────────────────

Color _actionColor(String action) {
  if (action.startsWith('fake_gps'))                    return Colors.red.shade700;
  if (action == 'face.attendance.no_match')             return Colors.orange;
  if (action == 'face.attendance.check_in')             return Colors.green;
  if (action == 'face.attendance.check_out')            return Colors.teal;
  if (action == 'face.self_enroll')                     return Colors.purple;
  if (action == 'face.delete')                          return Colors.red;
  if (action == 'face.enroll')                          return Colors.blue;
  return Colors.grey;
}

IconData _actionIcon(String action) {
  if (action.startsWith('fake_gps'))                    return Icons.location_off;
  if (action == 'face.attendance.no_match')             return Icons.help_outline;
  if (action == 'face.attendance.check_in')             return Icons.login;
  if (action == 'face.attendance.check_out')            return Icons.logout;
  if (action == 'face.self_enroll')                     return Icons.face_retouching_natural;
  if (action == 'face.delete')                          return Icons.delete_forever;
  if (action == 'face.enroll')                          return Icons.how_to_reg;
  return Icons.history;
}

// ── Screen ────────────────────────────────────────────────────────────────────

class FaceAuditLogScreen extends ConsumerStatefulWidget {
  const FaceAuditLogScreen({super.key});

  @override
  ConsumerState<FaceAuditLogScreen> createState() => _FaceAuditLogScreenState();
}

class _FaceAuditLogScreenState extends ConsumerState<FaceAuditLogScreen> {
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 200) {
      ref.read(faceAuditLogProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(faceAuditLogProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Face Audit Log'),
        backgroundColor: Colors.indigo.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(faceAuditLogProvider.notifier).load(),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Filter chips ──────────────────────────────────────────
          Container(
            color: Colors.indigo.shade50,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _filters.map((f) {
                  final selected = state.actionFilter == f.value;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () =>
                          ref.read(faceAuditLogProvider.notifier).setFilter(f.value),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: selected ? f.color : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: selected ? f.color : Colors.grey.shade300,
                          ),
                        ),
                        child: Text(
                          f.label,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                            color: selected ? Colors.white : Colors.grey.shade700,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // ── Error banner ──────────────────────────────────────────
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

          // ── List ──────────────────────────────────────────────────
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.items.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.history_toggle_off, size: 64, color: Colors.grey),
                            SizedBox(height: 12),
                            Text('Tidak ada log', style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () =>
                            ref.read(faceAuditLogProvider.notifier).load(),
                        child: ListView.builder(
                          controller: _scrollCtrl,
                          padding: const EdgeInsets.all(12),
                          itemCount: state.items.length + (state.isLoadingMore ? 1 : 0),
                          itemBuilder: (ctx, i) {
                            if (i == state.items.length) {
                              return const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(16),
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }
                            return _AuditLogTile(log: state.items[i]);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

// ── Tile ──────────────────────────────────────────────────────────────────────

class _AuditLogTile extends StatelessWidget {
  final AuditLogModel log;
  const _AuditLogTile({required this.log});

  String _fmtTime(DateTime dt) {
    final local = dt.toLocal();
    final pad = (int n) => n.toString().padLeft(2, '0');
    return '${local.day} ${_monthAbbr(local.month)} ${local.year} '
        '${pad(local.hour)}:${pad(local.minute)}';
  }

  String _monthAbbr(int m) {
    const months = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[m];
  }

  @override
  Widget build(BuildContext context) {
    final color = _actionColor(log.action);
    final icon  = _actionIcon(log.action);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.15),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(
          log.displayName,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: color.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    log.actionLabel,
                    style: TextStyle(
                      fontSize: 10,
                      color: color,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (log.actorName != null) ...[
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      'by ${log.actorName}',
                      style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 2),
            Text(
              _fmtTime(log.createdAt),
              style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
            ),
          ],
        ),
        isThreeLine: true,
        trailing: log.metaSummary.isNotEmpty
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    log.metaSummary,
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.grey.shade600,
                      fontFamily: 'monospace',
                    ),
                    textAlign: TextAlign.right,
                  ),
                ],
              )
            : null,
      ),
    );
  }
}
