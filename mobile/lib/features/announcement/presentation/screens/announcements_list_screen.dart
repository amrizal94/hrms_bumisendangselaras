import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../data/models/announcement_model.dart';
import '../providers/announcement_provider.dart';

// ── Category filter chips ────────────────────────────────────────────────────

const _kCategories = [
  ('all',     'Semua'),
  ('general', 'General'),
  ('hr',      'HR'),
  ('policy',  'Policy'),
  ('event',   'Event'),
];

// ── Priority styling ─────────────────────────────────────────────────────────

Color _priorityColor(String priority) => switch (priority) {
      'high'   => Colors.red,
      'medium' => Colors.amber.shade700,
      _        => Colors.green,
    };

// ── Category styling ─────────────────────────────────────────────────────────

Color _categoryColor(String category) => switch (category) {
      'hr'     => Colors.blue,
      'policy' => Colors.purple,
      'event'  => Colors.teal,
      _        => Colors.grey.shade600,
    };

String _categoryLabel(String category) => switch (category) {
      'hr'     => 'HR',
      'policy' => 'Policy',
      'event'  => 'Event',
      _        => 'General',
    };

// ── Date formatter ───────────────────────────────────────────────────────────

String _fmtDate(String? iso) {
  if (iso == null) return '';
  try {
    final d = DateTime.parse(iso).toLocal();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${d.day} ${months[d.month - 1]} ${d.year}';
  } catch (_) {
    return '';
  }
}

// ── Screen ───────────────────────────────────────────────────────────────────

class AnnouncementsListScreen extends ConsumerStatefulWidget {
  const AnnouncementsListScreen({super.key});

  @override
  ConsumerState<AnnouncementsListScreen> createState() => _AnnouncementsListScreenState();
}

class _AnnouncementsListScreenState extends ConsumerState<AnnouncementsListScreen> {
  String _selectedCategory = 'all';

  @override
  Widget build(BuildContext context) {
    final provider = _selectedCategory == 'all'
        ? announcementsProvider
        : announcementsByCategoryProvider(_selectedCategory);

    final announcementsAsync = ref.watch(provider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Announcements'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Category filter chips
          Container(
            color: Colors.purple.shade50,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _kCategories.map((cat) {
                  final isSelected = _selectedCategory == cat.$1;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(cat.$2),
                      selected: isSelected,
                      onSelected: (_) => setState(() => _selectedCategory = cat.$1),
                      selectedColor: Colors.purple.shade100,
                      checkmarkColor: Colors.purple,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.purple : Colors.grey.shade700,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        fontSize: 12,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(announcementsProvider);
                ref.invalidate(announcementsByCategoryProvider);
              },
              child: announcementsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 12),
                      Text('Error: $e', textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: () => ref.invalidate(announcementsProvider),
                        icon: const Icon(Icons.refresh),
                        label: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (announcements) => announcements.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.campaign_outlined, size: 64, color: Colors.grey),
                            SizedBox(height: 12),
                            Text('No announcements', style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: announcements.length,
                        itemBuilder: (ctx, i) => _AnnouncementCard(
                          announcement: announcements[i],
                          onTap: () => context.push(
                            AppRoutes.announcementDetail,
                            extra: announcements[i],
                          ),
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Card ─────────────────────────────────────────────────────────────────────

class _AnnouncementCard extends StatelessWidget {
  final AnnouncementModel announcement;
  final VoidCallback onTap;

  const _AnnouncementCard({required this.announcement, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final catColor = _categoryColor(announcement.category);
    final priorityColor = _priorityColor(announcement.priority);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Priority color strip
            Container(width: 5, color: priorityColor),
            // Content
            Expanded(
              child: InkWell(
                onTap: onTap,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              announcement.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: catColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _categoryLabel(announcement.category),
                              style: TextStyle(
                                fontSize: 10,
                                color: catColor,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        announcement.content,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _fmtDate(announcement.createdAt),
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
