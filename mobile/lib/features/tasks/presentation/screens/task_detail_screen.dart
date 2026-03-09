import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/services/location_service.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../data/models/checklist_item_model.dart';
import '../../data/models/label_model.dart';
import '../../data/models/task_model.dart';
import '../../data/repositories/task_repository.dart';
import '../providers/task_provider.dart';

class TaskDetailScreen extends ConsumerStatefulWidget {
  final int taskId;
  const TaskDetailScreen({super.key, required this.taskId});

  @override
  ConsumerState<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends ConsumerState<TaskDetailScreen> {
  List<ChecklistItemModel>? _localItems;
  bool _updatingStatus = false;

  @override
  Widget build(BuildContext context) {
    final taskAsync = ref.watch(taskDetailProvider(widget.taskId));

    return taskAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.blue.shade700,
          foregroundColor: Colors.white,
          title: const Text('Task'),
        ),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.blue.shade700,
          foregroundColor: Colors.white,
          title: const Text('Task'),
        ),
        body: Center(child: Text('Error: $e')),
      ),
      data: (task) {
        // Initialize local checklist items on first load
        _localItems ??= List.from(task.checklistItems);

        final items       = _localItems!;
        final doneCount   = items.where((i) => i.isDone).length;
        final totalCount  = items.length;
        final progressPct = totalCount > 0 ? doneCount / totalCount : 0.0;

        return Scaffold(
          backgroundColor: Colors.grey.shade50,
          appBar: AppBar(
            backgroundColor: Colors.blue.shade700,
            foregroundColor: Colors.white,
            title: Text(
              task.title,
              overflow: TextOverflow.ellipsis,
            ),
            actions: [
              _StatusDropdown(
                status: task.status,
                isLoading: _updatingStatus,
                onChanged: (newStatus) => _updateStatus(context, task, newStatus),
              ),
            ],
          ),
          bottomNavigationBar: task.selfReported
              ? Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  color: const Color(0xFFFEF3C7),
                  child: Row(
                    children: [
                      const Icon(Icons.camera_alt_outlined,
                          size: 14, color: Color(0xFFD97706)),
                      const SizedBox(width: 6),
                      Text(
                        'Tugas dilaporkan sendiri oleh staff',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.orange.shade800,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                )
              : null,
          body: RefreshIndicator(
            onRefresh: () async {
              _localItems = null;
              ref.invalidate(taskDetailProvider(widget.taskId));
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(
                16,
                16,
                16,
                16 + MediaQuery.of(context).padding.bottom + 24,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Meta card
                  Card(
                    elevation: 1,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          if (task.projectName != null)
                            _MetaRow(
                              icon: Icons.folder_outlined,
                              label: 'Project',
                              value: task.projectName!,
                            ),
                          _MetaRow(
                            icon: Icons.flag_outlined,
                            label: 'Priority',
                            value: '',
                            child: _PriorityChip(priority: task.priority),
                          ),
                          if (task.deadline != null)
                            _MetaRow(
                              icon: Icons.calendar_today_outlined,
                              label: 'Deadline',
                              value: _formatDate(task.deadline!),
                              valueColor: _isOverdue(task)
                                  ? Colors.red.shade600
                                  : null,
                            ),
                          if (task.assigneeName != null)
                            _MetaRow(
                              icon: Icons.person_outline,
                              label: 'Assignee',
                              value: task.assigneeName!,
                            ),
                          if (task.createdAt != null)
                            _MetaRow(
                              icon: Icons.schedule_outlined,
                              label: 'Dilaporkan',
                              value: _formatDateTime(task.createdAt!),
                            ),
                          if (task.completedAt != null)
                            _MetaRow(
                              icon: Icons.check_circle_outline,
                              label: 'Diselesaikan',
                              value: _formatDateTime(task.completedAt!),
                              valueColor: Colors.green.shade700,
                            ),
                        ],
                      ),
                    ),
                  ),

                  // Description
                  if (task.description != null && task.description!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const _SectionHeader(title: 'Description'),
                    const SizedBox(height: 8),
                    Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          task.description!,
                          style: const TextStyle(fontSize: 14, height: 1.5),
                        ),
                      ),
                    ),
                  ],

                  // Notes (completion notes)
                  if (task.notes != null && task.notes!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const _SectionHeader(title: 'Catatan'),
                    const SizedBox(height: 8),
                    Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          task.notes!,
                          style: const TextStyle(fontSize: 14, height: 1.5),
                        ),
                      ),
                    ),
                  ],

                  // Photo proof
                  if (task.photoUrl != null) ...[
                    const SizedBox(height: 16),
                    const _SectionHeader(title: 'Foto Bukti'),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        task.photoUrl!,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        errorBuilder: (_, __, ___) => Container(
                          height: 120,
                          color: Colors.grey.shade200,
                          child: const Center(
                            child: Icon(Icons.broken_image_outlined,
                                color: Colors.grey),
                          ),
                        ),
                      ),
                    ),
                  ],

                  // GPS + Face Audit
                  if (task.createdGps != null || task.completedGps != null) ...[
                    const SizedBox(height: 16),
                    const _SectionHeader(title: 'Audit Lokasi'),
                    const SizedBox(height: 8),
                    _GpsAuditCard(
                      createdGps:   task.createdGps,
                      completedGps: task.completedGps,
                    ),
                  ],

                  // Labels
                  if (task.labels.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const _SectionHeader(title: 'Labels'),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: task.labels.map((l) => _LabelChip(label: l)).toList(),
                    ),
                  ],

                  // Checklist
                  if (totalCount > 0) ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const _SectionHeader(title: 'Checklist'),
                        const SizedBox(width: 8),
                        Text(
                          '$doneCount/$totalCount',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Progress bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progressPct,
                        minHeight: 6,
                        backgroundColor: Colors.grey.shade200,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Colors.green.shade600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Items
                    Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      child: ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (_, i) => _ChecklistTile(
                          item: items[i],
                          onToggle: () => _toggleItem(task, items[i]),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Future<void> _toggleItem(TaskModel task, ChecklistItemModel item) async {
    // Optimistic update
    setState(() {
      _localItems = _localItems!.map((i) {
        return i.id == item.id ? i.copyWith(isDone: !i.isDone) : i;
      }).toList();
    });

    try {
      await ref.read(taskRepositoryProvider).toggleChecklistItem(task.id, item.id);
      ref.invalidate(myTasksProvider);
    } catch (e) {
      // Revert on error
      if (!mounted) return;
      setState(() {
        _localItems = _localItems!.map((i) {
          return i.id == item.id ? i.copyWith(isDone: item.isDone) : i;
        }).toList();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('ApiException: ', ''))),
      );
    }
  }

  Future<void> _updateStatus(BuildContext context, TaskModel task, String newStatus) async {
    if (_updatingStatus) return;
    final messenger = ScaffoldMessenger.of(context);

    // Staff marking task as done → require photo proof
    final authState = ref.read(authNotifierProvider);
    final isStaff   = authState is AuthAuthenticated && authState.user.isStaff;
    if (newStatus == 'done' && isStaff) {
      await _completeWithPhoto(context, task, messenger);
      return;
    }

    setState(() => _updatingStatus = true);
    final err = await ref.read(myTasksProvider.notifier).updateStatus(task.id, newStatus);
    if (!mounted) return;
    setState(() => _updatingStatus = false);
    if (err != null) {
      messenger.showSnackBar(SnackBar(content: Text(err)));
    } else {
      ref.invalidate(taskDetailProvider(widget.taskId));
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Status updated'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  Future<void> _completeWithPhoto(
      BuildContext context, TaskModel task, ScaffoldMessengerState messenger) async {
    // Step 1: Face verification
    final faceFile = await context.push<XFile?>(AppRoutes.taskFaceVerify);
    if (faceFile == null || !mounted) return;

    // Step 2: Task evidence photo
    final xFile = await context.push<XFile?>(AppRoutes.capturePhoto);
    if (xFile == null || !mounted) return;

    // Step 3: Optional notes dialog
    final notes = await _showNotesDialog(context);
    if (!mounted) return;

    // Step 4: GPS (non-blocking)
    final location = await LocationService.getCurrentLocation();

    final bytes      = await xFile.readAsBytes();
    final filename   = xFile.name.isNotEmpty ? xFile.name : 'task_photo.jpg';
    final faceBytes  = await faceFile.readAsBytes();
    final faceName   = faceFile.name.isNotEmpty ? faceFile.name : 'face_verify.jpg';

    setState(() => _updatingStatus = true);
    final err = await ref.read(myTasksProvider.notifier).completeWithPhoto(
      taskId:       task.id,
      photoBytes:   bytes.toList(),
      filename:     filename,
      faceBytes:    faceBytes.toList(),
      faceFilename: faceName,
      notes:        notes,
      location:     location,
    );
    if (!mounted) return;
    setState(() => _updatingStatus = false);

    if (err != null) {
      messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
    } else {
      _localItems = null;
      ref.invalidate(taskDetailProvider(widget.taskId));
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Tugas selesai!'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<String?> _showNotesDialog(BuildContext context) async {
    final ctrl = TextEditingController();
    final result = await showDialog<String?>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Catatan (opsional)'),
        content: TextField(
          controller: ctrl,
          maxLines: 3,
          maxLength: 500,
          decoration: const InputDecoration(
            hintText: 'Tambahkan catatan penyelesaian...',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, null),
            child: const Text('Lewati'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, ctrl.text.trim()),
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
    ctrl.dispose();
    return result?.isEmpty == true ? null : result;
  }

  bool _isOverdue(TaskModel task) {
    if (task.deadline == null) return false;
    if (task.status == 'done' || task.status == 'cancelled') return false;
    return DateTime.tryParse(task.deadline!)?.isBefore(DateTime.now()) ?? false;
  }

  String _formatDate(String date) {
    try {
      final dt = DateTime.parse(date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return date;
    }
  }

  String _formatDateTime(DateTime dt) {
    final local = dt.toLocal();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final hh = local.hour.toString().padLeft(2, '0');
    final mm = local.minute.toString().padLeft(2, '0');
    return '${local.day} ${months[local.month - 1]} ${local.year}, $hh:$mm';
  }
}

// ── Status dropdown in AppBar ─────────────────────────────────────────────────
class _StatusDropdown extends StatelessWidget {
  final String status;
  final bool isLoading;
  final void Function(String) onChanged;

  const _StatusDropdown({
    required this.status,
    required this.isLoading,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: Center(
          child: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white,
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: DropdownButton<String>(
        value: status,
        dropdownColor: Colors.blue.shade700,
        style: const TextStyle(color: Colors.white, fontSize: 13),
        icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
        underline: const SizedBox.shrink(),
        items: const [
          DropdownMenuItem(value: 'todo',        child: Text('To Do')),
          DropdownMenuItem(value: 'in_progress', child: Text('In Progress')),
          DropdownMenuItem(value: 'done',        child: Text('Done')),
          DropdownMenuItem(value: 'cancelled',   child: Text('Cancelled')),
        ],
        onChanged: (v) { if (v != null) onChanged(v); },
      ),
    );
  }
}

// ── Shared small widgets ──────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title.toUpperCase(),
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.8,
        color: Colors.grey.shade600,
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;
  final Widget? child;

  const _MetaRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade500),
          const SizedBox(width: 8),
          Text(label,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          const Spacer(),
          child ??
              Text(
                value,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: valueColor,
                ),
              ),
        ],
      ),
    );
  }
}

