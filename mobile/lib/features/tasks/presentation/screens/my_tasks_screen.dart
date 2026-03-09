import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../data/models/label_model.dart';
import '../../data/models/project_model.dart';
import '../../data/models/task_model.dart';
import '../providers/task_provider.dart';

// ── Priority color bar ────────────────────────────────────────────────────────
Color _priorityColorSafe(String priority) => switch (priority) {
      'low'    => const Color(0xFF94A3B8),
      'medium' => Colors.blue,
      'high'   => Colors.orange,
      'urgent' => Colors.red,
      _        => Colors.grey,
    };

// ── Screen ────────────────────────────────────────────────────────────────────
class MyTasksScreen extends ConsumerWidget {
  const MyTasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsAsync = ref.watch(myProjectsProvider);
    final tasksAsync    = ref.watch(myTasksProvider);
    final authState     = ref.watch(authNotifierProvider);
    final isStaff       = authState is AuthAuthenticated && authState.user.isStaff;

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('My Tasks'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterSheet(context, ref),
          ),
        ],
      ),
      floatingActionButton: isStaff
          ? FloatingActionButton.extended(
              onPressed: () => context.push(AppRoutes.createTask),
              icon: const Icon(Icons.add_task),
              label: const Text('Laporkan Tugas'),
              backgroundColor: Colors.blue.shade700,
              foregroundColor: Colors.white,
            )
          : null,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myTasksProvider);
          ref.invalidate(myProjectsProvider);
        },
        child: CustomScrollView(
          slivers: [
            // Project summary chips
            SliverToBoxAdapter(
              child: projectsAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
                data: (projects) => projects.isEmpty
                    ? const SizedBox.shrink()
                    : _ProjectChipsRow(projects: projects),
              ),
            ),

            // Status filter chips
            SliverToBoxAdapter(
              child: _StatusFilterRow(ref: ref),
            ),

            // Task list
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
              sliver: tasksAsync.when(
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => SliverFillRemaining(
                  child: Center(child: Text('Error: $e')),
                ),
                data: (tasks) => tasks.isEmpty
                    ? const SliverFillRemaining(
                        child: Center(
                          child: Text(
                            'No tasks assigned to you.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ),
                      )
                    : SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (_, i) => _TaskCard(
                            task: tasks[i],
                            onTap: () => context.push(
                              AppRoutes.taskDetail,
                              extra: tasks[i].id,
                            ),
                          ),
                          childCount: tasks.length,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _FilterSheet(ref: ref),
    );
  }
}

// ── Project chips row ─────────────────────────────────────────────────────────
class _ProjectChipsRow extends StatelessWidget {
  final List<ProjectModel> projects;
  const _ProjectChipsRow({required this.projects});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 72,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: projects.length,
        itemBuilder: (_, i) {
          final p = projects[i];
          return Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.grey.shade200),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  p.name,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                SizedBox(
                  width: 80,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(
                      value: p.progress / 100,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.blue.shade600),
                      minHeight: 4,
                    ),
                  ),
                ),
                Text(
                  '${p.progress}%',
                  style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

// ── Status filter chips row ───────────────────────────────────────────────────
class _StatusFilterRow extends ConsumerWidget {
  final WidgetRef ref;
  const _StatusFilterRow({required this.ref});

  @override
  Widget build(BuildContext context, WidgetRef _) {
    const statuses = [
      ('', 'All'),
      ('todo', 'To Do'),
      ('in_progress', 'In Progress'),
      ('done', 'Done'),
    ];

    // Read current filter from notifier
    final notifier = ref.read(myTasksProvider.notifier);
    return SizedBox(
      height: 44,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: statuses.length,
        itemBuilder: (_, i) {
          final (value, label) = statuses[i];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              label: Text(label, style: const TextStyle(fontSize: 12)),
              onPressed: () => notifier.setFilters(status: value.isEmpty ? null : value),
            ),
          );
        },
      ),
    );
  }
}

