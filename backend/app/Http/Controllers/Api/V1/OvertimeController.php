<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RejectOvertimeRequest;
use App\Http\Requests\StoreOvertimeRequest;
use App\Http\Requests\UpdateOvertimeRequest;
use App\Http\Resources\OvertimeResource;
use App\Models\Employee;
use App\Models\OvertimeRequest;
use App\Notifications\OvertimeStatusChanged;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OvertimeController extends Controller
{
    // ---------------------------------------------------------------
    // Admin/HR: list all requests with filters
    // ---------------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = OvertimeRequest::query()
            ->with(['employee.user', 'employee.department', 'approvedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $request->integer('department_id')));
        }

        if ($request->filled('overtime_type')) {
            $query->where('overtime_type', $request->string('overtime_type'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->string('date_to'));
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
            'data'    => OvertimeResource::collection($requests->items()),
            'meta'    => [
                'total'        => $requests->total(),
                'per_page'     => $requests->perPage(),
                'current_page' => $requests->currentPage(),
                'last_page'    => $requests->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: submit overtime request (or admin on behalf of employee)
    // ---------------------------------------------------------------
    public function store(StoreOvertimeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $isAdmin   = $request->user()->hasRole(['admin', 'hr', 'manager', 'director']);

        if ($isAdmin && !empty($validated['employee_id'])) {
            $employee = Employee::find($validated['employee_id']);
        } else {
            $employee = Employee::where('user_id', $request->user()->id)->first();
        }

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found.'], 404);
        }

        $overtime = OvertimeRequest::create([
            'employee_id'    => $employee->id,
            'date'           => $validated['date'],
            'overtime_hours' => $validated['overtime_hours'],
            'overtime_type'  => $validated['overtime_type'],
            'reason'         => $validated['reason'],
            'notes'          => $validated['notes'] ?? null,
            'status'         => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Overtime request submitted successfully.',
            'data'    => new OvertimeResource($overtime->load(['employee.user', 'employee.department'])),
        ], 201);
    }

    // ---------------------------------------------------------------
    // Show single request
    // ---------------------------------------------------------------
    public function show(OvertimeRequest $overtime): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new OvertimeResource(
                $overtime->load(['employee.user', 'employee.department', 'approvedBy'])
            ),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: update request (only if pending)
    // ---------------------------------------------------------------
    public function update(UpdateOvertimeRequest $request, OvertimeRequest $overtime): JsonResponse
    {
        if (!$overtime->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending requests can be updated.',
            ], 422);
        }

        $overtime->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Overtime request updated.',
            'data'    => new OvertimeResource($overtime->load(['employee.user', 'employee.department', 'approvedBy'])),
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: cancel own pending request / Admin: can cancel any
    // ---------------------------------------------------------------
    public function destroy(Request $request, OvertimeRequest $overtime): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();
        $isAdmin  = $request->user()->hasRole(['admin', 'hr', 'manager', 'director']);

        if (!$isAdmin && $overtime->employee_id !== $employee?->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        if (!$overtime->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending requests can be cancelled.',
            ], 422);
        }

        $overtime->update(['status' => 'cancelled']);

        return response()->json(['success' => true, 'message' => 'Overtime request cancelled.']);
    }

    // ---------------------------------------------------------------
    // Admin/HR: approve request
    // ---------------------------------------------------------------
    public function approve(Request $request, OvertimeRequest $overtime): JsonResponse
    {
        if (!$overtime->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending requests can be approved.',
            ], 422);
        }

        $overtime->update([
            'status'      => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $overtime->load(['employee.user']);
        optional($overtime->employee?->user)->notify(new OvertimeStatusChanged($overtime));

        return response()->json([
            'success' => true,
            'message' => 'Overtime request approved.',
            'data'    => new OvertimeResource(
                $overtime->load(['employee.user', 'employee.department', 'approvedBy'])
            ),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: reject request
    // ---------------------------------------------------------------
    public function reject(RejectOvertimeRequest $request, OvertimeRequest $overtime): JsonResponse
    {
        if (!$overtime->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending requests can be rejected.',
            ], 422);
        }

        $overtime->update([
            'status'           => 'rejected',
            'approved_by'      => $request->user()->id,
            'approved_at'      => now(),
            'rejection_reason' => $request->validated()['rejection_reason'],
        ]);

        $overtime->load(['employee.user']);
        optional($overtime->employee?->user)->notify(new OvertimeStatusChanged($overtime));

        return response()->json([
            'success' => true,
            'message' => 'Overtime request rejected.',
            'data'    => new OvertimeResource(
                $overtime->load(['employee.user', 'employee.department', 'approvedBy'])
            ),
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: own overtime history
    // ---------------------------------------------------------------
    public function myOvertime(Request $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found.'], 404);
        }

        $query = OvertimeRequest::where('employee_id', $employee->id)
            ->with(['approvedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('overtime_type')) {
            $query->where('overtime_type', $request->string('overtime_type'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->string('date_to'));
        }

        $requests = $query
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 10));

        return response()->json([
            'success' => true,
            'data'    => OvertimeResource::collection($requests->items()),
            'meta'    => [
                'total'        => $requests->total(),
                'per_page'     => $requests->perPage(),
                'current_page' => $requests->currentPage(),
                'last_page'    => $requests->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: summary counts + total hours
    // ---------------------------------------------------------------
    public function summary(Request $request): JsonResponse
    {
        $query = OvertimeRequest::query();

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->string('date_to'));
        }

        $all      = (clone $query)->get();
        $total    = $all->count();
        $pending  = $all->where('status', 'pending')->count();
        $approved = $all->where('status', 'approved')->count();
        $rejected = $all->where('status', 'rejected')->count();
        $totalHours = $all->where('status', 'approved')->sum('overtime_hours');

        return response()->json([
            'success' => true,
            'data'    => [
                'total'       => $total,
                'pending'     => $pending,
                'approved'    => $approved,
                'rejected'    => $rejected,
                'total_hours' => (float) $totalHours,
            ],
        ]);
    }
}