class _PriorityChip extends StatelessWidget {
  final String priority;
  const _PriorityChip({required this.priority});

  Color get _color => switch (priority) {
        'low'    => const Color(0xFF94A3B8),
        'medium' => Colors.blue,
        'high'   => Colors.orange,
        'urgent' => Colors.red,
        _        => Colors.grey,
      };

  String get _label => switch (priority) {
        'low'    => 'Low',
        'medium' => 'Medium',
        'high'   => 'High',
        'urgent' => 'Urgent',
        _        => priority,
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _label,
        style: TextStyle(
          fontSize: 11,
          color: _color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _LabelChip extends StatelessWidget {
  final LabelModel label;
  const _LabelChip({required this.label});

  @override
  Widget build(BuildContext context) {
    Color color;
    try {
      final hex = label.color.replaceFirst('#', '');
      color = Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      color = Colors.grey;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label.name,
        style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _ChecklistTile extends StatelessWidget {
  final ChecklistItemModel item;
  final VoidCallback onToggle;
  const _ChecklistTile({required this.item, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: GestureDetector(
        onTap: onToggle,
        child: Icon(
          item.isDone ? Icons.check_box : Icons.check_box_outline_blank,
          color: item.isDone ? Colors.green.shade600 : Colors.grey.shade400,
          size: 22,
        ),
      ),
      title: Text(
        item.title,
        style: TextStyle(
          fontSize: 14,
          decoration: item.isDone ? TextDecoration.lineThrough : null,
          color: item.isDone ? Colors.grey.shade500 : null,
        ),
      ),
      onTap: onToggle,
    );
  }
}

class _GpsAuditCard extends StatelessWidget {
  final Map<String, dynamic>? createdGps;
  final Map<String, dynamic>? completedGps;
  const _GpsAuditCard({this.createdGps, this.completedGps});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (createdGps != null) _buildEntry('Dibuat', createdGps!, showMock: false),
            if (createdGps != null && completedGps != null)
              const Divider(height: 16),
            if (completedGps != null) _buildEntry('Selesai', completedGps!, showMock: true),
          ],
        ),
      ),
    );
  }

  Widget _buildEntry(String label, Map<String, dynamic> gps, {required bool showMock}) {
    final lat    = (gps['lat'] as num?)?.toDouble();
    final lng    = (gps['lng'] as num?)?.toDouble();
    final conf   = (gps['face_confidence'] as num?)?.toDouble();
    final isMock = showMock ? (gps['is_mock'] as bool? ?? false) : false;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.location_on_outlined, size: 14, color: Colors.grey.shade500),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (isMock) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.red.shade300),
                ),
                child: Text(
                  'GPS Palsu!',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.red.shade700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 4),
        if (lat != null && lng != null)
          Text(
            '${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}',
            style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
          ),
        if (conf != null) ...[
          const SizedBox(height: 2),
          Row(
            children: [
              Icon(Icons.face_outlined, size: 12, color: Colors.green.shade600),
              const SizedBox(width: 4),
              Text(
                'Wajah ${conf.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.green.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

