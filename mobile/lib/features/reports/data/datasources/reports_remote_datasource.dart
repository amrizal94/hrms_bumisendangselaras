import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/attendance_report_model.dart';
import '../models/leave_report_model.dart';
import '../models/overtime_report_model.dart';
import '../models/payroll_report_model.dart';
import '../models/reports_overview_model.dart';

final reportsRemoteDataSourceProvider = Provider<ReportsRemoteDataSource>(
  (ref) => ReportsRemoteDataSource(ref.watch(dioClientProvider)),
);

class ReportsRemoteDataSource {
  final Dio _dio;
  ReportsRemoteDataSource(this._dio);

  Future<ReportsOverviewModel> getOverview() async {
    try {
      final res = await _dio.get(ApiConstants.reportsOverview);
      final data = res.data['data'] as Map<String, dynamic>;
      return ReportsOverviewModel.fromJson(data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<AttendanceReportResult> getAttendanceReport(int year, int month) async {
    try {
      final res = await _dio.get(
        ApiConstants.reportsAttendance,
        queryParameters: {'year': year, 'month': month},
      );
      final rows = (res.data['data'] as List)
          .map((e) => AttendanceReportRow.fromJson(e as Map<String, dynamic>))
          .toList();
      final meta = res.data['meta'] as Map<String, dynamic>;
      return AttendanceReportResult(
        rows: rows,
        workingDays: (meta['working_days'] as num?)?.toInt() ?? 0,
        year: year,
        month: month,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<LeaveReportResult> getLeaveReport(int year) async {
    try {
      final res = await _dio.get(
        ApiConstants.reportsLeave,
        queryParameters: {'year': year},
      );
      final rows = (res.data['data'] as List)
          .map((e) => LeaveReportRow.fromJson(e as Map<String, dynamic>))
          .toList();
      return LeaveReportResult(rows: rows, year: year);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<PayrollReportResult> getPayrollReport(int year, int month) async {
    try {
      final res = await _dio.get(
        ApiConstants.reportsPayroll,
        queryParameters: {'year': year, 'month': month},
      );
      final rows = (res.data['data'] as List)
          .map((e) => PayrollReportRow.fromJson(e as Map<String, dynamic>))
          .toList();
      final meta = (res.data['meta'] as Map<String, dynamic>)['totals']
          as Map<String, dynamic>;
      return PayrollReportResult(
        rows: rows,
        totalGross: (meta['total_gross'] as num?)?.toDouble() ?? 0,
        totalNet: (meta['total_net'] as num?)?.toDouble() ?? 0,
        totalDeductions: (meta['total_deductions'] as num?)?.toDouble() ?? 0,
        countDraft: (meta['count_draft'] as num?)?.toInt() ?? 0,
        countFinalized: (meta['count_finalized'] as num?)?.toInt() ?? 0,
        countPaid: (meta['count_paid'] as num?)?.toInt() ?? 0,
        year: year,
        month: month,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<OvertimeReportResult> getOvertimeReport(int year, int month) async {
    try {
      final res = await _dio.get(
        ApiConstants.reportsOvertime,
        queryParameters: {'year': year, 'month': month},
      );
      final rows = (res.data['data'] as List)
          .map((e) => OvertimeReportRow.fromJson(e as Map<String, dynamic>))
          .toList();
      final meta = res.data['meta'] as Map<String, dynamic>;
      return OvertimeReportResult(
        rows: rows,
        totalApprovedHours:
            (meta['total_approved_hours'] as num?)?.toDouble() ?? 0,
        totalPending: (meta['total_pending'] as num?)?.toInt() ?? 0,
        year: year,
        month: month,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
