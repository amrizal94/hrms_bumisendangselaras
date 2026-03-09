<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Department::query()->withCount('employees');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $departments = $query
            ->with('manager')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => DepartmentResource::collection($departments->items()),
            'meta'    => [
                'total'        => $departments->total(),
                'per_page'     => $departments->perPage(),
                'current_page' => $departments->currentPage(),
                'last_page'    => $departments->lastPage(),
            ],
        ]);
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $department = Department::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully.',
            'data'    => new DepartmentResource($department->load('manager')),
        ], 201);
    }

    public function show(Department $department): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new DepartmentResource(
                $department->load('manager')->loadCount('employees')
            ),
        ]);
    }

    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        $department->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully.',
            'data'    => new DepartmentResource($department->load('manager')),
        ]);
    }

    public function destroy(Department $department): JsonResponse
    {
        if ($department->employees()->where('status', 'active')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete department with active employees.',
            ], 422);
        }

        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully.',
        ]);
    }
}
