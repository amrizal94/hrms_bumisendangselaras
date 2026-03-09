import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/audit_log_model.dart';
import '../../data/models/face_enrollment_model.dart';
import '../../data/repositories/face_admin_repository.dart';

// ── State ─────────────────────────────────────────────────────────────────────

class FaceManagementState {
  final List<FaceEnrollmentModel> items;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final int lastPage;
  final String search;
  final String? enrolledFilter; // null = all, 'true' = enrolled, 'false' = not

  const FaceManagementState({
    this.items = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.lastPage = 1,
    this.search = '',
    this.enrolledFilter,
  });

  bool get hasMore => currentPage < lastPage;

  FaceManagementState copyWith({
    List<FaceEnrollmentModel>? items,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool clearError = false,
    int? currentPage,
    int? lastPage,
    String? search,
    Object? enrolledFilter = _sentinel,
  }) {
    return FaceManagementState(
      items:          items          ?? this.items,
      isLoading:      isLoading      ?? this.isLoading,
      isLoadingMore:  isLoadingMore  ?? this.isLoadingMore,
      error:          clearError ? null : (error ?? this.error),
      currentPage:    currentPage    ?? this.currentPage,
      lastPage:       lastPage       ?? this.lastPage,
      search:         search         ?? this.search,
      enrolledFilter: identical(enrolledFilter, _sentinel)
          ? this.enrolledFilter
          : enrolledFilter as String?,
    );
  }
}

const _sentinel = Object();

// ── Notifier ──────────────────────────────────────────────────────────────────

class FaceManagementNotifier extends Notifier<FaceManagementState> {
  @override
  FaceManagementState build() {
    Future.microtask(load);
    return const FaceManagementState();
  }

  FaceAdminRepository get _repo => ref.read(faceAdminRepositoryProvider);

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true, currentPage: 1);
    try {
      final result = await _repo.getFaceEnrollments(
        page: 1,
        search: state.search.isEmpty ? null : state.search,
        enrolled: state.enrolledFilter,
      );
      state = state.copyWith(
        items: result.items,
        isLoading: false,
        currentPage: 1,
        lastPage: result.lastPage,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    final nextPage = state.currentPage + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await _repo.getFaceEnrollments(
        page: nextPage,
        search: state.search.isEmpty ? null : state.search,
        enrolled: state.enrolledFilter,
      );
      state = state.copyWith(
        items: [...state.items, ...result.items],
        isLoadingMore: false,
        currentPage: nextPage,
        lastPage: result.lastPage,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false, error: e.toString());
    }
  }

  void setSearch(String q) {
    state = state.copyWith(search: q);
    load();
  }

  void setEnrolledFilter(String? f) {
    state = FaceManagementState(
      search: state.search,
      enrolledFilter: f,
    );
    load();
  }

  Future<String?> deleteFace(int faceDataId) async {
    try {
      await _repo.deleteFaceData(faceDataId);
      // Remove from local list immediately (optimistic)
      state = state.copyWith(
        items: state.items
            .map((e) => e.faceDataId == faceDataId
                ? FaceEnrollmentModel(
                    employeeId:     e.employeeId,
                    employeeNumber: e.employeeNumber,
                    position:       e.position,
                    userName:       e.userName,
                    userIsActive:   e.userIsActive,
                    departmentName: e.departmentName,
                    isEnrolled:     false,
                    faceDataId:     null,
                    enrolledAt:     null,
                    imageUrl:       null,
                    enrolledByName: null,
                  )
                : e)
            .toList(),
      );
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final faceManagementProvider =
    NotifierProvider<FaceManagementNotifier, FaceManagementState>(
  FaceManagementNotifier.new,
);

// ── Audit Log State & Notifier ────────────────────────────────────────────────

class FaceAuditLogState {
  final List<AuditLogModel> items;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final int lastPage;
  final String actionFilter; // 'face' | 'face.enroll' | ...

  const FaceAuditLogState({
    this.items = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.lastPage = 1,
    this.actionFilter = 'face',
  });

  bool get hasMore => currentPage < lastPage;

  FaceAuditLogState copyWith({
    List<AuditLogModel>? items,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool clearError = false,
    int? currentPage,
    int? lastPage,
    String? actionFilter,
  }) {
    return FaceAuditLogState(
      items:         items         ?? this.items,
      isLoading:     isLoading     ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error:         clearError ? null : (error ?? this.error),
      currentPage:   currentPage   ?? this.currentPage,
      lastPage:      lastPage      ?? this.lastPage,
      actionFilter:  actionFilter  ?? this.actionFilter,
    );
  }
}

class FaceAuditLogNotifier extends Notifier<FaceAuditLogState> {
  @override
  FaceAuditLogState build() {
    Future.microtask(load);
    return const FaceAuditLogState();
  }

  FaceAdminRepository get _repo => ref.read(faceAdminRepositoryProvider);

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true, currentPage: 1);
    try {
      final result = await _repo.getAuditLogs(
        page:   1,
        action: state.actionFilter,
      );
      state = state.copyWith(
        items:       result.items,
        isLoading:   false,
        currentPage: 1,
        lastPage:    result.lastPage,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    final nextPage = state.currentPage + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await _repo.getAuditLogs(
        page:   nextPage,
        action: state.actionFilter,
      );
      state = state.copyWith(
        items:         [...state.items, ...result.items],
        isLoadingMore: false,
        currentPage:   nextPage,
        lastPage:      result.lastPage,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false, error: e.toString());
    }
  }

  void setFilter(String action) {
    state = FaceAuditLogState(actionFilter: action);
    load();
  }
}

final faceAuditLogProvider =
    NotifierProvider<FaceAuditLogNotifier, FaceAuditLogState>(
  FaceAuditLogNotifier.new,
);
