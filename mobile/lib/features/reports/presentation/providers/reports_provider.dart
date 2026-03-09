import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/attendance_report_model.dart';
import '../../data/models/leave_report_model.dart';
import '../../data/models/overtime_report_model.dart';
import '../../data/models/payroll_report_model.dart';
import '../../data/models/reports_overview_model.dart';
import '../../data/repositories/reports_repository.dart';

final reportsOverviewProvider = FutureProvider<ReportsOverviewModel>(
  (ref) => ref.watch(reportsRepositoryProvider).getOverview(),
);

final attendanceReportProvider =
    FutureProvider.family<AttendanceReportResult, ({int year, int month})>(
  (ref, p) =>
      ref.watch(reportsRepositoryProvider).getAttendanceReport(p.year, p.month),
);

final leaveReportProvider = FutureProvider.family<LeaveReportResult, int>(
  (ref, year) => ref.watch(reportsRepositoryProvider).getLeaveReport(year),
);

final payrollReportProvider =
    FutureProvider.family<PayrollReportResult, ({int year, int month})>(
  (ref, p) =>
      ref.watch(reportsRepositoryProvider).getPayrollReport(p.year, p.month),
);

final overtimeReportProvider =
    FutureProvider.family<OvertimeReportResult, ({int year, int month})>(
  (ref, p) =>
      ref.watch(reportsRepositoryProvider).getOvertimeReport(p.year, p.month),
);
