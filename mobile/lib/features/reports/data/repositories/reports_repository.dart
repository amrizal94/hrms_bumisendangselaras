import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/reports_remote_datasource.dart';
import '../models/attendance_report_model.dart';
import '../models/leave_report_model.dart';
import '../models/overtime_report_model.dart';
import '../models/payroll_report_model.dart';
import '../models/reports_overview_model.dart';

final reportsRepositoryProvider = Provider<ReportsRepository>(
  (ref) => ReportsRepository(ref.watch(reportsRemoteDataSourceProvider)),
);

class ReportsRepository {
  final ReportsRemoteDataSource _ds;
  ReportsRepository(this._ds);

  Future<ReportsOverviewModel> getOverview() => _ds.getOverview();

  Future<AttendanceReportResult> getAttendanceReport(int year, int month) =>
      _ds.getAttendanceReport(year, month);

  Future<LeaveReportResult> getLeaveReport(int year) =>
      _ds.getLeaveReport(year);

  Future<PayrollReportResult> getPayrollReport(int year, int month) =>
      _ds.getPayrollReport(year, month);

  Future<OvertimeReportResult> getOvertimeReport(int year, int month) =>
      _ds.getOvertimeReport(year, month);
}
