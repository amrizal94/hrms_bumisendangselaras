import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_exception.dart';
import '../../../../core/services/connectivity_service.dart';
import '../../../../core/services/location_service.dart';
import '../../data/datasources/attendance_remote_datasource.dart';
import '../../data/datasources/attendance_remote_datasource.dart';
import '../../data/models/attendance_policy_model.dart';
import '../../data/models/attendance_record_model.dart';
import '../../data/models/pending_attendance_action.dart';
import '../../data/models/qr_session_model.dart';
import '../../data/repositories/attendance_repository.dart';

// ── Attendance policy (check-in method) ───────────────────────────────────────

final attendancePolicyProvider = FutureProvider<AttendancePolicyModel>((ref) =>
    ref.watch(attendanceRemoteDataSourceProvider).getAttendancePolicy());

// ── Sync state ────────────────────────────────────────────────────────────────

class AttendanceSyncState {
  const AttendanceSyncState({this.isSyncing = false, this.pendingCount = 0});
  final bool isSyncing;
  final int pendingCount;
}

class AttendanceSyncNotifier extends Notifier<AttendanceSyncState> {
  @override
  AttendanceSyncState build() {
    // Watch connectivity; trigger sync whenever we come online.
    ref.listen<AsyncValue<bool>>(
      connectivityProvider,
      (_, next) {
        if (next is AsyncData<bool> && next.value == true) {
          _syncPending();
        }
      },
      fireImmediately: true, // also fires with current connectivity on startup
    );

    // Load initial pending count asynchronously.
    Future.microtask(_loadCount);

    return const AttendanceSyncState();
  }

  Future<void> _loadCount() async {
    final count = await ref.read(attendanceRepositoryProvider).pendingCount();
    state = AttendanceSyncState(isSyncing: false, pendingCount: count);
  }

  /// Called by TodayAttendanceNotifier after queuing an action offline.
  void onActionQueued() {
    state = AttendanceSyncState(
      isSyncing: false,
      pendingCount: state.pendingCount + 1,
    );
  }

  Future<void> _syncPending() async {
    final repo = ref.read(attendanceRepositoryProvider);
    final pending = await repo.getPendingActions();
    if (pending.isEmpty) return;

    state = AttendanceSyncState(isSyncing: true, pendingCount: pending.length);

    var remaining = pending.length;

    for (final action in pending) {
      try {
        if (action.action == 'check_in') {
          await repo.syncCheckIn(action);
        } else {
          await repo.syncCheckOut(action);
        }
        await repo.removePendingAction(action.id);
        remaining--;
        state = AttendanceSyncState(isSyncing: remaining > 0, pendingCount: remaining);
      } on ApiException catch (e) {
        // 422 = already exists on server → treat as successfully synced
        if (e.statusCode == 422) {
          await repo.removePendingAction(action.id);
          remaining--;
          state = AttendanceSyncState(isSyncing: remaining > 0, pendingCount: remaining);
        }
        // Other API errors → leave in queue; will retry on next connectivity change
      } catch (_) {
        // Network / unexpected error → leave in queue
      }
    }

    // Refresh today's attendance from server after sync
    ref.invalidate(todayAttendanceProvider);
  }
}

final attendanceSyncProvider =
    NotifierProvider<AttendanceSyncNotifier, AttendanceSyncState>(
        AttendanceSyncNotifier.new);

// ── Today's attendance ────────────────────────────────────────────────────────

class TodayAttendanceNotifier extends AsyncNotifier<AttendanceRecordModel?> {
  @override
  Future<AttendanceRecordModel?> build() =>
      ref.watch(attendanceRepositoryProvider).getToday();

  Future<String?> checkIn() async {
    if (await isOnline()) {
      return _onlineCheckIn();
    } else {
      return _offlineCheckIn();
    }
  }

  Future<String?> checkOut() async {
    if (await isOnline()) {
      return _onlineCheckOut();
    } else {
      return _offlineCheckOut();
    }
  }

  // ── Online paths ────────────────────────────────────────────────────────────

  Future<String?> _onlineCheckIn() async {
    try {
      final record = await ref.read(attendanceRepositoryProvider).checkIn();
      state = AsyncData(record);
      return null;
    } catch (e) {
      await _refreshTodayBestEffort();
      return _humanizeError(e);
    }
  }

  Future<String?> _onlineCheckOut() async {
    try {
      final record = await ref.read(attendanceRepositoryProvider).checkOut();
      state = AsyncData(record);
      return null;
    } catch (e) {
      await _refreshTodayBestEffort();
      return _humanizeError(e);
    }
  }

  // ── Offline paths ───────────────────────────────────────────────────────────

  Future<String?> _offlineCheckIn() async {
    final loc = await LocationService.getCurrentLocation();
    final now = DateTime.now();
    final action = PendingAttendanceAction(
      id: now.millisecondsSinceEpoch.toString(),
      action: 'check_in',
      timestamp: now,
      latitude: loc?.latitude,
      longitude: loc?.longitude,
      locationAccuracy: loc?.accuracy,
      isMockLocation: loc?.isMocked ?? false,
    );
    await ref.read(attendanceRepositoryProvider).enqueueAction(action);

    // Optimistic local record
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    state = AsyncData(AttendanceRecordModel(
      id: 0,
      date: dateStr,
      checkIn: now.toIso8601String(),
      status: 'present',
      isPending: true,
    ));

    ref.read(attendanceSyncProvider.notifier).onActionQueued();
    return null;
  }

