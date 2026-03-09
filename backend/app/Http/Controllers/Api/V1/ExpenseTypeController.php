<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExpenseType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseTypeController extends Controller
{
    // All authenticated users: list active expense types
    public function index(Request $request): JsonResponse
    {
        $query = ExpenseType::query();

        if (!$request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        $types = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $types->map(fn($t) => $this->format($t)),
        ]);
    }

    // Admin/HR: create new expense type
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'code'        => ['required', 'string', 'max:50', 'unique:expense_types,code'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['boolean'],
        ]);

        $type = ExpenseType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Expense type created.',
            'data'    => $this->format($type),
        ], 201);
    }

    // Admin/HR: update expense type
    public function update(Request $request, ExpenseType $expenseType): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'code'        => ['required', 'string', 'max:50', "unique:expense_types,code,{$expenseType->id}"],
            'description' => ['nullable', 'string'],
            'is_active'   => ['boolean'],
        ]);

        $expenseType->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Expense type updated.',
            'data'    => $this->format($expenseType),
        ]);
    }

    // Admin only: delete if no linked expenses
    public function destroy(ExpenseType $expenseType): JsonResponse
    {
        if ($expenseType->expenses()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete expense type that has existing expenses.',
            ], 422);
        }

        $expenseType->delete();

        return response()->json(['success' => true, 'message' => 'Expense type deleted.']);
    }

    private function format(ExpenseType $t): array
    {
        return [
            'id'          => $t->id,
            'name'        => $t->name,
            'code'        => $t->code,
            'description' => $t->description,
            'is_active'   => $t->is_active,
        ];
    }
}
