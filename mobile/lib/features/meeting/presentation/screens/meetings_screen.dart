import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/router/app_routes.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../data/models/meeting_model.dart';
import '../providers/meeting_provider.dart';

const _filters = [
  ('upcoming', 'Upcoming'),
  ('all',      'All'),
  ('past',     'Past'),
];

class MeetingsScreen extends ConsumerStatefulWidget {
  const MeetingsScreen({super.key});

  @override
  ConsumerState<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends ConsumerState<MeetingsScreen> {
  String _filter = 'upcoming';

  bool get _isAdminOrHr {
    final as = ref.read(authNotifierProvider);
    if (as is AuthAuthenticated) {
      return as.user.role == AppConstants.roleAdmin ||
             as.user.role == AppConstants.roleDirector ||
             as.user.role == AppConstants.roleHR ||
             as.user.role == AppConstants.roleManager;
    }
    return false;
  }

  List<MeetingModel> _applyFilter(List<MeetingModel> all) {
    return switch (_filter) {
      'upcoming' => all.where((m) => m.isUpcoming).toList(),
      'past'     => all.where((m) => !m.isUpcoming).toList(),
      _          => all,
    };
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin = _isAdminOrHr;
    final meetingsAsync = isAdmin
        ? ref.watch(allMeetingsProvider)
        : ref.watch(myMeetingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Meetings'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      floatingActionButton: isAdmin
          ? FloatingActionButton(
              onPressed: () => _showCreateDialog(context),
              backgroundColor: Colors.blue.shade700,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
      body: Column(
        children: [
          // Filter chips
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: _filters.map((f) {
                final selected = _filter == f.$1;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(f.$2),
                    selected: selected,
                    onSelected: (_) => setState(() => _filter = f.$1),
                    selectedColor: Colors.blue.shade100,
                    checkmarkColor: Colors.blue.shade700,
                  ),
                );
              }).toList(),
            ),
          ),

          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                if (isAdmin) {
                  ref.invalidate(allMeetingsProvider);
                } else {
                  ref.invalidate(myMeetingsProvider);
                }
              },
              child: meetingsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 40),
                      const SizedBox(height: 8),
                      Text(e.toString(), textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () {
                          if (isAdmin) ref.invalidate(allMeetingsProvider);
                          else ref.invalidate(myMeetingsProvider);
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (all) {
                  final meetings = _applyFilter(all);
                  if (meetings.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.video_call_outlined, size: 56, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          Text(
                            _filter == 'upcoming' ? 'No upcoming meetings' : 'No meetings found',
                            style: TextStyle(color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
                    itemCount: meetings.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _MeetingCard(
                      meeting: meetings[i],
                      isAdmin: isAdmin,
                      onTap: () => context.push(
                        AppRoutes.meetingDetail,
                        extra: meetings[i],
                      ),
                      onEdit: isAdmin
                          ? () => _showEditDialog(context, meetings[i])
                          : null,
                      onDelete: isAdmin
                          ? () => _confirmDelete(context, meetings[i])
                          : null,
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showCreateDialog(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _MeetingFormSheet(
        onSubmit: ({
          required title,
          description,
          required meetingDate,
          required startTime,
          required endTime,
          location,
          meetingUrl,
          required targetRoles,
        }) async {
          return ref.read(adminMeetingNotifierProvider.notifier).create(
            title:       title,
            description: description,
            meetingDate: meetingDate,
            startTime:   startTime,
            endTime:     endTime,
            location:    location,
            meetingUrl:  meetingUrl,
            targetRoles: targetRoles,
          );
        },
      ),
    );
  }

  Future<void> _showEditDialog(BuildContext context, MeetingModel meeting) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _MeetingFormSheet(
        initial: meeting,
        onSubmit: ({
          required title,
          description,
          required meetingDate,
          required startTime,
          required endTime,
          location,
          meetingUrl,
          required targetRoles,
        }) async {
          return ref.read(adminMeetingNotifierProvider.notifier).update(
            meeting.id,
            {
              'title':        title,
              'description':  description,
              'meeting_date': meetingDate,
              'start_time':   startTime,
              'end_time':     endTime,
              'location':     location,
              'meeting_url':  meetingUrl,
              'target_roles': targetRoles,
            },
          );
        },
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, MeetingModel meeting) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Meeting?'),
        content: Text('Delete "${meeting.title}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    final messenger = ScaffoldMessenger.of(context);
    final err = await ref.read(adminMeetingNotifierProvider.notifier).delete(meeting.id);
    if (err != null) {
      messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
    } else {
      messenger.showSnackBar(const SnackBar(content: Text('Meeting deleted.')));
    }
  }
}

// ── Meeting Card ──────────────────────────────────────────────────────────────

class _MeetingCard extends StatelessWidget {
  final MeetingModel meeting;
  final bool isAdmin;
  final VoidCallback onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const _MeetingCard({
    required this.meeting,
    required this.isAdmin,
    required this.onTap,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final upcoming = meeting.isUpcoming;
    final dateStr  = _fmtDate(meeting.meetingDate);
    final dayNum   = _dayNum(meeting.meetingDate);
    final monthAbb = _monthAbb(meeting.meetingDate);

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Date column
              Container(
                width: 52,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: upcoming ? Colors.blue.shade50 : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: [
                    Text(
                      dayNum,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: upcoming ? Colors.blue.shade700 : Colors.grey,
                      ),
                    ),
                    Text(
                      monthAbb,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: upcoming ? Colors.blue.shade600 : Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            meeting.title,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                        ),
                        if (isAdmin) ...[
                          if (onEdit != null)
                            IconButton(
                              icon: const Icon(Icons.edit_outlined, size: 16),
                              constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                              padding: EdgeInsets.zero,
                              onPressed: onEdit,
                              color: Colors.grey,
                            ),
                          if (onDelete != null)
                            IconButton(
                              icon: const Icon(Icons.delete_outline, size: 16),
                              constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                              padding: EdgeInsets.zero,
                              onPressed: onDelete,
                              color: Colors.red.shade300,
                            ),
                        ],
                      ],
                    ),
                    Text(
                      '${meeting.startTimeShort} – ${meeting.endTimeShort}  ·  $dateStr',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                    if (meeting.location != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.location_on_outlined, size: 13, color: Colors.grey.shade500),
                          const SizedBox(width: 2),
                          Expanded(
                            child: Text(
                              meeting.location!,
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (meeting.meetingUrl != null) ...[
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () => _launchUrl(meeting.meetingUrl!),
                        child: Row(
                          children: [
                            Icon(Icons.videocam_outlined, size: 13, color: Colors.blue.shade600),
                            const SizedBox(width: 2),
                            Text(
                              'Join Meeting',
                              style: TextStyle(fontSize: 12, color: Colors.blue.shade600),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (isAdmin) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.check_circle_outline, size: 14, color: Colors.green.shade600),
                          const SizedBox(width: 2),
                          Text('${meeting.rsvpAccepted}', style: TextStyle(fontSize: 11, color: Colors.green.shade700)),
                          const SizedBox(width: 8),
                          Icon(Icons.cancel_outlined, size: 14, color: Colors.red.shade400),
                          const SizedBox(width: 2),
                          Text('${meeting.rsvpDeclined}', style: TextStyle(fontSize: 11, color: Colors.red.shade500)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _dayNum(String date) {
    final d = DateTime.tryParse(date);
    return d != null ? '${d.day}' : '—';
  }

  String _monthAbb(String date) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    final d = DateTime.tryParse(date);
    return d != null ? months[d.month - 1] : '—';
  }

  String _fmtDate(String date) {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    final d = DateTime.tryParse(date);
    if (d == null) return date;
    return '${days[d.weekday - 1]}, ${d.day} ${_monthAbb(date)} ${d.year}';
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

// ── Meeting Form Sheet ────────────────────────────────────────────────────────

typedef MeetingSubmitCallback = Future<String?> Function({
  required String title,
  String? description,
  required String meetingDate,
  required String startTime,
  required String endTime,
  String? location,
  String? meetingUrl,
  required String targetRoles,
});

class _MeetingFormSheet extends ConsumerStatefulWidget {
  final MeetingModel? initial;
  final MeetingSubmitCallback onSubmit;

  const _MeetingFormSheet({this.initial, required this.onSubmit});

  @override
  ConsumerState<_MeetingFormSheet> createState() => _MeetingFormSheetState();
}

class _MeetingFormSheetState extends ConsumerState<_MeetingFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _titleCtrl  = TextEditingController(text: widget.initial?.title ?? '');
  late final _descCtrl   = TextEditingController(text: widget.initial?.description ?? '');
  late final _dateCtrl   = TextEditingController(text: widget.initial?.meetingDate ?? '');
  late final _startCtrl  = TextEditingController(text: widget.initial?.startTimeShort ?? '');
  late final _endCtrl    = TextEditingController(text: widget.initial?.endTimeShort ?? '');
  late final _locCtrl    = TextEditingController(text: widget.initial?.location ?? '');
  late final _urlCtrl    = TextEditingController(text: widget.initial?.meetingUrl ?? '');
  String _targetRoles    = 'all';
  bool _isSubmitting     = false;

  @override
  void initState() {
    super.initState();
    _targetRoles = widget.initial?.targetRoles ?? 'all';
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _dateCtrl.dispose();
    _startCtrl.dispose();
    _endCtrl.dispose();
    _locCtrl.dispose();
    _urlCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.tryParse(_dateCtrl.text) ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) {
      setState(() {
        _dateCtrl.text =
            '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _pickTime(TextEditingController ctrl) async {
    final current = ctrl.text.split(':');
    final initial = TimeOfDay(
      hour:   int.tryParse(current.isNotEmpty ? current[0] : '9')  ?? 9,
      minute: int.tryParse(current.length > 1 ? current[1] : '0')  ?? 0,
    );
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked != null) {
      setState(() {
        ctrl.text = '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    final messenger = ScaffoldMessenger.of(context);
    final err = await widget.onSubmit(
      title:       _titleCtrl.text.trim(),
      description: _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
      meetingDate: _dateCtrl.text,
      startTime:   _startCtrl.text,
      endTime:     _endCtrl.text,
      location:    _locCtrl.text.trim().isEmpty ? null : _locCtrl.text.trim(),
      meetingUrl:  _urlCtrl.text.trim().isEmpty ? null : _urlCtrl.text.trim(),
      targetRoles: _targetRoles,
    );
    setState(() => _isSubmitting = false);
    if (!mounted) return;
    if (err != null) {
      messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
    } else {
      messenger.showSnackBar(const SnackBar(content: Text('Meeting saved!')));
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        16, 16, 16,
        16 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                widget.initial == null ? 'New Meeting' : 'Edit Meeting',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              _field('Title', _titleCtrl, required: true),
              _field('Description', _descCtrl, maxLines: 3),

              // Date + times row
              Row(children: [
                Expanded(child: _tapField('Date', _dateCtrl, onTap: _pickDate, required: true)),
                const SizedBox(width: 8),
                Expanded(child: _tapField('Start', _startCtrl, onTap: () => _pickTime(_startCtrl), required: true)),
                const SizedBox(width: 8),
                Expanded(child: _tapField('End', _endCtrl, onTap: () => _pickTime(_endCtrl), required: true)),
              ]),

              _field('Location', _locCtrl),
              _field('Video URL', _urlCtrl, keyboardType: TextInputType.url),

              // Target roles
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Target',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  value: _targetRoles,
                  items: const [
                    DropdownMenuItem(value: 'all',      child: Text('All Users')),
                    DropdownMenuItem(value: 'staff',    child: Text('Staff Only')),
                    DropdownMenuItem(value: 'admin_hr', child: Text('Admin & HR')),
                  ],
                  onChanged: (v) => setState(() => _targetRoles = v ?? 'all'),
                ),
              ),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade700,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(_isSubmitting
                      ? 'Saving...'
                      : (widget.initial == null ? 'Create Meeting' : 'Update Meeting')),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, {
    bool required = false,
    int maxLines = 1,
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller:   ctrl,
        maxLines:     maxLines,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText:     label,
          border:        const OutlineInputBorder(),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        validator: required
            ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
            : null,
      ),
    );
  }

  Widget _tapField(String label, TextEditingController ctrl, {
    required VoidCallback onTap,
    bool required = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl,
        readOnly:   true,
        onTap:      onTap,
        decoration: InputDecoration(
          labelText:     label,
          border:        const OutlineInputBorder(),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        validator: required
            ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
            : null,
      ),
    );
  }
}
