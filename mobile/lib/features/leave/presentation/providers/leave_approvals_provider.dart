import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/leave_request_model.dart';
import '../../data/repositories/leave_repository.dart';

class LeaveApprovalsNotifier extends AsyncNotifier<List<LeaveRequestModel>> {
  @override
  Future<List<LeaveRequestModel>> build() =>
      ref.watch(leaveRepositoryProvider).getLeaveRequests(status: 'pending');

  Future<String?> approve(int id) async {
    try {
      await ref.read(leaveRepositoryProvider).approveLeave(id);
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }

  Future<String?> reject(int id, String reason) async {
    try {
      await ref.read(leaveRepositoryProvider).rejectLeave(id, reason);
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('ApiException: ', '');
    }
  }
}

final leaveApprovalsProvider =
    AsyncNotifierProvider<LeaveApprovalsNotifier, List<LeaveRequestModel>>(
        () => LeaveApprovalsNotifier());
