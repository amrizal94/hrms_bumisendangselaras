import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/expense_type_model.dart';
import '../../data/repositories/expense_repository.dart';

final expenseTypesProvider = FutureProvider<List<ExpenseTypeModel>>(
  (ref) => ref.read(expenseRepositoryProvider).getExpenseTypes(),
);
