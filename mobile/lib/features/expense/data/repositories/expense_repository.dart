import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/expense_remote_datasource.dart';
import '../models/expense_model.dart';
import '../models/expense_type_model.dart';

class ExpenseRepository {
  final ExpenseRemoteDatasource _ds;
  ExpenseRepository(this._ds);

  Future<List<ExpenseTypeModel>> getExpenseTypes() => _ds.getExpenseTypes();

  Future<List<ExpenseModel>> getMyExpenses({String? status, int page = 1}) =>
      _ds.getMyExpenses(status: status, page: page);

  Future<ExpenseModel> submitExpense({
    required String expenseDate,
    required double amount,
    required int expenseTypeId,
    required String description,
    required List<int> fileBytes,
    required String filename,
  }) =>
      _ds.submitExpense(
        expenseDate:    expenseDate,
        amount:         amount,
        expenseTypeId:  expenseTypeId,
        description:    description,
        fileBytes:      fileBytes,
        filename:       filename,
      );

  Future<void> deleteExpense(int id) => _ds.deleteExpense(id);

  Future<List<ExpenseModel>> getExpenses({
    String? status,
    String? category,
    String? search,
    int page = 1,
  }) =>
      _ds.getExpenses(status: status, category: category, search: search, page: page);

  Future<ExpenseModel> approveExpense(int id) => _ds.approveExpense(id);

  Future<ExpenseModel> rejectExpense(int id, String reason) =>
      _ds.rejectExpense(id, reason);
}

final expenseRepositoryProvider = Provider<ExpenseRepository>(
  (ref) => ExpenseRepository(ref.watch(expenseRemoteDatasourceProvider)),
);
