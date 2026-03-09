<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\ExpenseType;
use App\Notifications\ExpenseStatusChanged;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExpenseController extends Controller
{
    // ---------------------------------------------------------------
    // Staff: own expense history
    // ---------------------------------------------------------------
    public function myExpenses(Request $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found.'], 404);
        }

        $query = Expense::where('employee_id', $employee->id)
            ->with(['approvedBy:id,name', 'expenseType']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $expenses = $query->orderByDesc('expense_date')
            ->paginate($request->integer('per_page', 10));

        return response()->json([
            'success' => true,
            'data'    => $expenses->items(),
            'meta'    => [
                'total'        => $expenses->total(),
                'per_page'     => $expenses->perPage(),
                'current_page' => $expenses->currentPage(),
                'last_page'    => $expenses->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: submit expense (multipart)
    // ---------------------------------------------------------------
    public function store(Request $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found.'], 404);
        }

        $validated = $request->validate([
            'expense_date'    => ['required', 'date'],
            'amount'          => ['required', 'numeric', 'min:1'],
            'expense_type_id' => ['required', 'integer', 'exists:expense_types,id'],
            'description'     => ['required', 'string', 'max:1000'],
            'receipt'         => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $expenseType = ExpenseType::findOrFail($validated['expense_type_id']);

        $file     = $request->file('receipt');
        $filename = 'receipts/emp_' . $employee->id . '_' . time() . '.' . $file->extension();
        Storage::disk('public')->put($filename, file_get_contents($file->getRealPath()));

        $expense = Expense::create([
            'employee_id'     => $employee->id,
            'expense_type_id' => $expenseType->id,
            'expense_date'    => $validated['expense_date'],
            'amount'          => $validated['amount'],
            'category'        => $expenseType->code,  // backward compat
            'description'     => $validated['description'],
            'receipt_path'    => $filename,
            'status'          => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expense submitted successfully.',
            'data'    => $expense,
        ], 201);
    }

    // ---------------------------------------------------------------
    // Staff: delete own pending expense
    // ---------------------------------------------------------------
    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee || $expense->employee_id !== $employee->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        if (!$expense->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending expenses can be deleted.',
            ], 422);
        }

        Storage::disk('public')->delete($expense->receipt_path);
        $expense->delete();

        return response()->json(['success' => true, 'message' => 'Expense deleted.']);
    }

    // ---------------------------------------------------------------
    // Admin/HR: list all expenses
    // ---------------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = Expense::with(['employee.user', 'employee.department', 'approvedBy:id,name', 'expenseType']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('expense_date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('expense_date', '<=', $request->string('date_to'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->whereHas('employee.user', fn($q) => $q->where('name', 'ilike', "%{$search}%"));
        }

        $expenses = $query->orderByDesc('expense_date')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $this->formatCollection($expenses->items()),
            'meta'    => [
                'total'        => $expenses->total(),
                'per_page'     => $expenses->perPage(),
                'current_page' => $expenses->currentPage(),
                'last_page'    => $expenses->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: single expense
    // ---------------------------------------------------------------
    public function show(Expense $expense): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->formatOne($expense->load(['employee.user', 'employee.department', 'approvedBy:id,name', 'expenseType'])),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: approve
    // ---------------------------------------------------------------
    public function approve(Request $request, Expense $expense): JsonResponse
    {
        if (!$expense->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending expenses can be approved.',
            ], 422);
        }

        $expense->update([
            'status'      => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $expense->load(['employee.user', 'expenseType']);
        optional($expense->employee?->user)->notify(new ExpenseStatusChanged($expense));

        AuditLog::record('expense.approve', $request, [
            'target_label' => $expense->employee?->user?->name ?? '—',
            'amount'       => (float) $expense->amount,
            'category'     => $expense->expenseType?->name ?? $expense->category,
        ], 'expense', $expense->id);

        return response()->json([
            'success' => true,
            'message' => 'Expense approved.',
            'data'    => $this->formatOne($expense->load(['employee.user', 'employee.department', 'approvedBy:id,name', 'expenseType'])),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: reject
    // ---------------------------------------------------------------
    public function reject(Request $request, Expense $expense): JsonResponse
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        if (!$expense->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending expenses can be rejected.',
            ], 422);
        }

        $expense->update([
            'status'           => 'rejected',
            'approved_by'      => $request->user()->id,
            'approved_at'      => now(),
            'rejection_reason' => $request->string('rejection_reason'),
        ]);

        $expense->load(['employee.user', 'expenseType']);
        optional($expense->employee?->user)->notify(new ExpenseStatusChanged($expense));

        AuditLog::record('expense.reject', $request, [
            'target_label'     => $expense->employee?->user?->name ?? '—',
            'rejection_reason' => $request->string('rejection_reason'),
        ], 'expense', $expense->id);

        return response()->json([
            'success' => true,
            'message' => 'Expense rejected.',
            'data'    => $this->formatOne($expense->load(['employee.user', 'employee.department', 'approvedBy:id,name', 'expenseType'])),
        ]);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    private function formatOne(Expense $expense): array
    {
        $emp  = $expense->employee;
        $user = $emp?->user;
        $dept = $emp?->department;
        $et   = $expense->expenseType;

        return [
            'id'               => $expense->id,
            'expense_date'     => $expense->expense_date?->toDateString(),
            'amount'           => (float) $expense->amount,
            'category'         => $expense->category,
            'expense_type'     => $et ? ['id' => $et->id, 'name' => $et->name, 'code' => $et->code] : null,
            'description'      => $expense->description,
            'receipt_url'      => $expense->receipt_path
                ? secure_url('storage/' . $expense->receipt_path)
                : null,
            'status'           => $expense->status,
            'rejection_reason' => $expense->rejection_reason,
            'approved_at'      => $expense->approved_at?->toISOString(),
            'approved_by'      => $expense->approvedBy
                ? ['id' => $expense->approvedBy->id, 'name' => $expense->approvedBy->name]
                : null,
            'employee'         => $emp ? [
                'id'              => $emp->id,
                'employee_number' => $emp->employee_number,
                'user'            => $user ? ['id' => $user->id, 'name' => $user->name] : null,
                'department'      => $dept ? ['name' => $dept->name] : null,
            ] : null,
            'created_at'       => $expense->created_at?->toISOString(),
        ];
    }

    private function formatCollection(array $expenses): array
    {
        return array_map(fn($e) => $this->formatOne($e), $expenses);
    }
}
