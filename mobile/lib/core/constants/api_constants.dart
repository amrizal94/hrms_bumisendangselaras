class ApiConstants {
  ApiConstants._();

  // Base URL
  // DEV  (tunnel)    : https://apihrm.amrzaki.online/api/v1
  // DEV  (emulator)  : http://10.0.2.2/api/v1
  // DEV  (real device): http://<your-machine-ip>/api/v1
  // PROD             : https://hrms.bumisendangselaras.co.id/api/v1
  static const String baseUrl = 'https://hrms.bumisendangselaras.co.id/api/v1';

  // Auth
  static const String login    = '/auth/login';
  static const String logout   = '/auth/logout';
  static const String me       = '/auth/me';
  static const String profile         = '/auth/profile';
  static const String changePassword  = '/auth/change-password';
  static const String fcmToken        = '/auth/fcm-token';

  // Attendance
  static const String attendanceCheckIn  = '/attendance/check-in';
  static const String attendanceCheckOut = '/attendance/check-out';
  static const String attendanceToday    = '/attendance/today';
  static const String attendanceMy       = '/attendance/my';
  static const String attendancePolicy   = '/attendance/policy';
  static const String attendance         = '/attendance';
  static const String attendanceQrScan   = '/attendance/qr-scan';
  static const String attendanceQrSessions = '/attendance/qr-sessions';

  // Leave
  static const String leaveTypes = '/leave-types';
  static const String leaveMy    = '/leave/my';
  static const String leaveQuota = '/leave/quota';
  static const String leave      = '/leave';

  // Overtime
  static const String overtimeMy = '/overtime/my';
  static const String overtime    = '/overtime';

  // Holiday
  static const String holidays = '/holidays';

  // Notifications
  static const String notifications       = '/notifications';
  static const String notificationsReadAll = '/notifications/read-all';

  // Face recognition
  static const String faceAttendanceImage = '/face/attendance-image';
  static const String faceMe              = '/face/me';
  static const String faceSelfEnroll      = '/face/self-enroll-image';
  static const String faceAdmin           = '/face';

  // Employees
  static const String employees   = '/employees';
  static const String departments = '/departments';
  static const String shifts      = '/shifts';

  // Payroll (staff)
  static const String payrollMy = '/payroll/my';

  // Shifts
  static const String myShift = '/my-shift';

  // Announcements
  static const String announcements = '/announcements';

  // Audit logs
  static const String auditLogs = '/audit-logs';

  // Expenses
  static const String expenses     = '/expenses';
  static const String myExpenses   = '/expenses/my';
  static const String expenseTypes = '/expense-types';

  // Meetings
  static const String meetings   = '/meetings';
  static const String myMeetings = '/meetings/my';

  // Tasks & Projects
  static const String projects          = '/projects';
  static const String tasks             = '/tasks';
  static const String projectsForTask   = '/projects?for_task_creation=1&status=active';
  static String completeTask(int id)    => '/tasks/$id/complete';

  // Assets
  static const String myAssets       = '/assets/my';
  static const String assets         = '/assets';
  static const String assetStats     = '/assets/stats';
  static const String assetCategories = '/asset-categories';

  // Reports
  static const String reportsOverview    = '/reports/overview';
  static const String reportsAttendance  = '/reports/attendance';
  static const String reportsLeave       = '/reports/leave';
  static const String reportsPayroll     = '/reports/payroll';
  static const String reportsOvertime    = '/reports/overtime';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
