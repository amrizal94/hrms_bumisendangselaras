import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/datasources/meeting_remote_datasource.dart';
import '../../data/models/meeting_model.dart';

// ── Staff/All: my meetings ────────────────────────────────────────────────────

final myMeetingsProvider = FutureProvider.autoDispose<List<MeetingModel>>((ref) {
  return ref.watch(meetingRemoteDatasourceProvider).getMyMeetings();
});

// ── Admin/HR: all meetings ─────────────────────────────────────────────────────

final allMeetingsProvider = FutureProvider.autoDispose<List<MeetingModel>>((ref) {
  return ref.watch(meetingRemoteDatasourceProvider).getMeetings();
});

// ── RSVP action ───────────────────────────────────────────────────────────────

class MeetingRsvpNotifier extends Notifier<void> {
  @override
  void build() {}

  Future<String?> rsvp(int meetingId, String status) async {
    try {
      await ref.read(meetingRemoteDatasourceProvider).rsvp(meetingId, status);
      ref.invalidate(myMeetingsProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final meetingRsvpNotifierProvider =
    NotifierProvider<MeetingRsvpNotifier, void>(() => MeetingRsvpNotifier());

// ── Admin CRUD ────────────────────────────────────────────────────────────────

class AdminMeetingNotifier extends Notifier<void> {
  @override
  void build() {}

  Future<String?> create({
    required String title,
    String? description,
    required String meetingDate,
    required String startTime,
    required String endTime,
    String? location,
    String? meetingUrl,
    String targetRoles = 'all',
  }) async {
    try {
      await ref.read(meetingRemoteDatasourceProvider).createMeeting(
            title:        title,
            description:  description,
            meetingDate:  meetingDate,
            startTime:    startTime,
            endTime:      endTime,
            location:     location,
            meetingUrl:   meetingUrl,
            targetRoles:  targetRoles,
          );
      ref.invalidate(allMeetingsProvider);
      ref.invalidate(myMeetingsProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> update(int id, Map<String, dynamic> data) async {
    try {
      await ref.read(meetingRemoteDatasourceProvider).updateMeeting(id: id, data: data);
      ref.invalidate(allMeetingsProvider);
      ref.invalidate(myMeetingsProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> delete(int id) async {
    try {
      await ref.read(meetingRemoteDatasourceProvider).deleteMeeting(id);
      ref.invalidate(allMeetingsProvider);
      ref.invalidate(myMeetingsProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final adminMeetingNotifierProvider =
    NotifierProvider<AdminMeetingNotifier, void>(() => AdminMeetingNotifier());
