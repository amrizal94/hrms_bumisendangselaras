import 'package:flutter/material.dart';

import '../../data/models/announcement_model.dart';

// ── Helpers ──────────────────────────────────────────────────────────────────

Color _priorityColor(String priority) => switch (priority) {
      'high'   => Colors.red,
      'medium' => Colors.amber.shade700,
      _        => Colors.green,
    };

String _priorityLabel(String priority) => switch (priority) {
      'high'   => 'High',
      'medium' => 'Medium',
      _        => 'Low',
    };

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

class AnnouncementDetailScreen extends StatelessWidget {
  final AnnouncementModel announcement;

  const AnnouncementDetailScreen({super.key, required this.announcement});

  @override
  Widget build(BuildContext context) {
    final catColor      = _categoryColor(announcement.category);
    final priorityColor = _priorityColor(announcement.priority);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          announcement.title,
          overflow: TextOverflow.ellipsis,
        ),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          16, 16, 16,
          16 + MediaQuery.of(context).padding.bottom + 24,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Badges row
            Row(
              children: [
                // Priority badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: priorityColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: priorityColor.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.flag_outlined, size: 13, color: priorityColor),
                      const SizedBox(width: 4),
                      Text(
                        _priorityLabel(announcement.priority),
                        style: TextStyle(
                          fontSize: 12,
                          color: priorityColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Category badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: catColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _categoryLabel(announcement.category),
                    style: TextStyle(
                      fontSize: 12,
                      color: catColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Meta info
            if (announcement.createdBy != null || announcement.createdAt != null)
              Text(
                [
                  if (announcement.createdBy != null) announcement.createdBy!,
                  if (announcement.createdAt != null) _fmtDate(announcement.createdAt),
                ].join(' · '),
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
            const SizedBox(height: 16),

            // Divider
            const Divider(),
            const SizedBox(height: 12),

            // Full content — selectable so user can copy
            SelectableText(
              announcement.content,
              style: const TextStyle(
                fontSize: 15,
                height: 1.6,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
