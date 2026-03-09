import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/datasources/meeting_remote_datasource.dart';
import '../../data/models/meeting_model.dart';
import '../providers/meeting_provider.dart';

class MeetingDetailScreen extends ConsumerStatefulWidget {
  final MeetingModel meeting;
  const MeetingDetailScreen({super.key, required this.meeting});

  @override
  ConsumerState<MeetingDetailScreen> createState() => _MeetingDetailScreenState();
}

class _MeetingDetailScreenState extends ConsumerState<MeetingDetailScreen> {
  late MeetingModel _meeting;
  bool _loadingRsvps = false;
  List<Map<String, dynamic>> _rsvpList = [];
  Map<String, int> _rsvpCounts = {'accepted': 0, 'declined': 0, 'total': 0};

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

  @override
  void initState() {
    super.initState();
    _meeting = widget.meeting;
    if (_isAdminOrHr) _loadRsvps();
  }

  Future<void> _loadRsvps() async {
    setState(() => _loadingRsvps = true);
    try {
      final data = await ref
          .read(meetingRemoteDatasourceProvider)
          .getRsvpList(_meeting.id);
      final rsvps = (data['rsvps'] as List?) ?? [];
      final counts = data['counts'] as Map<String, dynamic>? ?? {};
      setState(() {
        _rsvpList  = rsvps.cast<Map<String, dynamic>>();
        _rsvpCounts = {
          'accepted': counts['accepted'] as int? ?? 0,
          'declined': counts['declined'] as int? ?? 0,
          'total':    counts['total']    as int? ?? 0,
        };
      });
    } catch (_) {
    } finally {
      setState(() => _loadingRsvps = false);
    }
  }

