import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/leave_quota_model.dart';
import '../../data/models/leave_request_model.dart';
import '../../data/models/leave_type_model.dart';
import '../../data/repositories/leave_repository.dart';

final leaveTypesProvider = FutureProvider<List<LeaveTypeModel>>(
  (ref) => ref.watch(leaveRepositoryProvider).getLeaveTypes(),
);

final leaveQuotaProvider = FutureProvider<List<LeaveQuotaModel>>(
  (ref) => ref.watch(leaveRepositoryProvider).getLeaveQuota(),
);

class MyLeavesNotifier extends AsyncNotifier<List<LeaveRequestModel>> {
  @override
  Future<List<LeaveRequestModel>> build() =>
      ref.watch(leaveRepositoryProvider).getMyLeaves();

  Future<String?> applyLeave({
    required int leaveTypeId,
    required String startDate,
    required String endDate,
    required String reason,
  }) async {
    try {
      await ref.read(leaveRepositoryProvider).applyLeave(
            leaveTypeId: leaveTypeId,
            startDate: startDate,
            endDate: endDate,
            reason: reason,
          );
      ref.invalidateSelf();
      ref.invalidate(leaveQuotaProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> cancelLeave(int id) async {
    try {
      await ref.read(leaveRepositoryProvider).cancelLeave(id);
      ref.invalidateSelf();
      ref.invalidate(leaveQuotaProvider);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final myLeavesProvider =
    AsyncNotifierProvider<MyLeavesNotifier, List<LeaveRequestModel>>(() => MyLeavesNotifier());
