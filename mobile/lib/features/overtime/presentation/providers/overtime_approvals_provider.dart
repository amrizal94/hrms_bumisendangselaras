import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/overtime_model.dart';
import '../../data/repositories/overtime_repository.dart';

class OvertimeApprovalsNotifier
    extends AsyncNotifier<List<OvertimeModel>> {
  @override
  Future<List<OvertimeModel>> build() =>
      ref.watch(overtimeRepositoryProvider).getOvertimeRequests(status: 'pending');

  Future<String?> approve(int id) async {
    try {
      await ref.read(overtimeRepositoryProvider).approveOvertime(id);
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> reject(int id, String reason) async {
    try {
      await ref.read(overtimeRepositoryProvider).rejectOvertime(id, reason);
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final overtimeApprovalsProvider =
    AsyncNotifierProvider<OvertimeApprovalsNotifier, List<OvertimeModel>>(
  OvertimeApprovalsNotifier.new,
);
