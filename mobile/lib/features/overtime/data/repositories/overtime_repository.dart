import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/overtime_remote_datasource.dart';
import '../models/overtime_model.dart';

final overtimeRepositoryProvider = Provider<OvertimeRepository>(
  (ref) => OvertimeRepository(ref.watch(overtimeRemoteDataSourceProvider)),
);

class OvertimeRepository {
  final OvertimeRemoteDataSource _ds;
  OvertimeRepository(this._ds);

  Future<List<OvertimeModel>> getMyOvertimes() => _ds.getMyOvertimes();

  Future<OvertimeModel> submitOvertime({
    required String date,
    required double overtimeHours,
    required String overtimeType,
    required String reason,
  }) =>
      _ds.submitOvertime(
        date: date,
        overtimeHours: overtimeHours,
        overtimeType: overtimeType,
        reason: reason,
      );

  Future<void> cancelOvertime(int id) => _ds.cancelOvertime(id);

  Future<List<OvertimeModel>> getOvertimeRequests({String? status}) =>
      _ds.getOvertimeRequests(status: status);

  Future<void> approveOvertime(int id) => _ds.approveOvertime(id);

  Future<void> rejectOvertime(int id, String reason) =>
      _ds.rejectOvertime(id, reason);
}
