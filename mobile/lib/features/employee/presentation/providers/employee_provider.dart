import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/employee_model.dart';
import '../../data/repositories/employee_repository.dart';

// ── State ─────────────────────────────────────────────────────────────────────

class EmployeeListState {
  final List<EmployeeModel> items;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final int lastPage;
  final String search;
  final Set<int> toggling; // employee IDs currently being toggled

  const EmployeeListState({
    this.items = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.lastPage = 1,
    this.search = '',
    this.toggling = const {},
  });

  bool get hasMore => currentPage < lastPage;

  EmployeeListState copyWith({
    List<EmployeeModel>? items,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool clearError = false,
    int? currentPage,
    int? lastPage,
    String? search,
    Set<int>? toggling,
  }) {
    return EmployeeListState(
      items:         items         ?? this.items,
      isLoading:     isLoading     ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error:         clearError ? null : (error ?? this.error),
      currentPage:   currentPage   ?? this.currentPage,
      lastPage:      lastPage      ?? this.lastPage,
      search:        search        ?? this.search,
      toggling:      toggling      ?? this.toggling,
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

class EmployeeListNotifier extends Notifier<EmployeeListState> {
  @override
  EmployeeListState build() {
    Future.microtask(load);
    return const EmployeeListState();
  }

  EmployeeRepository get _repo => ref.read(employeeRepositoryProvider);

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true, currentPage: 1);
    try {
      final result = await _repo.getEmployees(
        page: 1,
        search: state.search.isEmpty ? null : state.search,
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
      final result = await _repo.getEmployees(
        page: nextPage,
        search: state.search.isEmpty ? null : state.search,
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

  /// Returns null on success, error message on failure.
  Future<String?> createEmployee(Map<String, dynamic> data) async {
    try {
      final created = await _repo.createEmployee(data);
      state = state.copyWith(items: [created, ...state.items]);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  /// Returns null on success, error message on failure.
  Future<String?> updateEmployee(int id, Map<String, dynamic> data) async {
    try {
      final updated = await _repo.updateEmployee(id, data);
      state = state.copyWith(
        items: state.items.map((e) => e.id == id ? updated : e).toList(),
      );
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  /// Returns null on success, error message on failure.
  Future<String?> toggleActive(int employeeId) async {
    state = state.copyWith(toggling: {...state.toggling, employeeId});
    try {
      final updated = await _repo.toggleActive(employeeId);
      state = state.copyWith(
        items: state.items
            .map((e) => e.id == employeeId ? updated : e)
            .toList(),
        toggling: state.toggling.difference({employeeId}),
      );
      return null;
    } catch (e) {
      state = state.copyWith(
        toggling: state.toggling.difference({employeeId}),
        error: e.toString(),
      );
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final employeeListProvider =
    NotifierProvider<EmployeeListNotifier, EmployeeListState>(
  EmployeeListNotifier.new,
);

final departmentsForFormProvider =
    FutureProvider<List<({int id, String name})>>(
  (ref) => ref.read(employeeRepositoryProvider).getDepartments(),
);

final shiftsForFormProvider =
    FutureProvider<List<({int id, String name, String checkInTime, String checkOutTime})>>(
  (ref) => ref.read(employeeRepositoryProvider).getShifts(),
);
