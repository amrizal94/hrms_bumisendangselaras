<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RejectLeaveRequest;
use App\Http\Requests\StoreLeaveRequestRequest;
use App\Http\Resources\LeaveRequestResource;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Notifications\LeaveStatusChanged;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LeaveRequestController extends Controller
{
    // ---------------------------------------------------------------
    // Admin/HR: list all requests with filters
    // ---------------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = LeaveRequest::query()
            ->with(['employee.user', 'employee.department', 'leaveType', 'approvedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $request->integer('department_id')));
        }

        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->integer('leave_type_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('start_date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('end_date', '<=', $request->string('date_to'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->whereHas('employee.user', fn($q) => $q->where('name', 'ilike', "%{$search}%"));
        }

        $requests = $query
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => LeaveRequestResource::collection($requests->items()),
            'meta'    => [
                'total'        => $requests->total(),
                'per_page'     => $requests->perPage(),
                'current_page' => $requests->currentPage(),
                'last_page'    => $requests->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: apply for leave
    // ---------------------------------------------------------------
    public function store(StoreLeaveRequestRequest $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found.'], 404);
        }

        $validated  = $request->validated();
        $start      = Carbon::parse($validated['start_date']);
        $end        = Carbon::parse($validated['end_date']);
        $totalDays  = LeaveRequest::countDays($start, $end);

        // Check for overlapping pending/approved leave
        $overlapping = LeaveRequest::where('employee_id', $employee->id)
            ->whereIn('status', ['pending', 'approved'])
            ->where(fn($q) => $q
                ->whereBetween('start_date', [$start, $end])
                ->orWhereBetween('end_date', [$start, $end])
                ->orWhere(fn($q2) => $q2->where('start_date', '<=', $start)->where('end_date', '>=', $end))
            )
            ->exists();

        if ($overlapping) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an overlapping leave request for this period.',
            ], 422);
        }

        // Quota check
        $leaveType = \App\Models\LeaveType::findOrFail($validated['leave_type_id']);
        $year      = $start->year;
        $usedDays  = LeaveRequest::where('employee_id', $employee->id)
            ->where('leave_type_id', $validated['leave_type_id'])
            ->whereYear('start_date', $year)
            ->whereIn('status', ['approved', 'pending'])
            ->sum('total_days');

        $remaining = max(0, $leaveType->max_days_per_year - (int) $usedDays);
        if ($totalDays > $remaining) {
            return response()->json([
                'success' => false,
                'message' => "Insufficient leave quota. Remaining: {$remaining} day(s), requested: {$totalDays} day(s).",
            ], 422);
        }

        $leaveRequest = LeaveRequest::create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $validated['leave_type_id'],
            'start_date'    => $validated['start_date'],
            'end_date'      => $validated['end_date'],
            'total_days'    => $totalDays,
            'reason'        => $validated['reason'],
            'status'        => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Leave request submitted for {$totalDays} day(s).",
            'data'    => new LeaveRequestResource($leaveRequest->load(['employee.user', 'employee.department', 'leaveType'])),
        ], 201);
    }

    // ---------------------------------------------------------------
    // Show single request
    // ---------------------------------------------------------------
    public function show(LeaveRequest $leaveRequest): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new LeaveRequestResource(
                $leaveRequest->load(['employee.user', 'employee.department', 'leaveType', 'approvedBy'])
            ),
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: cancel own pending request
    // ---------------------------------------------------------------
    public function destroy(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();
        $isAdmin  = $request->user()->hasRole(['admin', 'hr', 'manager', 'director']);

        if (!$isAdmin && $leaveRequest->employee_id !== $employee?->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        if (!$leaveRequest->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending requests can be cancelled.',
            ], 422);
        }

        $leaveRequest->update(['status' => 'cancelled']);

        return response()->json(['success' => true, 'message' => 'Leave request cancelled.']);
    }

    // ---------------------------------------------------------------
    // Admin/HR: approve request
    // ---------------------------------------------------------------
    public function approve(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if (!$leaveRequest->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending requests can be approved.',
            ], 422);
        }

        $leaveRequest->update([
            'status'      => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $leaveRequest->load(['employee.user', 'leaveType']);
        optional($leaveRequest->employee?->user)->notify(new LeaveStatusChanged($leaveRequest));

        AuditLog::record('leave.approve', $request, [
            'target_label' => $leaveRequest->employee?->user?->name ?? '—',
            'leave_type'   => $leaveRequest->leaveType?->name,
            'dates'        => $leaveRequest->start_date . ' – ' . $leaveRequest->end_date,
            'total_days'   => $leaveRequest->total_days,
        ], 'leave_request', $leaveRequest->id);

        return response()->json([
            'success' => true,
            'message' => 'Leave request approved.',
            'data'    => new LeaveRequestResource(
                $leaveRequest->load(['employee.user', 'employee.department', 'leaveType', 'approvedBy'])
            ),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: reject request
    // ---------------------------------------------------------------
    public function reject(RejectLeaveRequest $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if (!$leaveRequest->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending requests can be rejected.',
            ], 422);
        }

        $leaveRequest->update([
            'status'           => 'rejected',
            'approved_by'      => $request->user()->id,
            'approved_at'      => now(),
            'rejection_reason' => $request->validated()['rejection_reason'],
        ]);

        $leaveRequest->load(['employee.user', 'leaveType']);
        optional($leaveRequest->employee?->user)->notify(new LeaveStatusChanged($leaveRequest));

        AuditLog::record('leave.reject', $request, [
            'target_label'     => $leaveRequest->employee?->user?->name ?? '—',
            'leave_type'       => $leaveRequest->leaveType?->name,
            'rejection_reason' => $request->validated()['rejection_reason'],
        ], 'leave_request', $leaveRequest->id);

        return response()->json([
            'success' => true,
            'message' => 'Leave request rejected.',
            'data'    => new LeaveRequestResource(
                $leaveRequest->load(['employee.user', 'employee.department', 'leaveType', 'approvedBy'])
            ),
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: own leave history
    // ---------------------------------------------------------------
    public function myLeaves(Request $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found.'], 404);
        }

        $query = LeaveRequest::where('employee_id', $employee->id)
            ->with(['leaveType', 'approvedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $requests = $query
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 10));

        return response()->json([
            'success' => true,
            'data'    => LeaveRequestResource::collection($requests->items()),
            'meta'    => [
                'total'        => $requests->total(),
                'per_page'     => $requests->perPage(),
                'current_page' => $requests->currentPage(),
                'last_page'    => $requests->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: remaining leave quota summary
    // ---------------------------------------------------------------
    public function quota(Request $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found.'], 404);
        }

        $year  = now()->year;
        $types = \App\Models\LeaveType::where('is_active', true)->get();

        $quotas = $types->map(function ($type) use ($employee, $year) {
            $used = LeaveRequest::where('employee_id', $employee->id)
                ->where('leave_type_id', $type->id)
                ->whereYear('start_date', $year)
                ->whereIn('status', ['approved', 'pending'])
                ->sum('total_days');

            return [
                'leave_type'  => ['id' => $type->id, 'name' => $type->name, 'code' => $type->code, 'is_paid' => $type->is_paid],
                'max_days'    => $type->max_days_per_year,
                'used_days'   => (int) $used,
                'remaining'   => max(0, $type->max_days_per_year - $used),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $quotas,
        ]);
    }
}
