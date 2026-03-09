<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use App\Models\FinanceIncome;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceIncomeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FinanceIncome::with([
            'account:id,name,type',
            'category:id,name,type,color',
            'assignedBy:id,name',
            'createdBy:id,name',
            'approvedBy:id,name',
        ]);

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->integer('account_id'));
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
                ->where('source', 'ilike', "%{$search}%")
                ->orWhere('description', 'ilike', "%{$search}%")
                ->orWhere('reference_number', 'ilike', "%{$search}%")
            );
        }

        $incomes = $query->orderByDesc('date')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $incomes->items(),
            'meta'    => [
                'total'        => $incomes->total(),
                'per_page'     => $incomes->perPage(),
                'current_page' => $incomes->currentPage(),
                'last_page'    => $incomes->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id'       => ['required', 'integer', 'exists:finance_accounts,id'],
            'category_id'      => ['required', 'integer', 'exists:finance_categories,id'],
            'amount'           => ['required', 'numeric', 'min:1'],
            'date'             => ['required', 'date'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'source'           => ['required', 'string', 'max:255'],
            'description'      => ['nullable', 'string', 'max:1000'],
            'status'           => ['nullable', 'in:pending,approved,rejected'],
            'assigned_by'      => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $status = $validated['status'] ?? 'pending';

        return DB::transaction(function () use ($validated, $status, $request) {
            $income = FinanceIncome::create(array_merge($validated, [
                'status'     => $status,
                'created_by' => $request->user()->id,
            ]));

            if ($status === 'approved') {
                $income->update([
                    'approved_by' => $request->user()->id,
                    'approved_at' => now(),
                ]);
                FinanceAccount::where('id', $validated['account_id'])
                    ->increment('balance', $validated['amount']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Income created successfully.',
                'data'    => $income->load([
                    'account:id,name,type',
                    'category:id,name,type,color',
                    'assignedBy:id,name',
                    'createdBy:id,name',
                    'approvedBy:id,name',
                ]),
            ], 201);
        });
    }

    public function show(FinanceIncome $income): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $income->load([
                'account:id,name,type,bank_name,account_number',
                'category:id,name,type,color',
                'assignedBy:id,name',
                'createdBy:id,name',
                'approvedBy:id,name',
            ]),
        ]);
    }

    public function update(Request $request, FinanceIncome $income): JsonResponse
    {
        if ($income->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Approved incomes cannot be edited directly. Please contact an administrator.',
            ], 422);
        }

        $validated = $request->validate([
            'account_id'       => ['sometimes', 'integer', 'exists:finance_accounts,id'],
            'category_id'      => ['sometimes', 'integer', 'exists:finance_categories,id'],
            'amount'           => ['sometimes', 'numeric', 'min:1'],
            'date'             => ['sometimes', 'date'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'source'           => ['sometimes', 'string', 'max:255'],
            'description'      => ['nullable', 'string', 'max:1000'],
            'assigned_by'      => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $income->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Income updated.',
            'data'    => $income->load([
                'account:id,name,type',
                'category:id,name,type,color',
                'assignedBy:id,name',
                'createdBy:id,name',
                'approvedBy:id,name',
            ]),
        ]);
    }

    public function destroy(FinanceIncome $income): JsonResponse
    {
        return DB::transaction(function () use ($income) {
            if ($income->status === 'approved') {
                FinanceAccount::where('id', $income->account_id)
                    ->decrement('balance', $income->amount);
            }

            $income->delete();

            return response()->json([
                'success' => true,
                'message' => 'Income deleted.',
            ]);
        });
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $income = FinanceIncome::findOrFail($id);

        if ($income->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending incomes can be approved.',
            ], 422);
        }

        return DB::transaction(function () use ($income, $request) {
            $income->update([
                'status'      => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            FinanceAccount::where('id', $income->account_id)
                ->increment('balance', $income->amount);

            return response()->json([
                'success' => true,
                'message' => 'Income approved.',
                'data'    => $income->load([
                    'account:id,name,type',
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
        $income = FinanceIncome::findOrFail($id);

        $request->validate([
            'rejection_note' => ['required', 'string', 'max:500'],
        ]);

        if ($income->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending incomes can be rejected.',
            ], 422);
        }

        $income->update([
            'status'         => 'rejected',
            'rejection_note' => $request->string('rejection_note'),
            'approved_by'    => $request->user()->id,
            'approved_at'    => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Income rejected.',
            'data'    => $income->load([
                'account:id,name,type',
                'category:id,name,type,color',
                'assignedBy:id,name',
                'createdBy:id,name',
                'approvedBy:id,name',
            ]),
        ]);
    }
}
