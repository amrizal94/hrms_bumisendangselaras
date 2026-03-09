<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreShiftRequest;
use App\Http\Requests\UpdateShiftRequest;
use App\Http\Resources\ShiftResource;
use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    // ---------------------------------------------------------------
    // Admin/HR: list shifts
    // ---------------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = Shift::query()->withCount('employees');

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->string('search') . '%');
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $shifts = $query
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => ShiftResource::collection($shifts->items()),
            'meta'    => [
                'total'        => $shifts->total(),
                'per_page'     => $shifts->perPage(),
                'current_page' => $shifts->currentPage(),
                'last_page'    => $shifts->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: create shift
    // ---------------------------------------------------------------
    public function store(StoreShiftRequest $request): JsonResponse
    {
        $shift = Shift::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Shift created successfully.',
            'data'    => new ShiftResource($shift->loadCount('employees')),
        ], 201);
    }

    // ---------------------------------------------------------------
    // Admin/HR: show single shift
    // ---------------------------------------------------------------
    public function show(Shift $shift): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new ShiftResource($shift->loadCount('employees')),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: update shift
    // ---------------------------------------------------------------
    public function update(UpdateShiftRequest $request, Shift $shift): JsonResponse
    {
        $shift->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Shift updated successfully.',
            'data'    => new ShiftResource($shift->loadCount('employees')),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: delete shift (only if no employees assigned)
    // ---------------------------------------------------------------
    public function destroy(Shift $shift): JsonResponse
    {
        if ($shift->employees()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete shift with assigned employees. Reassign employees first.',
            ], 422);
        }

        $shift->delete();

        return response()->json([
            'success' => true,
            'message' => 'Shift deleted successfully.',
        ]);
    }

    // ---------------------------------------------------------------
    // All authenticated: get current user's shift
    // ---------------------------------------------------------------
    public function myShift(Request $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)
            ->with('shift')
            ->first();

        return response()->json([
            'success' => true,
            'data'    => $employee?->shift ? new ShiftResource($employee->shift) : null,
        ]);
    }
}
