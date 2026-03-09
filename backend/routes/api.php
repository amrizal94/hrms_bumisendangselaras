<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\ProfileController;
use App\Http\Controllers\Api\V1\AnnouncementController;
use App\Http\Controllers\Api\V1\MeetingController;
use App\Http\Controllers\Api\V1\QrAttendanceController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\ExpenseTypeController;
use App\Http\Controllers\Api\V1\AssetController;
use App\Http\Controllers\Api\V1\AssetCategoryController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\LabelController;
use App\Http\Controllers\Api\V1\LeaveRequestController;
use App\Http\Controllers\Api\V1\LeaveTypeController;
use App\Http\Controllers\Api\V1\FaceDataController;
use App\Http\Controllers\Api\V1\HolidayController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OvertimeController;
use App\Http\Controllers\Api\V1\PayrollController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\ShiftController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Finance\FinanceAccountController;
use App\Http\Controllers\Finance\FinanceCategoryController;
use App\Http\Controllers\Finance\FinanceDashboardController;
use App\Http\Controllers\Finance\FinanceExpenditureController;
use App\Http\Controllers\Finance\FinanceBudgetProjectController;
use App\Http\Controllers\Finance\FinanceIncomeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Public
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::prefix('auth')->group(function () {
            Route::post('/logout',          [AuthController::class, 'logout']);
            Route::get('/me',               [AuthController::class, 'me']);
            Route::put('/profile',          [ProfileController::class, 'update']);
            Route::delete('/profile',       [ProfileController::class, 'destroy']);
            Route::post('/change-password', [ProfileController::class, 'changePassword']);
            Route::put('/fcm-token',        [ProfileController::class, 'updateFcmToken']);
        });

        // Attendance — staff
        Route::prefix('attendance')->group(function () {
            Route::post('/check-in',  [AttendanceController::class, 'checkIn']);
            Route::post('/check-out', [AttendanceController::class, 'checkOut']);
            Route::get('/today',      [AttendanceController::class, 'today']);
            Route::get('/my',         [AttendanceController::class, 'myAttendance']);
            Route::get('/policy',     [AttendanceController::class, 'policy']);
            Route::post('/qr-scan',   [QrAttendanceController::class, 'scan']);
        });

        // Leave — staff
        Route::get('leave-types',        [LeaveTypeController::class, 'index']);
        Route::get('leave/my',           [LeaveRequestController::class, 'myLeaves']);
        Route::get('leave/quota',        [LeaveRequestController::class, 'quota']);
        Route::post('leave',             [LeaveRequestController::class, 'store']);
        Route::delete('leave/{leaveRequest}', [LeaveRequestController::class, 'destroy']);

        // Notifications — all authenticated
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);

        // Holidays — all authenticated (read-only)
        Route::get('holidays', [HolidayController::class, 'index']);
        Route::get('holidays/dates', [HolidayController::class, 'dates']);

        // Overtime — staff
        Route::post('overtime', [OvertimeController::class, 'store']);
        Route::get('overtime/my', [OvertimeController::class, 'myOvertime']);
        Route::delete('overtime/{overtime}', [OvertimeController::class, 'destroy']);

        // Payroll — staff
        Route::get('payroll/my', [PayrollController::class, 'myPayslips']);

        // Expense types — all authenticated (read-only)
        Route::get('expense-types', [ExpenseTypeController::class, 'index']);

        // Asset Management — staff read (my assets + categories list)
        // IMPORTANT: these specific routes must come BEFORE apiResource('assets') to avoid param conflict
        Route::get('assets/my', [AssetController::class, 'myAssets']);
        Route::get('asset-categories', [AssetCategoryController::class, 'index']);

        // Expenses — staff
        Route::get('expenses/my', [ExpenseController::class, 'myExpenses']);
        Route::post('expenses', [ExpenseController::class, 'store']);
        Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy']);

        // Tasks & Projects — all authenticated (read + staff create + complete)
        Route::get('labels',              [LabelController::class, 'index']);
        Route::get('projects',            [ProjectController::class, 'index']);
        Route::get('projects/{project}',  [ProjectController::class, 'show']);
        Route::get('tasks',               [TaskController::class, 'index']);
        Route::get('tasks/{task}',        [TaskController::class, 'show']);
        Route::post('tasks',              [TaskController::class, 'store']);
        Route::put('tasks/{task}',        [TaskController::class, 'update']);
        Route::post('tasks/{task}/complete', [TaskController::class, 'complete']);
        Route::patch('tasks/{task}/checklist/{item}/toggle', [TaskController::class, 'toggleChecklistItem']);

        // Face — all authenticated (check-in/out via face), rate-limited
        Route::middleware('throttle:face')->group(function () {
            Route::post('face/identify',         [FaceDataController::class, 'identify']);
            Route::post('face/attendance',       [FaceDataController::class, 'faceAttendance']);
            Route::post('face/attendance-image', [FaceDataController::class, 'faceAttendanceImage']);
            Route::post('face/self-enroll-image',[FaceDataController::class, 'selfEnrollImage']);
            Route::post('face/self-enroll',      [FaceDataController::class, 'selfEnroll']);
        });
        // Face — enrollment status for current user
        Route::get('face/me', [FaceDataController::class, 'myStatus']);

        // Announcements — all authenticated (read), admin|hr (write)
        Route::get('announcements', [AnnouncementController::class, 'index']);
        Route::get('announcements/{announcement}', [AnnouncementController::class, 'show']);

        // Meetings — specific routes BEFORE parameterized /{meeting}
        Route::get('meetings/my', [MeetingController::class, 'my']);
        Route::get('meetings',    [MeetingController::class, 'index']);
        Route::get('meetings/{meeting}',       [MeetingController::class, 'show']);
        Route::post('meetings/{meeting}/rsvp', [MeetingController::class, 'rsvp']);

        // Shifts — any authenticated user can view their own shift
        Route::get('my-shift', [ShiftController::class, 'myShift']);

        // Admin, HR & Manager (everything except payroll and settings)
        Route::middleware('role:admin|hr|manager|director')->group(function () {
            // Labels
            Route::post('labels',           [LabelController::class, 'store']);
            Route::put('labels/{label}',    [LabelController::class, 'update']);
            Route::delete('labels/{label}', [LabelController::class, 'destroy']);

            // Projects
            Route::post('projects',             [ProjectController::class, 'store']);
            Route::put('projects/{project}',    [ProjectController::class, 'update']);
            Route::delete('projects/{project}', [ProjectController::class, 'destroy']);

            // Tasks
            Route::delete('tasks/{task}',                               [TaskController::class, 'destroy']);
            Route::post('tasks/{task}/checklist',                       [TaskController::class, 'addChecklistItem']);
            Route::delete('tasks/{task}/checklist/{item}',              [TaskController::class, 'deleteChecklistItem']);

            Route::apiResource('departments', DepartmentController::class);
            Route::apiResource('shifts',      ShiftController::class);

            // Employees — read-only for manager (sensitive fields scoped in EmployeeResource)
            Route::get('employees',            [EmployeeController::class, 'index']);
            Route::get('employees/{employee}', [EmployeeController::class, 'show']);

            // Attendance management — specific routes BEFORE apiResource to avoid param conflicts
            Route::get('attendance/summary',                                   [AttendanceController::class, 'summary']);
            Route::get('attendance/qr-sessions',                               [QrAttendanceController::class, 'index']);
            Route::post('attendance/qr-sessions',                              [QrAttendanceController::class, 'generate']);
            Route::post('attendance/qr-sessions/{session}/deactivate',        [QrAttendanceController::class, 'deactivate']);
            Route::apiResource('attendance',  AttendanceController::class);

            // Leave management
            Route::get('leave',                         [LeaveRequestController::class, 'index']);
            Route::get('leave/{leaveRequest}',          [LeaveRequestController::class, 'show']);
            Route::post('leave/{leaveRequest}/approve', [LeaveRequestController::class, 'approve']);
            Route::post('leave/{leaveRequest}/reject',  [LeaveRequestController::class, 'reject']);
            Route::post('leave-types',                  [LeaveTypeController::class, 'store']);
            Route::put('leave-types/{leaveType}',       [LeaveTypeController::class, 'update']);
            Route::delete('leave-types/{leaveType}',    [LeaveTypeController::class, 'destroy']);

            // Holiday management
            Route::post('holidays', [HolidayController::class, 'store']);
            Route::put('holidays/{holiday}', [HolidayController::class, 'update']);
            Route::delete('holidays/{holiday}', [HolidayController::class, 'destroy']);

            // Overtime management
            Route::get('overtime/summary', [OvertimeController::class, 'summary']);
            Route::get('overtime', [OvertimeController::class, 'index']);
            Route::get('overtime/{overtime}', [OvertimeController::class, 'show']);
            Route::put('overtime/{overtime}', [OvertimeController::class, 'update']);
            Route::post('overtime/{overtime}/approve', [OvertimeController::class, 'approve']);
            Route::post('overtime/{overtime}/reject', [OvertimeController::class, 'reject']);

            // Reports
            Route::prefix('reports')->group(function () {
                Route::get('overview',          [ReportController::class, 'overview']);
                Route::get('attendance',        [ReportController::class, 'attendance']);
                Route::get('leave',             [ReportController::class, 'leave']);
                Route::get('payroll',           [ReportController::class, 'payroll']);
                Route::get('overtime',          [ReportController::class, 'overtime']);
                Route::get('daily-trend',       [ReportController::class, 'dailyTrend']);
                Route::get('department-today',  [ReportController::class, 'departmentToday']);
            });

            // Face enrollment management
            Route::get('face',                    [FaceDataController::class, 'index']);
            Route::post('face/enroll',            [FaceDataController::class, 'enroll']);
            Route::post('face/enroll-image',      [FaceDataController::class, 'enrollImage']);
            Route::delete('face/{faceData}',      [FaceDataController::class, 'destroy']);

            // Announcements management
            Route::post('announcements', [AnnouncementController::class, 'store']);
            Route::put('announcements/{announcement}', [AnnouncementController::class, 'update']);
            Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy']);

            // Meetings management
            Route::post('meetings',              [MeetingController::class, 'store']);
            Route::put('meetings/{meeting}',     [MeetingController::class, 'update']);
            Route::delete('meetings/{meeting}',  [MeetingController::class, 'destroy']);
            Route::get('meetings/{meeting}/rsvps', [MeetingController::class, 'rsvpList']);

            // Audit logs
            Route::get('audit-logs', [AuditLogController::class, 'index']);

            // Expenses
            Route::get('expenses', [ExpenseController::class, 'index']);
            Route::get('expenses/{expense}', [ExpenseController::class, 'show']);
            Route::post('expenses/{expense}/approve', [ExpenseController::class, 'approve']);
            Route::post('expenses/{expense}/reject', [ExpenseController::class, 'reject']);

            // Expense types management (write)
            Route::post('expense-types', [ExpenseTypeController::class, 'store']);
            Route::put('expense-types/{expenseType}', [ExpenseTypeController::class, 'update']);
            Route::delete('expense-types/{expenseType}', [ExpenseTypeController::class, 'destroy']);

            // Asset Management (admin/hr/manager/director)
            // IMPORTANT: specific routes must come BEFORE apiResource to avoid param conflict
            Route::get('assets/export', [AssetController::class, 'export']);
            Route::get('assets/stats', [AssetController::class, 'stats']);
            Route::apiResource('assets', AssetController::class);
            Route::post('assets/{asset}/assign', [AssetController::class, 'assign']);
            Route::post('assets/{asset}/return', [AssetController::class, 'returnAsset']);
            Route::post('assets/{asset}/dispose', [AssetController::class, 'dispose']);

            Route::apiResource('asset-categories', AssetCategoryController::class)->except(['index']);
        });

        // Finance Module — Admin & Director only
        Route::middleware('role:admin|director')->prefix('finance')->group(function () {
            Route::get('dashboard', [FinanceDashboardController::class, 'index']);

            // Accounts — summary must come BEFORE apiResource to avoid param conflict
            Route::get('accounts/summary', [FinanceAccountController::class, 'summary']);
            Route::apiResource('accounts', FinanceAccountController::class);

            Route::apiResource('categories', FinanceCategoryController::class);

            // Incomes
            Route::post('incomes/{id}/approve', [FinanceIncomeController::class, 'approve']);
            Route::post('incomes/{id}/reject',  [FinanceIncomeController::class, 'reject']);
            Route::apiResource('incomes', FinanceIncomeController::class);

            // Budget Projects
            Route::post('budget-projects/{id}/complete', [FinanceBudgetProjectController::class, 'complete']);
            Route::apiResource('budget-projects', FinanceBudgetProjectController::class);

            // Expenditures
            Route::post('expenditures/{id}/approve', [FinanceExpenditureController::class, 'approve']);
            Route::post('expenditures/{id}/reject',  [FinanceExpenditureController::class, 'reject']);
            Route::apiResource('expenditures', FinanceExpenditureController::class);
        });

        // Admin, HR & Director only (employee write + payroll + settings)
        Route::middleware('role:admin|hr|director')->group(function () {
            // Employees — write operations (create/update/delete/toggle)
            Route::post('employees',                           [EmployeeController::class, 'store']);
            Route::put('employees/{employee}',                 [EmployeeController::class, 'update']);
            Route::delete('employees/{employee}',              [EmployeeController::class, 'destroy']);
            Route::patch('employees/{employee}/toggle-active', [EmployeeController::class, 'toggleActive']);
            // Settings
            Route::get('settings',  [SettingController::class, 'index']);
            Route::put('settings',  [SettingController::class, 'update']);

            // Payroll management
            Route::get('payroll/summary',               [PayrollController::class, 'summary']);
            Route::post('payroll/generate',             [PayrollController::class, 'generate']);
            Route::post('payroll/finalize-all',         [PayrollController::class, 'finalizeAll']);
            Route::post('payroll/mark-all-paid',        [PayrollController::class, 'markAllPaid']);
            Route::get('payroll',                       [PayrollController::class, 'index']);
            Route::get('payroll/{payroll}',             [PayrollController::class, 'show']);
            Route::put('payroll/{payroll}',             [PayrollController::class, 'update']);
            Route::delete('payroll/{payroll}',          [PayrollController::class, 'destroy']);
            Route::post('payroll/{payroll}/finalize',   [PayrollController::class, 'finalize']);
            Route::post('payroll/{payroll}/mark-paid',  [PayrollController::class, 'markPaid']);
        });
    });
});
