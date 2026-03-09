import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/leave_remote_datasource.dart';
import '../models/leave_quota_model.dart';
import '../models/leave_request_model.dart';
import '../models/leave_type_model.dart';

final leaveRepositoryProvider = Provider<LeaveRepository>(
  (ref) => LeaveRepository(ref.watch(leaveRemoteDataSourceProvider)),
);

class LeaveRepository {
  final LeaveRemoteDataSource _ds;
  LeaveRepository(this._ds);

  Future<List<LeaveTypeModel>> getLeaveTypes() => _ds.getLeaveTypes();
  Future<List<LeaveRequestModel>> getMyLeaves() => _ds.getMyLeaves();
  Future<List<LeaveQuotaModel>> getLeaveQuota() => _ds.getLeaveQuota();

  Future<LeaveRequestModel> applyLeave({
    required int leaveTypeId,
    required String startDate,
    required String endDate,
    required String reason,
  }) =>
      _ds.applyLeave(
          leaveTypeId: leaveTypeId, startDate: startDate, endDate: endDate, reason: reason);

  Future<void> cancelLeave(int id) => _ds.cancelLeave(id);

  // Admin / HR
  Future<List<LeaveRequestModel>> getLeaveRequests({String? status}) =>
      _ds.getLeaveRequests(status: status);
  Future<void> approveLeave(int id) => _ds.approveLeave(id);
  Future<void> rejectLeave(int id, String reason) => _ds.rejectLeave(id, reason);
}
