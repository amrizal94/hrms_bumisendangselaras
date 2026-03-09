<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $accounts = FinanceAccount::with('createdBy:id,name')
            ->when($request->filled('type'), fn($q) => $q->where('type', $request->string('type')))
            ->when($request->filled('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $accounts,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'type'           => ['required', 'in:bank,cash,e-wallet,other'],
            'bank_name'      => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'account_holder' => ['nullable', 'string', 'max:255'],
            'balance'        => ['nullable', 'numeric', 'min:0'],
            'description'    => ['nullable', 'string', 'max:1000'],
            'is_active'      => ['nullable', 'boolean'],
        ]);

        $account = FinanceAccount::create(array_merge($validated, [
            'created_by' => $request->user()->id,
            'balance'    => $validated['balance'] ?? 0,
            'is_active'  => $validated['is_active'] ?? true,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully.',
            'data'    => $account->load('createdBy:id,name'),
        ], 201);
    }

    public function show(FinanceAccount $account): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $account->load('createdBy:id,name'),
        ]);
    }

    public function update(Request $request, FinanceAccount $account): JsonResponse
    {
        $validated = $request->validate([
            'name'           => ['sometimes', 'string', 'max:255'],
            'type'           => ['sometimes', 'in:bank,cash,e-wallet,other'],
            'bank_name'      => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'account_holder' => ['nullable', 'string', 'max:255'],
            'description'    => ['nullable', 'string', 'max:1000'],
            'is_active'      => ['nullable', 'boolean'],
        ]);

        $account->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Account updated successfully.',
            'data'    => $account->load('createdBy:id,name'),
        ]);
    }

    public function destroy(FinanceAccount $account): JsonResponse
    {
        $account->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted.',
        ]);
    }

    public function summary(): JsonResponse
    {
        $accounts = FinanceAccount::where('is_active', true)->get();

        $totalBalance = $accounts->sum('balance');

        $countByType = $accounts->groupBy('type')->map->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_balance' => (float) $totalBalance,
                'count_by_type' => $countByType,
                'total_accounts' => $accounts->count(),
            ],
        ]);
    }
}
