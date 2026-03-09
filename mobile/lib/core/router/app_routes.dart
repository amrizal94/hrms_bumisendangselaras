class AppRoutes {
  AppRoutes._();

  static const String splash         = '/';
  static const String login          = '/login';
  static const String dashboard      = '/dashboard';
  static const String adminDashboard   = '/dashboard/admin';
  static const String hrDashboard      = '/dashboard/hr';
  static const String staffDashboard   = '/dashboard/staff';
  static const String managerDashboard = '/dashboard/manager';
  static const String unauthorized      = '/unauthorized';
  static const String permissionSetup   = '/permission-setup';

  // Staff features
  static const String faceCheckin  = '/staff/face-checkin';
  static const String faceEnroll   = '/staff/face-enroll';
  static const String myAttendance = '/staff/attendance';
  static const String myLeaves     = '/staff/leaves';
  static const String applyLeave   = '/staff/leaves/apply';
  static const String myPayslips    = '/staff/payslips';
  static const String payslipDetail = '/staff/payslips/:id';
  static const String myOvertime     = '/staff/overtime';
  static const String submitOvertime = '/staff/overtime/submit';
  static const String holidays       = '/staff/holidays';
  static const String notifications  = '/staff/notifications';

  // Shift (staff)
  static const String myShift = '/staff/my-shift';

  // Task management (staff)
  static const String myTasks    = '/staff/tasks';
  static const String taskDetail = '/staff/tasks/:id';
  static const String createTask = '/staff/tasks/create';
  static const String capturePhoto    = '/staff/tasks/capture-photo';
  static const String taskFaceVerify  = '/staff/tasks/face-verify';

  // Profile (all roles)
  static const String profile = '/profile';

  // Announcements (all roles)
  static const String announcements       = '/announcements';
  static const String announcementDetail  = '/announcements/detail';

  // HR / Admin
  static const String leaveApprovals       = '/hr/leave-approvals';
  static const String overtimeApprovals    = '/hr/overtime-approvals';
  static const String attendanceRecords    = '/hr/attendance-records';
  static const String reports              = '/hr/reports';
  static const String faceManagement       = '/hr/face-management';
  static const String employeeList         = '/hr/employees';
  static const String employeeForm         = '/hr/employees/form';
  static const String faceAuditLog         = '/hr/face-audit-log';

  // Assets
  static const String myAssets    = '/staff/assets';
  static const String adminAssets = '/hr/assets';

  // Expenses
  static const String myExpenses      = '/staff/expenses';
  static const String submitExpense   = '/staff/expenses/submit';
  static const String expenseApprovals = '/hr/expense-approvals';

  // QR Attendance
  static const String qrScan      = '/staff/qr-scan';
  static const String qrGenerator = '/hr/qr-generator';

  // Meetings (all roles)
  static const String meetings      = '/meetings';
  static const String meetingDetail = '/meetings/detail';

  // Force password change
  static const String changePassword = '/change-password';
}
