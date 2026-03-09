import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/overtime_model.dart';
import '../../data/repositories/overtime_repository.dart';

class MyOvertimesNotifier extends AsyncNotifier<List<OvertimeModel>> {
  @override
  Future<List<OvertimeModel>> build() =>
      ref.watch(overtimeRepositoryProvider).getMyOvertimes();

  Future<String?> submitOvertime({
    required String date,
    required double overtimeHours,
    required String overtimeType,
    required String reason,
  }) async {
    try {
      await ref.read(overtimeRepositoryProvider).submitOvertime(
            date: date,
            overtimeHours: overtimeHours,
            overtimeType: overtimeType,
            reason: reason,
          );
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> cancelOvertime(int id) async {
    try {
      await ref.read(overtimeRepositoryProvider).cancelOvertime(id);
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final myOvertimesProvider =
    AsyncNotifierProvider<MyOvertimesNotifier, List<OvertimeModel>>(() => MyOvertimesNotifier());
