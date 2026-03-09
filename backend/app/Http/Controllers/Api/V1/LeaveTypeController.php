<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeaveTypeResource;
use App\Models\LeaveType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LeaveType::query();

        if (!$request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        $types = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => LeaveTypeResource::collection($types),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'              => ['required', 'string', 'max:255'],
            'code'              => ['required', 'string', 'max:50', 'unique:leave_types,code'],
            'description'       => ['nullable', 'string'],
            'max_days_per_year' => ['required', 'integer', 'min:1', 'max:365'],
            'is_paid'           => ['boolean'],
            'is_active'         => ['boolean'],
        ]);

        $type = LeaveType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Leave type created.',
            'data'    => new LeaveTypeResource($type),
        ], 201);
    }

    public function update(Request $request, LeaveType $leaveType): JsonResponse
    {
        $validated = $request->validate([
            'name'              => ['required', 'string', 'max:255'],
            'code'              => ['required', 'string', 'max:50', "unique:leave_types,code,{$leaveType->id}"],
            'description'       => ['nullable', 'string'],
            'max_days_per_year' => ['required', 'integer', 'min:1', 'max:365'],
            'is_paid'           => ['boolean'],
            'is_active'         => ['boolean'],
        ]);

        $leaveType->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Leave type updated.',
            'data'    => new LeaveTypeResource($leaveType),
        ]);
    }

    public function destroy(LeaveType $leaveType): JsonResponse
    {
        if ($leaveType->leaveRequests()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete leave type that has existing requests.',
            ], 422);
        }

        $leaveType->delete();

        return response()->json(['success' => true, 'message' => 'Leave type deleted.']);
    }
}
