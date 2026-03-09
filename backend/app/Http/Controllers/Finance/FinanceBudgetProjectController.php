<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\FinanceBudgetProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceBudgetProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FinanceBudgetProject::with([
            'account:id,name,type',
            'assignedBy:id,name',
            'createdBy:id,name',
        ]);

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->integer('account_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('name', 'ilike', "%{$search}%");
        }

        $projects = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $projects->items(),
            'meta'    => [
                'total'        => $projects->total(),
                'per_page'     => $projects->perPage(),
                'current_page' => $projects->currentPage(),
                'last_page'    => $projects->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id'   => ['required', 'integer', 'exists:finance_accounts,id'],
            'name'         => ['required', 'string', 'max:255'],
            'description'  => ['nullable', 'string', 'max:1000'],
            'total_budget' => ['required', 'numeric', 'min:1'],
            'start_date'   => ['required', 'date'],
            'end_date'     => ['nullable', 'date', 'after_or_equal:start_date'],
            'status'       => ['nullable', 'in:planning,active,completed,cancelled'],
            'notes'        => ['nullable', 'string', 'max:1000'],
            'assigned_by'  => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $project = FinanceBudgetProject::create(array_merge($validated, [
            'created_by'   => $request->user()->id,
            'spent_amount' => 0,
            'status'       => $validated['status'] ?? 'planning',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Budget project created.',
            'data'    => $project->load([
                'account:id,name,type',
                'assignedBy:id,name',
                'createdBy:id,name',
            ]),
        ], 201);
    }

    public function show(FinanceBudgetProject $budgetProject): JsonResponse
    {
        $budgetProject->load([
            'account:id,name,type',
            'assignedBy:id,name',
            'createdBy:id,name',
        ]);

        $expenditureSummary = $budgetProject->expenditures()
            ->selectRaw('status, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('status')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => array_merge($budgetProject->toArray(), [
                'expenditure_summary' => $expenditureSummary,
            ]),
        ]);
    }

    public function update(Request $request, FinanceBudgetProject $budgetProject): JsonResponse
    {
        $validated = $request->validate([
            'account_id'   => ['sometimes', 'integer', 'exists:finance_accounts,id'],
            'name'         => ['sometimes', 'string', 'max:255'],
            'description'  => ['nullable', 'string', 'max:1000'],
            'total_budget' => ['sometimes', 'numeric', 'min:1'],
            'start_date'   => ['sometimes', 'date'],
            'end_date'     => ['nullable', 'date'],
            'status'       => ['sometimes', 'in:planning,active,completed,cancelled'],
            'notes'        => ['nullable', 'string', 'max:1000'],
            'assigned_by'  => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $budgetProject->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Budget project updated.',
            'data'    => $budgetProject->load([
                'account:id,name,type',
                'assignedBy:id,name',
                'createdBy:id,name',
            ]),
        ]);
    }

    public function destroy(FinanceBudgetProject $budgetProject): JsonResponse
    {
        $budgetProject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Budget project deleted.',
        ]);
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $project = FinanceBudgetProject::findOrFail($id);

        if ($project->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Project is already completed.',
            ], 422);
        }

        $project->update(['status' => 'completed']);

        return response()->json([
            'success' => true,
            'message' => 'Budget project marked as completed.',
            'data'    => $project->load([
                'account:id,name,type',
                'assignedBy:id,name',
                'createdBy:id,name',
            ]),
        ]);
    }
}