  Future<void> _rsvp(String status) async {
    final messenger = ScaffoldMessenger.of(context);
    final err = await ref.read(meetingRsvpNotifierProvider.notifier).rsvp(_meeting.id, status);
    if (!mounted) return;
    if (err != null) {
      messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
    } else {
      messenger.showSnackBar(SnackBar(
        content: Text(status == 'accepted' ? 'You accepted the meeting.' : 'You declined the meeting.'),
        backgroundColor: status == 'accepted' ? Colors.green : Colors.red,
      ));
      // Optimistic update of my_rsvp
      setState(() {
        _meeting = MeetingModel(
          id:           _meeting.id,
          title:        _meeting.title,
          description:  _meeting.description,
          meetingDate:  _meeting.meetingDate,
          startTime:    _meeting.startTime,
          endTime:      _meeting.endTime,
          location:     _meeting.location,
          meetingUrl:   _meeting.meetingUrl,
          targetRoles:  _meeting.targetRoles,
          createdBy:    _meeting.createdBy,
          myRsvp:       status,
          rsvpAccepted: _meeting.rsvpAccepted,
          rsvpDeclined: _meeting.rsvpDeclined,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin   = _isAdminOrHr;
    final upcoming  = _meeting.isUpcoming;
    final dateStr   = _fmtDate(_meeting.meetingDate);
    const months    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Meeting Detail'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Date badge
                    Container(
                      width: 60,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: upcoming ? Colors.blue.shade50 : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Text(
                            '${DateTime.tryParse(_meeting.meetingDate)?.day ?? '—'}',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: upcoming ? Colors.blue.shade700 : Colors.grey,
                            ),
                          ),
                          Text(
                            (){
                              final d = DateTime.tryParse(_meeting.meetingDate);
                              return d != null ? months[d.month - 1] : '—';
                            }(),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: upcoming ? Colors.blue.shade600 : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _meeting.title,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_meeting.startTimeShort} – ${_meeting.endTimeShort}',
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                          ),
                          Text(
                            dateStr,
                            style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Details card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_meeting.location != null) ...[
                      _detailRow(Icons.location_on_outlined, 'Location', _meeting.location!),
                      const Divider(height: 20),
                    ],
                    if (_meeting.meetingUrl != null) ...[
                      Row(
                        children: [
                          Icon(Icons.videocam_outlined, size: 18, color: Colors.blue.shade600),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () => _launchUrl(_meeting.meetingUrl!),
                            child: Text(
                              'Join Meeting',
                              style: TextStyle(
                                color: Colors.blue.shade600,
                                fontWeight: FontWeight.w600,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 20),
                    ],
                    if (_meeting.createdBy != null)
                      _detailRow(Icons.person_outline, 'Organizer', _meeting.createdBy!),
                  ],
                ),
              ),
            ),

            if (_meeting.description != null && _meeting.description!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Description', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 8),
                      Text(_meeting.description!, style: TextStyle(color: Colors.grey.shade700, height: 1.5)),
                    ],
                  ),
                ),
              ),
            ],

            // RSVP section (staff)
            if (!isAdmin && upcoming) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('RSVP', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 12),
                      if (_meeting.myRsvp != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: _meeting.myRsvp == 'accepted'
                                ? Colors.green.shade50
                                : Colors.red.shade50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                _meeting.myRsvp == 'accepted'
                                    ? Icons.check_circle
                                    : Icons.cancel,
                                color: _meeting.myRsvp == 'accepted' ? Colors.green : Colors.red,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _meeting.myRsvp == 'accepted'
                                    ? 'You accepted this meeting'
                                    : 'You declined this meeting',
                                style: TextStyle(
                                  color: _meeting.myRsvp == 'accepted' ? Colors.green.shade700 : Colors.red.shade700,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _rsvp('accepted'),
                                icon: const Icon(Icons.check, size: 16),
                                label: const Text('Accept'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.green,
                                  side: const BorderSide(color: Colors.green),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _rsvp('declined'),
                                icon: const Icon(Icons.close, size: 16),
                                label: const Text('Decline'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.red,
                                  side: const BorderSide(color: Colors.red),
                                ),
                              ),
                            ),
                          ],
                        ),
                      if (_meeting.myRsvp != null) ...[
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () => _rsvp(_meeting.myRsvp == 'accepted' ? 'declined' : 'accepted'),
                          child: Text(
                            _meeting.myRsvp == 'accepted' ? 'Change to Decline' : 'Change to Accept',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],

            // RSVP list section (admin/HR)
            if (isAdmin) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('RSVP Responses', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          TextButton(
                            onPressed: _loadRsvps,
                            child: const Text('Refresh', style: TextStyle(fontSize: 12)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.check_circle, size: 16, color: Colors.green.shade600),
                          const SizedBox(width: 4),
                          Text('${_rsvpCounts['accepted']} accepted', style: const TextStyle(fontSize: 13)),
                          const SizedBox(width: 16),
                          Icon(Icons.cancel, size: 16, color: Colors.red.shade400),
                          const SizedBox(width: 4),
                          Text('${_rsvpCounts['declined']} declined', style: const TextStyle(fontSize: 13)),
                          const SizedBox(width: 16),
                          Icon(Icons.people, size: 16, color: Colors.grey.shade500),
                          const SizedBox(width: 4),
                          Text('${_rsvpCounts['total']} total', style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                      if (_loadingRsvps)
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      else if (_rsvpList.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        ..._rsvpList.map((r) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            children: [
                              Expanded(child: Text(r['name'] as String? ?? '—', style: const TextStyle(fontSize: 13))),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: r['status'] == 'accepted' ? Colors.green.shade50 : Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  r['status'] == 'accepted' ? 'Accepted' : 'Declined',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: r['status'] == 'accepted' ? Colors.green.shade700 : Colors.red.shade600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )),
                      ] else if (!_loadingRsvps) ...[
                        const SizedBox(height: 8),
                        Text('No RSVPs yet.', style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
                      ],
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: Colors.grey.shade600),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
              Text(value, style: const TextStyle(fontSize: 14)),
            ],
          ),
        ),
      ],
    );
  }

  String _fmtDate(String date) {
    const days   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    final d = DateTime.tryParse(date);
    if (d == null) return date;
    return '${days[d.weekday - 1]}, ${d.day} ${months[d.month - 1]} ${d.year}';
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
