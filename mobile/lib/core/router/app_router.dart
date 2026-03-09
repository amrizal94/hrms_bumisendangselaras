import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../services/push_notification_service.dart';

import '../../features/attendance/presentation/screens/attendance_records_screen.dart';
import '../../features/attendance/presentation/screens/my_attendance_screen.dart';
import '../../features/face/presentation/screens/face_camera_screen.dart';
import '../../features/face/presentation/screens/face_self_enroll_screen.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/dashboard/presentation/screens/admin_dashboard.dart';
import '../../features/dashboard/presentation/screens/hr_dashboard.dart';
import '../../features/dashboard/presentation/screens/manager_dashboard.dart';
import '../../features/dashboard/presentation/screens/staff_dashboard.dart';
import '../../features/holiday/presentation/screens/holidays_screen.dart';
import '../../features/leave/presentation/screens/apply_leave_screen.dart';
import '../../features/leave/presentation/screens/leave_approvals_screen.dart';
import '../../features/overtime/presentation/screens/overtime_approvals_screen.dart';
import '../../features/leave/presentation/screens/my_leaves_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/overtime/presentation/screens/my_overtime_screen.dart';
import '../../features/overtime/presentation/screens/submit_overtime_screen.dart';
import '../../features/payslip/data/models/payslip_model.dart';
import '../../features/payslip/presentation/screens/payslip_detail_screen.dart';
import '../../features/payslip/presentation/screens/payslip_list_screen.dart';
import '../../features/reports/presentation/screens/reports_screen.dart';
import '../../features/auth/presentation/screens/profile_screen.dart';
import '../../features/shift/presentation/screens/my_shift_screen.dart';
import '../../features/announcement/data/models/announcement_model.dart';
import '../../features/announcement/presentation/screens/announcement_detail_screen.dart';
import '../../features/announcement/presentation/screens/announcements_list_screen.dart';
import '../../features/tasks/presentation/screens/my_tasks_screen.dart';
import '../../features/tasks/presentation/screens/task_detail_screen.dart';
import '../../features/tasks/presentation/screens/create_task_screen.dart';
import '../../features/tasks/presentation/screens/task_face_verify_screen.dart';
import '../../features/tasks/presentation/screens/task_photo_capture_screen.dart';
import '../../features/attendance/presentation/screens/qr_generator_screen.dart';
import '../../features/attendance/presentation/screens/qr_scan_screen.dart';
import '../../features/expense/presentation/screens/expense_approvals_screen.dart';
import '../../features/expense/presentation/screens/my_expenses_screen.dart';
import '../../features/expense/presentation/screens/submit_expense_screen.dart';
import '../../features/face/presentation/screens/face_audit_log_screen.dart';
import '../../features/face/presentation/screens/face_management_screen.dart';
import '../../features/employee/presentation/screens/employee_list_screen.dart';
import '../../features/employee/presentation/screens/employee_form_screen.dart';
import '../../features/meeting/data/models/meeting_model.dart';
import '../../features/meeting/presentation/screens/meeting_detail_screen.dart';
import '../../features/meeting/presentation/screens/meetings_screen.dart';
import '../../features/auth/presentation/screens/change_password_screen.dart';
import '../../features/asset/presentation/screens/my_assets_screen.dart';
import '../../features/asset/presentation/screens/admin_assets_screen.dart';
import '../constants/app_constants.dart';
import '../../features/onboarding/presentation/screens/permission_setup_screen.dart';
import 'app_routes.dart';

final appNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authNotifierProvider);
  final setupDone = ref.watch(permissionSetupDoneProvider);

  final router = GoRouter(
    navigatorKey: appNavigatorKey,
    initialLocation: AppRoutes.splash,
    redirect: (context, state) {
      final isAuthenticated = authState is AuthAuthenticated;
      final isCheckingSession =
          authState is AuthInitial || authState is AuthCheckingSession;
      final isSubmittingAuth = authState is AuthSubmittingLogin;
      final isLoginRoute  = state.matchedLocation == AppRoutes.login;
      final isSplashRoute = state.matchedLocation == AppRoutes.splash;

      // Only show splash while checking stored auth/token on app startup.
      if (isCheckingSession) return isSplashRoute ? null : AppRoutes.splash;

      // While login submit is in progress, stay on login (avoid flicker to splash).
      if (isSubmittingAuth && isLoginRoute) return null;

      if (!isAuthenticated) {
        final isSetupRoute =
            state.matchedLocation == AppRoutes.permissionSetup;
        if (!setupDone) {
          return isSetupRoute ? null : AppRoutes.permissionSetup;
        }
        return isLoginRoute ? null : AppRoutes.login;
      }

      // Force password change before accessing any other screen
      if (authState case AuthAuthenticated(:final user)) {
        final isChangePasswordRoute =
            state.matchedLocation == AppRoutes.changePassword;
        if (user.mustChangePassword && !isChangePasswordRoute) {
          return AppRoutes.changePassword;
        }
        if (!user.mustChangePassword && isChangePasswordRoute) {
          return _dashboardForRole(user.role);
        }
      }

      if (isLoginRoute || isSplashRoute) {
        if (authState case AuthAuthenticated(:final user)) {
          return _dashboardForRole(user.role);
        }
      }
      return null;
    },
    routes: [
      GoRoute(path: AppRoutes.splash,          builder: (_, __) => const _SplashScreen()),
      GoRoute(path: AppRoutes.login,           builder: (_, __) => const LoginScreen()),
      GoRoute(path: AppRoutes.permissionSetup, builder: (_, __) => const PermissionSetupScreen()),
      GoRoute(path: AppRoutes.changePassword,  builder: (_, __) => const ChangePasswordScreen()),

      // Admin
      GoRoute(
        path: AppRoutes.adminDashboard,
        builder: (_, __) => const AdminDashboardScreen(),
        redirect: (context, state) {
          final as = ProviderScope.containerOf(context).read(authNotifierProvider);
          if (as is AuthAuthenticated &&
            as.user.role != AppConstants.roleAdmin &&
            as.user.role != AppConstants.roleDirector) {
            return AppRoutes.unauthorized;
          }
          return null;
        },
      ),

      // HR
      GoRoute(
        path: AppRoutes.hrDashboard,
        builder: (_, __) => const HRDashboardScreen(),
        redirect: (context, state) {
          final as = ProviderScope.containerOf(context).read(authNotifierProvider);
          if (as is AuthAuthenticated) {
            final r = as.user.role;
            if (r != AppConstants.roleHR && r != AppConstants.roleAdmin) {
              return AppRoutes.unauthorized;
            }
          }
          return null;
        },
      ),

      // Manager
      GoRoute(
        path: AppRoutes.managerDashboard,
        builder: (_, __) => const ManagerDashboardScreen(),
        redirect: (context, state) {
          final as = ProviderScope.containerOf(context).read(authNotifierProvider);
          if (as is AuthAuthenticated) {
            final r = as.user.role;
            if (r != AppConstants.roleManager && r != AppConstants.roleAdmin) {
              return AppRoutes.unauthorized;
            }
          }
          return null;
        },
      ),

      // Staff
      GoRoute(path: AppRoutes.staffDashboard, builder: (_, __) => const StaffDashboardScreen()),

      // Staff features
      GoRoute(
        path: AppRoutes.faceCheckin,
        builder: (_, state) {
          final action = state.extra == 'check_out'
              ? FaceAction.checkOut
              : FaceAction.checkIn;
          return FaceCameraScreen(action: action);
        },
      ),
      GoRoute(
        path: AppRoutes.faceEnroll,
        builder: (_, __) => const FaceSelfEnrollScreen(),
      ),
      GoRoute(path: AppRoutes.myAttendance,  builder: (_, __) => const MyAttendanceScreen()),
      GoRoute(path: AppRoutes.myLeaves,      builder: (_, __) => const MyLeavesScreen()),
      GoRoute(path: AppRoutes.applyLeave,    builder: (_, __) => const ApplyLeaveScreen()),
      GoRoute(path: AppRoutes.myPayslips,    builder: (_, __) => const PayslipListScreen()),
      GoRoute(
        path: AppRoutes.payslipDetail,
        builder: (_, state) => PayslipDetailScreen(slip: state.extra as PayslipModel),
      ),
      GoRoute(path: AppRoutes.myOvertime,    builder: (_, __) => const MyOvertimeScreen()),
      GoRoute(path: AppRoutes.submitOvertime, builder: (_, __) => const SubmitOvertimeScreen()),
      GoRoute(path: AppRoutes.holidays,      builder: (_, __) => const HolidaysScreen()),
      GoRoute(path: AppRoutes.notifications, builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: AppRoutes.myShift,       builder: (_, __) => const MyShiftScreen()),
      GoRoute(path: AppRoutes.myTasks,       builder: (_, __) => const MyTasksScreen()),
      GoRoute(path: AppRoutes.createTask,    builder: (_, __) => const CreateTaskScreen()),
      GoRoute(path: AppRoutes.capturePhoto,   builder: (_, __) => const TaskPhotoCaptureScreen()),
      GoRoute(path: AppRoutes.taskFaceVerify, builder: (_, __) => const TaskFaceVerifyScreen()),
      GoRoute(
        path: AppRoutes.taskDetail,
        builder: (_, state) => TaskDetailScreen(taskId: state.extra as int),
      ),
      GoRoute(path: AppRoutes.profile,       builder: (_, __) => const ProfileScreen()),
      GoRoute(path: AppRoutes.announcements, builder: (_, __) => const AnnouncementsListScreen()),
      GoRoute(
        path: AppRoutes.announcementDetail,
        builder: (_, state) => AnnouncementDetailScreen(
          announcement: state.extra as AnnouncementModel,
        ),
      ),

      // Meeting routes (all roles)
      GoRoute(path: AppRoutes.meetings,      builder: (_, __) => const MeetingsScreen()),
      GoRoute(
        path: AppRoutes.meetingDetail,
        builder: (_, state) => MeetingDetailScreen(meeting: state.extra as MeetingModel),
      ),

      // Asset routes
      GoRoute(path: AppRoutes.myAssets,    builder: (_, __) => const MyAssetsScreen()),
      GoRoute(path: AppRoutes.adminAssets, builder: (_, __) => const AdminAssetsScreen()),

      // Expense routes
      GoRoute(path: AppRoutes.myExpenses,       builder: (_, __) => const MyExpensesScreen()),
      GoRoute(path: AppRoutes.submitExpense,    builder: (_, __) => const SubmitExpenseScreen()),
      GoRoute(path: AppRoutes.expenseApprovals, builder: (_, __) => const ExpenseApprovalsScreen()),

      // QR Attendance routes
      GoRoute(path: AppRoutes.qrScan,      builder: (_, __) => const QrScanScreen()),
      GoRoute(path: AppRoutes.qrGenerator, builder: (_, __) => const QrGeneratorScreen()),

      // HR / Admin
      GoRoute(path: AppRoutes.leaveApprovals,    builder: (_, __) => const LeaveApprovalsScreen()),
      GoRoute(path: AppRoutes.overtimeApprovals, builder: (_, __) => const OvertimeApprovalsScreen()),
      GoRoute(path: AppRoutes.attendanceRecords, builder: (_, __) => const AttendanceRecordsScreen()),
      GoRoute(path: AppRoutes.reports,           builder: (_, __) => const ReportsScreen()),
      GoRoute(path: AppRoutes.faceManagement,    builder: (_, __) => const FaceManagementScreen()),
      GoRoute(path: AppRoutes.faceAuditLog,      builder: (_, __) => const FaceAuditLogScreen()),
      GoRoute(path: AppRoutes.employeeList,      builder: (_, __) => const EmployeeListScreen()),
      GoRoute(
        path: AppRoutes.employeeForm,
        builder: (_, state) => EmployeeFormScreen(employeeId: state.extra as int?),
      ),

      GoRoute(path: AppRoutes.unauthorized, builder: (_, __) => const _UnauthorizedScreen()),
    ],
  );

  PushNotificationService.setRouter(router);
  return router;
});

String _dashboardForRole(String role) => switch (role) {
      AppConstants.roleAdmin    => AppRoutes.adminDashboard,
      AppConstants.roleDirector => AppRoutes.adminDashboard,
      AppConstants.roleHR       => AppRoutes.hrDashboard,
      AppConstants.roleManager  => AppRoutes.managerDashboard,
      _                         => AppRoutes.staffDashboard,
    };

// ── Splash ────────────────────────────────────────────────────────────────────
class _SplashScreen extends ConsumerStatefulWidget {
  const _SplashScreen();

  @override
  ConsumerState<_SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<_SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(authNotifierProvider.notifier).checkAuthStatus();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('assets/images/logo.png', width: 80, height: 80),
            const SizedBox(height: 16),
            Text(AppConstants.appName,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 32),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}

// ── Unauthorized ──────────────────────────────────────────────────────────────
class _UnauthorizedScreen extends StatelessWidget {
  const _UnauthorizedScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Unauthorized')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock_outline, size: 80, color: Colors.red),
            const SizedBox(height: 16),
            const Text('Access Denied',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('You do not have permission to access this page.'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.login),
              child: const Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }
}
