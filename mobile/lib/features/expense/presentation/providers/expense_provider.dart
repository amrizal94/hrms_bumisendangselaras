import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/expense_model.dart';
import '../../data/repositories/expense_repository.dart';

// ── Staff: My Expenses ────────────────────────────────────────────────────────

class MyExpenseNotifier extends AsyncNotifier<List<ExpenseModel>> {
  String _statusFilter = 'all';

  @override
  Future<List<ExpenseModel>> build() =>
      ref.watch(expenseRepositoryProvider).getMyExpenses();

  Future<String?> submit({
    required String expenseDate,
    required double amount,
    required int expenseTypeId,
    required String description,
    required List<int> fileBytes,
    required String filename,
  }) async {
    try {
      await ref.read(expenseRepositoryProvider).submitExpense(
            expenseDate:   expenseDate,
            amount:        amount,
            expenseTypeId: expenseTypeId,
            description:   description,
            fileBytes:     fileBytes,
            filename:      filename,
          );
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> delete(int id) async {
    try {
      await ref.read(expenseRepositoryProvider).deleteExpense(id);
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  void setFilter(String status) {
    _statusFilter = status;
    ref.invalidateSelf();
  }

  String get statusFilter => _statusFilter;
}

final myExpenseProvider =
    AsyncNotifierProvider<MyExpenseNotifier, List<ExpenseModel>>(
        () => MyExpenseNotifier());

// ── Admin/HR: All Expenses ───────────────────────────────────────────────────

class AdminExpenseNotifier extends AsyncNotifier<List<ExpenseModel>> {
  String _statusFilter   = 'all';
  String _categoryFilter = 'all';

  @override
  Future<List<ExpenseModel>> build() =>
      ref.watch(expenseRepositoryProvider).getExpenses();

  Future<String?> approve(int id) async {
    try {
      await ref.read(expenseRepositoryProvider).approveExpense(id);
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> reject(int id, String reason) async {
    try {
      await ref.read(expenseRepositoryProvider).rejectExpense(id, reason);
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  void setStatusFilter(String status) {
    _statusFilter = status;
    ref.invalidateSelf();
  }

  void setCategoryFilter(String category) {
    _categoryFilter = category;
    ref.invalidateSelf();
  }

  String get statusFilter   => _statusFilter;
  String get categoryFilter => _categoryFilter;
}

final adminExpenseProvider =
    AsyncNotifierProvider<AdminExpenseNotifier, List<ExpenseModel>>(
        () => AdminExpenseNotifier());
