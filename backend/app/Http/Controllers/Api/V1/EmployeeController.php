<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Employee::query()->with(['user', 'department', 'shift']);

        if ($request->filled('search')) {
            $search      = $request->string('search');
            $canSeeEmail = $request->user()?->hasRole(['admin', 'hr', 'director']) ?? false;
            $query->where(function ($q) use ($search, $canSeeEmail) {
                $q->where('employee_number', 'ilike', "%{$search}%")
                  ->orWhere('position', 'ilike', "%{$search}%")
                  ->orWhereHas('user', function ($u) use ($search, $canSeeEmail) {
                      $u->where('name', 'ilike', "%{$search}%");
                      if ($canSeeEmail) {
                          $u->orWhere('email', 'ilike', "%{$search}%");
                      }
                  });
            });
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->string('employment_type'));
        }

        $employees = $query
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => EmployeeResource::collection($employees->items()),
            'meta'    => [
                'total'        => $employees->total(),
                'per_page'     => $employees->perPage(),
                'current_page' => $employees->currentPage(),
                'last_page'    => $employees->lastPage(),
            ],
        ]);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        DB::beginTransaction();
        try {
            // Create user account
            $user = User::create([
                'name'                => $validated['name'],
                'email'               => $validated['email'],
                'phone'               => $validated['phone'] ?? null,
                'password'            => Hash::make($validated['password'] ?? $validated['employee_number']),
                'is_active'           => false,
                'must_change_password'=> true,
            ]);

            $requestedRole = $validated['role'] ?? 'staff';
            if (in_array($requestedRole, ['admin', 'director']) && ! $request->user()->hasRole('director')) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Only directors can assign admin or director roles.',
                ], 403);
            }
            $user->assignRole($requestedRole);

            // Create employee record
            $employee = Employee::create([
                'user_id'                 => $user->id,
                'employee_number'         => $validated['employee_number'],
                'department_id'           => $validated['department_id'] ?? null,
                'shift_id'                => $validated['shift_id'] ?? null,
                'position'                => $validated['position'],
                'employment_type'         => $validated['employment_type'],
                'status'                  => $validated['status'],
                'join_date'               => $validated['join_date'],
                'end_date'                => $validated['end_date'] ?? null,
                'basic_salary'            => $validated['basic_salary'],
                'gender'                  => $validated['gender'] ?? null,
                'birth_date'              => $validated['birth_date'] ?? null,
                'address'                 => $validated['address'] ?? null,
                'emergency_contact_name'  => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'bank_name'               => $validated['bank_name'] ?? null,
                'bank_account_number'     => $validated['bank_account_number'] ?? null,
                'tax_id'                  => $validated['tax_id'] ?? null,
                'national_id'             => $validated['national_id'] ?? null,
            ]);

            DB::commit();

            AuditLog::record('employee.create', $request, [
                'target_label' => "{$validated['name']} ({$validated['employee_number']})",
                'role'         => $requestedRole,
            ], 'employee', $employee->id);

            return response()->json([
                'success' => true,
                'message' => 'Employee created successfully.',
                'data'    => new EmployeeResource($employee->load(['user', 'department', 'shift'])),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Employee $employee): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new EmployeeResource($employee->load(['user', 'department', 'shift'])),
        ]);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): JsonResponse
    {
        $validated = $request->validated();

        DB::beginTransaction();
        try {
            // Update user account
            $employee->user->update([
                'name'  => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
            ]);

            // Update role if provided (director-only guard for admin/director roles)
            if (isset($validated['role'])) {
                $requestedRole = $validated['role'];
                if (in_array($requestedRole, ['admin', 'director']) && ! $request->user()->hasRole('director')) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Only directors can assign admin or director roles.',
                    ], 403);
                }
                $employee->user->syncRoles([$requestedRole]);
            }

            // Update employee record
            $employee->update([
                'employee_number'         => $validated['employee_number'],
                'department_id'           => $validated['department_id'] ?? null,
                'shift_id'                => $validated['shift_id'] ?? null,
                'position'                => $validated['position'],
                'employment_type'         => $validated['employment_type'],
                'status'                  => $validated['status'],
                'join_date'               => $validated['join_date'],
                'end_date'                => $validated['end_date'] ?? null,
                'basic_salary'            => $validated['basic_salary'],
                'gender'                  => $validated['gender'] ?? null,
                'birth_date'              => $validated['birth_date'] ?? null,
                'address'                 => $validated['address'] ?? null,
                'emergency_contact_name'  => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'bank_name'               => $validated['bank_name'] ?? null,
                'bank_account_number'     => $validated['bank_account_number'] ?? null,
                'tax_id'                  => $validated['tax_id'] ?? null,
                'national_id'             => $validated['national_id'] ?? null,
            ]);

            DB::commit();

            AuditLog::record('employee.update', $request, [
                'target_label'  => "{$validated['name']} ({$validated['employee_number']})",
                'changed_fields' => array_keys($validated),
            ], 'employee', $employee->id);

            return response()->json([
                'success' => true,
                'message' => 'Employee updated successfully.',
                'data'    => new EmployeeResource($employee->load(['user', 'department', 'shift'])),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleActive(Request $request, Employee $employee): JsonResponse
    {
        $employee->user->update(['is_active' => ! $employee->user->is_active]);

        $status = $employee->user->is_active ? 'activated' : 'deactivated';
        $action = $employee->user->is_active ? 'employee.activate' : 'employee.deactivate';

        AuditLog::record($action, $request, [
            'target_label' => "{$employee->user->name} ({$employee->employee_number})",
        ], 'employee', $employee->id);

        return response()->json([
            'success' => true,
            'message' => "Employee account {$status}.",
            'data'    => new EmployeeResource($employee->load(['user', 'department', 'shift'])),
        ]);
    }

    public function destroy(Request $request, Employee $employee): JsonResponse
    {
        AuditLog::record('employee.delete', $request, [
            'target_label' => "{$employee->user->name} ({$employee->employee_number})",
        ], 'employee', $employee->id);

        $employee->user?->delete(); // soft-delete linked user (prevents login)
        $employee->delete();        // soft-delete employee

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully.',
        ]);
    }
}