  Future<String?> _offlineCheckOut() async {
    final loc = await LocationService.getCurrentLocation();
    final now = DateTime.now();
    final action = PendingAttendanceAction(
      id: now.millisecondsSinceEpoch.toString(),
      action: 'check_out',
      timestamp: now,
      latitude: loc?.latitude,
      longitude: loc?.longitude,
      locationAccuracy: loc?.accuracy,
      isMockLocation: loc?.isMocked ?? false,
    );
    await ref.read(attendanceRepositoryProvider).enqueueAction(action);

    // Optimistic update: add check-out time to current record
    final current = state.value;
    if (current != null) {
      state = AsyncData(current.copyWith(
        checkOut: now.toIso8601String(),
        isPending: true,
      ));
    }

    ref.read(attendanceSyncProvider.notifier).onActionQueued();
    return null;
  }

  // ── QR scan ─────────────────────────────────────────────────────────────────

  Future<String?> scanQr(String token) async {
    try {
      final location = await LocationService.getCurrentLocation();
      final ds = ref.read(attendanceRemoteDataSourceProvider);
      final record = await ds.scanQr(token: token, location: location);
      state = AsyncData(record);
      return null;
    } catch (e) {
      await _refreshTodayBestEffort();
      return _humanizeError(e);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  Future<void> _refreshTodayBestEffort() async {
    try {
      final latest = await ref.read(attendanceRepositoryProvider).getToday();
      state = AsyncData(latest);
    } catch (_) {
      // Keep existing state on refresh error
    }
  }

  String _humanizeError(Object e) {
    if (e is ApiException) {
      if (e.statusCode == 422) {
        final msg = e.message.toLowerCase();
        if (msg.contains('already checked out')) return 'Kamu sudah check-out hari ini.';
        if (msg.contains('already checked in')) return 'Kamu sudah check-in hari ini.';
      }
      return '${e.message}${e.statusCode != null ? ' (status: ${e.statusCode})' : ''}';
    }
    return e.toString().replaceFirst('ApiException: ', '');
  }
}

final todayAttendanceProvider =
    AsyncNotifierProvider<TodayAttendanceNotifier, AttendanceRecordModel?>(
        TodayAttendanceNotifier.new);

// ── History providers ─────────────────────────────────────────────────────────

final myAttendanceListProvider = FutureProvider.family<
    List<AttendanceRecordModel>,
    ({String? dateFrom, String? dateTo})>((ref, params) {
  return ref.watch(attendanceRepositoryProvider).getMyAttendance(
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      );
});

typedef AllAttendanceParams = ({String? date, String? status});

final allAttendanceProvider = FutureProvider.family<
    List<AttendanceRecordModel>,
    AllAttendanceParams>((ref, params) {
  return ref.watch(attendanceRepositoryProvider).getAllAttendance(
        date: params.date,
        status: params.status,
      );
});

// ── Admin attendance correction ───────────────────────────────────────────────

class AdminAttendanceCorrectionNotifier extends Notifier<void> {
  @override
  void build() {}

  Future<String?> create({
    required int employeeId,
    required String date,
    required String checkIn,
    String? checkOut,
    required String status,
    String? notes,
  }) async {
    try {
      await ref.read(attendanceRepositoryProvider).createAttendance(
            employeeId: employeeId,
            date: date,
            checkIn: checkIn,
            checkOut: checkOut,
            status: status,
            notes: notes,
          );
      ref.invalidate(allAttendanceProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> update({
    required int id,
    String? checkIn,
    String? checkOut,
    required String status,
    String? notes,
  }) async {
    try {
      await ref.read(attendanceRepositoryProvider).updateAttendance(
            id: id,
            checkIn: checkIn,
            checkOut: checkOut,
            status: status,
            notes: notes,
          );
      ref.invalidate(allAttendanceProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> delete(int id) async {
    try {
      await ref.read(attendanceRepositoryProvider).deleteAttendance(id);
      ref.invalidate(allAttendanceProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final adminAttendanceCorrectionProvider =
    NotifierProvider<AdminAttendanceCorrectionNotifier, void>(
        AdminAttendanceCorrectionNotifier.new);

// ── QR Session management (admin/HR) ─────────────────────────────────────────

class QrSessionNotifier extends AsyncNotifier<List<QrSessionModel>> {
  @override
  Future<List<QrSessionModel>> build() {
    final today = DateTime.now();
    final dateStr =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    return ref.read(attendanceRemoteDataSourceProvider).getQrSessions(date: dateStr);
  }

  Future<QrSessionModel?> generate({
    required String type,
    required String date,
    required String validFrom,
    required String validUntil,
  }) async {
    try {
      final session = await ref.read(attendanceRemoteDataSourceProvider).generateQrSession(
            type: type,
            date: date,
            validFrom: validFrom,
            validUntil: validUntil,
          );
      // Prepend to list
      final current = state.value ?? [];
      state = AsyncData([session, ...current]);
      return session;
    } catch (_) {
      return null;
    }
  }

  Future<String?> deactivate(int id) async {
    try {
      await ref.read(attendanceRemoteDataSourceProvider).deactivateQrSession(id);
      // Update is_active in list — rebuild from server
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final qrSessionProvider =
    AsyncNotifierProvider<QrSessionNotifier, List<QrSessionModel>>(QrSessionNotifier.new);
