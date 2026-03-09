<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use App\Models\FinanceBudgetProject;
use App\Models\FinanceExpenditure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceExpenditureController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FinanceExpenditure::with([
            'account:id,name,type',
            'budgetProject:id,name',
            'category:id,name,type,color',
            'assignedBy:id,name',
            'createdBy:id,name',
            'approvedBy:id,name',
        ]);

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->integer('account_id'));
        }

        if ($request->filled('budget_project_id')) {
            $query->where('budget_project_id', $request->integer('budget_project_id'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->string('date_to'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(fn($q) => $q
                ->where('description', 'ilike', "%{$search}%")
                ->orWhere('vendor', 'ilike', "%{$search}%")
                ->orWhere('reference_number', 'ilike', "%{$search}%")
            );
        }

        $expenditures = $query->orderByDesc('date')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $expenditures->items(),
            'meta'    => [
                'total'        => $expenditures->total(),
                'per_page'     => $expenditures->perPage(),
                'current_page' => $expenditures->currentPage(),
                'last_page'    => $expenditures->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id'        => ['required', 'integer', 'exists:finance_accounts,id'],
            'budget_project_id' => ['nullable', 'integer', 'exists:finance_budget_projects,id'],
            'category_id'       => ['required', 'integer', 'exists:finance_categories,id'],
            'amount'            => ['required', 'numeric', 'min:1'],
            'date'              => ['required', 'date'],
            'reference_number'  => ['nullable', 'string', 'max:100'],
            'vendor'            => ['nullable', 'string', 'max:255'],
            'description'       => ['nullable', 'string', 'max:1000'],
            'assigned_by'       => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $expenditure = FinanceExpenditure::create(array_merge($validated, [
            'status'     => 'pending',
            'created_by' => $request->user()->id,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Expenditure created successfully.',
            'data'    => $expenditure->load([
                'account:id,name,type',
                'budgetProject:id,name',
                'category:id,name,type,color',
                'assignedBy:id,name',
                'createdBy:id,name',
            ]),
        ], 201);
    }

    public function show(FinanceExpenditure $expenditure): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $expenditure->load([
                'account:id,name,type,bank_name,account_number',
                'budgetProject:id,name,total_budget,spent_amount',
                'category:id,name,type,color',
                'assignedBy:id,name',
                'createdBy:id,name',
                'approvedBy:id,name',
            ]),
        ]);
    }

    public function update(Request $request, FinanceExpenditure $expenditure): JsonResponse
    {
        if ($expenditure->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Approved expenditures cannot be edited directly.',
            ], 422);
        }

        $validated = $request->validate([
            'account_id'        => ['sometimes', 'integer', 'exists:finance_accounts,id'],
            'budget_project_id' => ['nullable', 'integer', 'exists:finance_budget_projects,id'],
            'category_id'       => ['sometimes', 'integer', 'exists:finance_categories,id'],
            'amount'            => ['sometimes', 'numeric', 'min:1'],
            'date'              => ['sometimes', 'date'],
            'reference_number'  => ['nullable', 'string', 'max:100'],
            'vendor'            => ['nullable', 'string', 'max:255'],
            'description'       => ['nullable', 'string', 'max:1000'],
            'assigned_by'       => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $expenditure->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Expenditure updated.',
            'data'    => $expenditure->load([
                'account:id,name,type',
                'budgetProject:id,name',
                'category:id,name,type,color',
                'assignedBy:id,name',
                'createdBy:id,name',
                'approvedBy:id,name',
            ]),
        ]);
    }

    public function destroy(FinanceExpenditure $expenditure): JsonResponse
    {
        return DB::transaction(function () use ($expenditure) {
            if ($expenditure->status === 'approved') {
                // Rollback account balance
                FinanceAccount::where('id', $expenditure->account_id)
                    ->increment('balance', $expenditure->amount);

                // Rollback budget project spent_amount
                if ($expenditure->budget_project_id) {
                    FinanceBudgetProject::where('id', $expenditure->budget_project_id)
                        ->decrement('spent_amount', $expenditure->amount);
                }
            }

            $expenditure->delete();

            return response()->json([
                'success' => true,
                'message' => 'Expenditure deleted.',
            ]);
        });
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $expenditure = FinanceExpenditure::findOrFail($id);

        if ($expenditure->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending expenditures can be approved.',
            ], 422);
        }

        return DB::transaction(function () use ($expenditure, $request) {
            $expenditure->update([
                'status'      => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            // Deduct from account balance
            FinanceAccount::where('id', $expenditure->account_id)
                ->decrement('balance', $expenditure->amount);

            // Add to budget project spent_amount
            if ($expenditure->budget_project_id) {
                FinanceBudgetProject::where('id', $expenditure->budget_project_id)
                    ->increment('spent_amount', $expenditure->amount);
            }

            return response()->json([
                'success' => true,
                'message' => 'Expenditure approved.',
                'data'    => $expenditure->load([
                    'account:id,name,type',
                    'budgetProject:id,name',
                    'category:id,name,type,color',
                    'assignedBy:id,name',
                    'createdBy:id,name',
                    'approvedBy:id,name',
                ]),
            ]);
        });
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $expenditure = FinanceExpenditure::findOrFail($id);

        $request->validate([
            'rejection_note' => ['required', 'string', 'max:500'],
        ]);

        if ($expenditure->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending expenditures can be rejected.',
            ], 422);
        }

        $expenditure->update([
            'status'         => 'rejected',
            'rejection_note' => $request->string('rejection_note'),
            'approved_by'    => $request->user()->id,
            'approved_at'    => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expenditure rejected.',
            'data'    => $expenditure->load([
                'account:id,name,type',
                'budgetProject:id,name',
                'category:id,name,type,color',
                'assignedBy:id,name',
                'createdBy:id,name',
                'approvedBy:id,name',
            ]),
        ]);
    }
}
