<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\FaceData;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\PayrollRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    // ---------------------------------------------------------------
    // Overview: current-month snapshot for dashboard
    // ---------------------------------------------------------------
    public function overview(): JsonResponse
    {
        $now   = Carbon::now();
        $year  = $now->year;
        $month = $now->month;
        $today = $now->toDateString();

        $totalEmployees = Employee::where('status', 'active')->count();

        // Today attendance
        $presentToday = AttendanceRecord::whereDate('date', $today)
            ->whereIn('status', ['present', 'late'])
            ->count();
        $lateToday = AttendanceRecord::whereDate('date', $today)
            ->where('status', 'late')
            ->count();

        // This month attendance stats
        $monthRecords = AttendanceRecord::whereYear('date', $year)
            ->whereMonth('date', $month)
            ->selectRaw("status, count(*) as cnt")
            ->groupBy('status')
            ->pluck('cnt', 'status');

        // Pending leaves, overtimes, expenses
        $pendingLeaves    = LeaveRequest::where('status', 'pending')->count();
        $pendingOvertimes = OvertimeRequest::where('status', 'pending')->count();
        $pendingExpenses  = Expense::where('status', 'pending')->count();

        // This month payroll totals
        $payrollSummary = PayrollRecord::where('period_year', $year)
            ->where('period_month', $month)
            ->selectRaw('count(*) as total, sum(net_salary) as total_net, sum(gross_salary) as total_gross')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'total_employees' => $totalEmployees,
                'today' => [
                    'present' => $presentToday,
                    'late'    => $lateToday,
                    'absent'  => max(0, $totalEmployees - $presentToday),
                ],
                'month_attendance' => [
                    'present'  => (int) ($monthRecords['present'] ?? 0),
                    'late'     => (int) ($monthRecords['late'] ?? 0),
                    'absent'   => (int) ($monthRecords['absent'] ?? 0),
                    'on_leave' => (int) ($monthRecords['on_leave'] ?? 0),
                ],
                'pending_leaves'    => $pendingLeaves,
                'pending_overtimes' => $pendingOvertimes,
                'pending_expenses'  => $pendingExpenses,
                'payroll' => [
                    'total_records' => (int) ($payrollSummary->total ?? 0),
                    'total_gross'   => (float) ($payrollSummary->total_gross ?? 0),
                    'total_net'     => (float) ($payrollSummary->total_net ?? 0),
                ],
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Attendance report: per-employee summary for a period
    // GET /reports/attendance?year=&month=&department_id=
    // ---------------------------------------------------------------
    public function attendance(Request $request): JsonResponse
    {
        $year  = $request->integer('year', Carbon::now()->year);
        $month = $request->integer('month', Carbon::now()->month);

        $query = Employee::query()
            ->with(['user', 'department'])
            ->where('status', 'active');

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }

        $employees = $query->orderBy('employee_number')->get();

        // Working days for this period (Mon-Fri)
        $workingDays = PayrollRecord::countWorkingDays($year, $month);

        $rows = $employees->map(function (Employee $emp) use ($year, $month, $workingDays) {
            $records = AttendanceRecord::where('employee_id', $emp->id)
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->selectRaw("status, count(*) as cnt, sum(work_hours) as total_hours")
                ->groupBy('status')
                ->pluck('cnt', 'status');

            $presentDays = (int) ($records['present'] ?? 0);
            $lateDays    = (int) ($records['late'] ?? 0);
            $leaveDays   = (int) ($records['on_leave'] ?? 0);
            $presentTotal = $presentDays + $lateDays;
            $absentDays   = max(0, $workingDays - $presentTotal - $leaveDays);

            $totalHours = AttendanceRecord::where('employee_id', $emp->id)
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->sum('work_hours');

            return [
                'employee_id'     => $emp->id,
                'employee_number' => $emp->employee_number,
                'name'            => $emp->user->name,
                'department'      => $emp->department?->name,
                'working_days'    => $workingDays,
                'present_days'    => $presentDays,
                'late_days'       => $lateDays,
                'leave_days'      => $leaveDays,
                'absent_days'     => $absentDays,
                'total_hours'     => round((float) $totalHours, 2),
                'attendance_rate' => $workingDays > 0
                    ? round(($presentTotal / $workingDays) * 100, 1)
                    : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $rows,
            'meta'    => [
                'year'         => $year,
                'month'        => $month,
                'working_days' => $workingDays,
                'total_employees' => $employees->count(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Leave report: per-employee leave usage for a year
    // GET /reports/leave?year=&department_id=&leave_type_id=
    // ---------------------------------------------------------------
    public function leave(Request $request): JsonResponse
    {
        $year = $request->integer('year', Carbon::now()->year);

        $query = Employee::query()
            ->with(['user', 'department'])
            ->where('status', 'active');

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }

        $employees = $query->orderBy('employee_number')->get();

        $rows = $employees->map(function (Employee $emp) use ($year, $request) {
            $leaveQuery = LeaveRequest::where('employee_id', $emp->id)
                ->whereYear('start_date', $year);

            if ($request->filled('leave_type_id')) {
                $leaveQuery->where('leave_type_id', $request->integer('leave_type_id'));
            }

            $byStatus = $leaveQuery->clone()
                ->selectRaw("status, sum(total_days) as days, count(*) as cnt")
                ->groupBy('status')
                ->get()
                ->keyBy('status');

            $byType = $leaveQuery->clone()
                ->with('leaveType')
                ->where('status', 'approved')
                ->selectRaw("leave_type_id, sum(total_days) as days")
                ->groupBy('leave_type_id')
                ->get()
                ->map(fn($r) => [
                    'leave_type_id'   => $r->leave_type_id,
                    'leave_type_name' => $r->leaveType?->name,
                    'days_used'       => (int) $r->days,
                ]);

            return [
                'employee_id'     => $emp->id,
                'employee_number' => $emp->employee_number,
                'name'            => $emp->user->name,
                'department'      => $emp->department?->name,
                'approved_days'   => (int) ($byStatus['approved']->days ?? 0),
                'pending_days'    => (int) ($byStatus['pending']->days ?? 0),
                'rejected_count'  => (int) ($byStatus['rejected']->cnt ?? 0),
                'total_requests'  => $leaveQuery->count(),
                'by_type'         => $byType->values(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $rows,
            'meta'    => ['year' => $year, 'total_employees' => $employees->count()],
        ]);
    }

    // ---------------------------------------------------------------
    // Payroll report: per-employee payroll for a period
    // GET /reports/payroll?year=&month=&department_id=&status=
    // ---------------------------------------------------------------
    public function payroll(Request $request): JsonResponse
    {
        $year  = $request->integer('year', Carbon::now()->year);
        $month = $request->integer('month', Carbon::now()->month);

        $query = PayrollRecord::query()
            ->with(['employee.user', 'employee.department'])
            ->where('period_year', $year)
            ->where('period_month', $month);

        if ($request->filled('department_id')) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $request->integer('department_id')));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $records = $query->orderBy('id')->get();

        $rows = $records->map(fn(PayrollRecord $rec) => [
            'employee_id'      => $rec->employee_id,
            'employee_number'  => $rec->employee->employee_number,
            'name'             => $rec->employee->user->name,
            'department'       => $rec->employee->department?->name,
            'basic_salary'     => (float) $rec->basic_salary,
            'allowances'       => (float) $rec->allowances,
            'overtime_pay'     => (float) $rec->overtime_pay,
            'gross_salary'     => (float) $rec->gross_salary,
            'total_deductions' => round(
                (float) $rec->absent_deduction + (float) $rec->other_deductions
                + (float) $rec->tax_deduction + (float) $rec->bpjs_deduction, 2
            ),
            'net_salary'       => (float) $rec->net_salary,
            'present_days'     => $rec->present_days,
            'absent_days'      => $rec->absent_days,
            'status'           => $rec->status,
        ]);

        $totals = [
            'total_gross'      => round($records->sum('gross_salary'), 2),
            'total_net'        => round($records->sum('net_salary'), 2),
            'total_deductions' => round($records->sum(fn($r) =>
                (float) $r->absent_deduction + (float) $r->other_deductions
                + (float) $r->tax_deduction + (float) $r->bpjs_deduction
            ), 2),
            'count_draft'     => $records->where('status', 'draft')->count(),
            'count_finalized' => $records->where('status', 'finalized')->count(),
            'count_paid'      => $records->where('status', 'paid')->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => $rows,
            'meta'    => [
                'year'   => $year,
                'month'  => $month,
                'totals' => $totals,
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Daily attendance trend for the current (or given) month
    // GET /reports/daily-trend?year=&month=
    // Returns one row per past working day with present/late/absent counts
    // ---------------------------------------------------------------
    public function dailyTrend(Request $request): JsonResponse
    {
        $year  = $request->integer('year',  Carbon::now()->year);
        $month = $request->integer('month', Carbon::now()->month);

        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end   = Carbon::create($year, $month, 1)->endOfMonth()->endOfDay();
        $today = Carbon::today();

        // Don't go beyond today
        if ($end->gt($today)) {
            $end = $today->copy()->endOfDay();
        }

        $totalEmployees = Employee::where('status', 'active')->count();

        // Fetch all records for the range grouped by date+status
        $records = AttendanceRecord::whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw("date, status, COUNT(*) as cnt")
            ->groupBy('date', 'status')
            ->get()
            ->groupBy(fn($r) => Carbon::parse($r->date)->toDateString());

        $days = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            if (!$cursor->isWeekend()) {
                $dateKey = $cursor->toDateString();
                $dayRows = $records->get($dateKey, collect());

                $present = (int) $dayRows->whereIn('status', ['present', 'late'])->sum('cnt');
                $late    = (int) $dayRows->where('status', 'late')->sum('cnt');
                $leave   = (int) $dayRows->where('status', 'on_leave')->sum('cnt');
                $absent  = max(0, $totalEmployees - $present - $leave);

                $days[] = [
                    'date'             => $dateKey,
                    'day'              => (int) $cursor->day,
                    'weekday'          => $cursor->format('D'),
                    'present'          => $present,
                    'late'             => $late,
                    'on_leave'         => $leave,
                    'absent'           => $absent,
                    'total_employees'  => $totalEmployees,
                    'attendance_rate'  => $totalEmployees > 0
                        ? round(($present / $totalEmployees) * 100)
                        : 0,
                ];
            }
            $cursor->addDay();
        }

        return response()->json([
            'success' => true,
            'data'    => $days,
            'meta'    => [
                'year'            => $year,
                'month'           => $month,
                'total_employees' => $totalEmployees,
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Per-department attendance summary for today
    // GET /reports/department-today
    // ---------------------------------------------------------------
    public function departmentToday(): JsonResponse
    {
        $today = Carbon::today()->toDateString();

        // Eager-load departments + their active employee IDs in 2 queries
        $departments = Department::where('is_active', true)
            ->with(['employees' => fn($q) => $q->where('status', 'active')->select('id', 'department_id')])
            ->get()
            ->filter(fn($d) => $d->employees->isNotEmpty());

        // Load all today's records in one query, keyed by employee_id
        $todayRecords = AttendanceRecord::whereDate('date', $today)
            ->select('employee_id', 'status')
            ->get()
            ->keyBy('employee_id');

        $rows = $departments->map(function (Department $dept) use ($todayRecords) {
            $empIds = $dept->employees->pluck('id');
            $total  = $empIds->count();

            $present = 0;
            $late    = 0;
            $onLeave = 0;

            foreach ($empIds as $empId) {
                $rec = $todayRecords->get($empId);
                if (!$rec) continue;
                if (in_array($rec->status, ['present', 'late'])) $present++;
                if ($rec->status === 'late') $late++;
                if ($rec->status === 'on_leave') $onLeave++;
            }

            $absent = max(0, $total - $present - $onLeave);

            return [
                'department_id'   => $dept->id,
                'department_name' => $dept->name,
                'department_code' => $dept->code,
                'total'           => $total,
                'present'         => $present,
                'late'            => $late,
                'on_leave'        => $onLeave,
                'absent'          => $absent,
                'attendance_rate' => $total > 0 ? round(($present / $total) * 100) : 0,
            ];
        });

        // Face enrollment summary
        $enrolled  = FaceData::where('is_active', true)->count();
        $totalEmps = Employee::where('status', 'active')->count();

        return response()->json([
            'success' => true,
            'data'    => $rows->values(),
            'meta'    => [
                'date'          => $today,
                'face_enrolled' => $enrolled,
                'face_total'    => $totalEmps,
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Overtime report: per-employee overtime summary for a period
    // GET /reports/overtime?year=&month=&department_id=
    // ---------------------------------------------------------------
    public function overtime(Request $request): JsonResponse
    {
        $year  = $request->integer('year',  Carbon::now()->year);
        $month = $request->integer('month', Carbon::now()->month);

        $start = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $end   = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $query = Employee::query()
            ->with(['user', 'department'])
            ->where('status', 'active');

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }

        $employees = $query->orderBy('employee_number')->get();

        $rows = $employees->map(function (Employee $emp) use ($start, $end) {
            $records = OvertimeRequest::where('employee_id', $emp->id)
                ->whereBetween('date', [$start, $end])
                ->selectRaw("status, overtime_type, sum(overtime_hours) as total_hours, count(*) as cnt")
                ->groupBy('status', 'overtime_type')
                ->get();

            $approvedHours = $records->where('status', 'approved')->sum('total_hours');
            $pendingHours  = $records->where('status', 'pending')->sum('total_hours');
            $totalRequests = OvertimeRequest::where('employee_id', $emp->id)
                ->whereBetween('date', [$start, $end])
                ->count();

            $byType = $records->where('status', 'approved')
                ->groupBy('overtime_type')
                ->map(fn($grp, $type) => [
                    'type'         => $type,
                    'total_hours'  => round((float) $grp->sum('total_hours'), 2),
                    'count'        => (int) $grp->sum('cnt'),
                ])->values();

            return [
                'employee_id'     => $emp->id,
                'employee_number' => $emp->employee_number,
                'name'            => $emp->user->name,
                'department'      => $emp->department?->name,
                'total_requests'  => $totalRequests,
                'approved_hours'  => round((float) $approvedHours, 2),
                'pending_hours'   => round((float) $pendingHours, 2),
                'by_type'         => $byType,
            ];
        })->filter(fn($row) => $row['total_requests'] > 0)->values();

        // Totals
        $allRecords = OvertimeRequest::whereBetween('date', [$start, $end]);
        $totalApprovedHours = (clone $allRecords)->where('status', 'approved')->sum('overtime_hours');
        $totalPendingCount  = (clone $allRecords)->where('status', 'pending')->count();

        return response()->json([
            'success' => true,
            'data'    => $rows,
            'meta'    => [
                'year'                => $year,
                'month'               => $month,
                'total_employees'     => $rows->count(),
                'total_approved_hours'=> round((float) $totalApprovedHours, 2),
                'total_pending'       => $totalPendingCount,
            ],
        ]);
    }
}