// ── Task card ─────────────────────────────────────────────────────────────────
class _TaskCard extends StatelessWidget {
  final TaskModel task;
  final VoidCallback onTap;
  const _TaskCard({required this.task, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isOverdue = task.deadline != null &&
        DateTime.tryParse(task.deadline!)?.isBefore(DateTime.now()) == true &&
        task.status != 'done' &&
        task.status != 'cancelled';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Priority bar
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: _priorityColorSafe(task.priority),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(10),
                    bottomLeft: Radius.circular(10),
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              task.title,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 14),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (task.selfReported) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 5, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(
                                    color: const Color(0xFFFBBF24)),
                              ),
                              child: const Text(
                                'Saya buat',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFFD97706),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (task.projectName != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          task.projectName!,
                          style: TextStyle(
                              fontSize: 11, color: Colors.grey.shade600),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        children: [
                          _PriorityChip(priority: task.priority),
                          ...task.labels.map((l) => _LabelChip(label: l)),
                          if (task.deadline != null)
                            _DeadlineChip(
                                deadline: task.deadline!, isOverdue: isOverdue),
                          if (task.checklistTotal > 0)
                            _ChecklistChip(
                              done: task.checklistDone,
                              total: task.checklistTotal,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Small chips ───────────────────────────────────────────────────────────────
class _PriorityChip extends StatelessWidget {
  final String priority;
  const _PriorityChip({required this.priority});

  @override
  Widget build(BuildContext context) {
    final color = _priorityColorSafe(priority);
    final label = switch (priority) {
      'low'    => 'Low',
      'medium' => 'Medium',
      'high'   => 'High',
      'urgent' => 'Urgent',
      _        => priority,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600),
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
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label.name,
        style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _DeadlineChip extends StatelessWidget {
  final String deadline;
  final bool isOverdue;
  const _DeadlineChip({required this.deadline, required this.isOverdue});

  @override
  Widget build(BuildContext context) {
    String formatted;
    try {
      final dt = DateTime.parse(deadline);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      formatted = '${dt.day} ${months[dt.month - 1]}';
    } catch (_) {
      formatted = deadline;
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.calendar_today_outlined,
            size: 10,
            color: isOverdue ? Colors.red.shade600 : Colors.grey.shade600),
        const SizedBox(width: 2),
        Text(
          formatted,
          style: TextStyle(
            fontSize: 10,
            color: isOverdue ? Colors.red.shade600 : Colors.grey.shade600,
            fontWeight: isOverdue ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}

class _ChecklistChip extends StatelessWidget {
  final int done;
  final int total;
  const _ChecklistChip({required this.done, required this.total});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.check_box_outlined, size: 10, color: Colors.grey.shade600),
        const SizedBox(width: 2),
        Text(
          '$done/$total',
          style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
        ),
      ],
    );
  }
}

// ── Filter bottom sheet ───────────────────────────────────────────────────────
class _FilterSheet extends ConsumerStatefulWidget {
  final WidgetRef ref;
  const _FilterSheet({required this.ref});

  @override
  ConsumerState<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<_FilterSheet> {
  String _status   = '';
  String _priority = '';

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Filter Tasks',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          const Text('Status', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              for (final (v, l) in [
                ('', 'All'),
                ('todo', 'To Do'),
                ('in_progress', 'In Progress'),
                ('done', 'Done'),
                ('cancelled', 'Cancelled'),
              ])
                FilterChip(
                  label: Text(l),
                  selected: _status == v,
                  onSelected: (_) => setState(() => _status = v),
                ),
            ],
          ),
          const SizedBox(height: 12),
          const Text('Priority', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              for (final (v, l) in [
                ('', 'All'),
                ('low', 'Low'),
                ('medium', 'Medium'),
                ('high', 'High'),
                ('urgent', 'Urgent'),
              ])
                FilterChip(
                  label: Text(l),
                  selected: _priority == v,
                  onSelected: (_) => setState(() => _priority = v),
                ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                ref.read(myTasksProvider.notifier).setFilters(
                      status: _status.isEmpty ? null : _status,
                      priority: _priority.isEmpty ? null : _priority,
                    );
                Navigator.pop(context);
              },
              child: const Text('Apply Filters'),
            ),
          ),
        ],
      ),
    );
  }
}
