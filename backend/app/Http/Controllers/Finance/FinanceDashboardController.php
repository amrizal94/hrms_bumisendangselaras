<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use App\Models\FinanceBudgetProject;
use App\Models\FinanceExpenditure;
use App\Models\FinanceIncome;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $now           = Carbon::now();
        $startOfMonth  = $now->copy()->startOfMonth();
        $endOfMonth    = $now->copy()->endOfMonth();

        // Total balance across all active accounts
        $totalBalance = FinanceAccount::where('is_active', true)->sum('balance');

        // Total approved income this month
        $totalIncomeThisMonth = FinanceIncome::where('status', 'approved')
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // Total approved expenditure this month
        $totalExpenditureThisMonth = FinanceExpenditure::where('status', 'approved')
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // Active budget projects count
        $activeProjectsCount = FinanceBudgetProject::where('status', 'active')->count();

        // Pending expenditures count
        $pendingExpendituresCount = FinanceExpenditure::where('status', 'pending')->count();

        // Monthly summary: last 6 months income vs expenditure
        $monthlySummary = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $start = $month->copy()->startOfMonth();
            $end   = $month->copy()->endOfMonth();

            $income = FinanceIncome::where('status', 'approved')
                ->whereBetween('date', [$start, $end])
                ->sum('amount');

            $expenditure = FinanceExpenditure::where('status', 'approved')
                ->whereBetween('date', [$start, $end])
                ->sum('amount');

            $monthlySummary[] = [
                'month'       => $month->format('Y-m'),
                'month_label' => $month->translatedFormat('M Y'),
                'income'      => (float) $income,
                'expenditure' => (float) $expenditure,
            ];
        }

        // Top 5 budget projects by spent_amount
        $topProjects = FinanceBudgetProject::with('account:id,name')
            ->whereIn('status', ['active', 'completed'])
            ->orderByDesc('spent_amount')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id'               => $p->id,
                'name'             => $p->name,
                'account'          => $p->account ? ['id' => $p->account->id, 'name' => $p->account->name] : null,
                'total_budget'     => (float) $p->total_budget,
                'spent_amount'     => (float) $p->spent_amount,
                'remaining_budget' => (float) $p->remaining_budget,
                'usage_percent'    => (float) $p->usage_percent,
                'status'           => $p->status,
            ]);

        // Recent transactions: last 10 mix of incomes + expenditures
        $recentIncomes = FinanceIncome::with('account:id,name', 'category:id,name')
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($i) => [
                'id'       => $i->id,
                'type'     => 'income',
                'date'     => $i->date?->toDateString(),
                'amount'   => (float) $i->amount,
                'label'    => $i->source,
                'status'   => $i->status,
                'account'  => $i->account ? ['id' => $i->account->id, 'name' => $i->account->name] : null,
                'category' => $i->category ? ['id' => $i->category->id, 'name' => $i->category->name] : null,
            ]);

        $recentExpenditures = FinanceExpenditure::with('account:id,name', 'category:id,name')
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($e) => [
                'id'       => $e->id,
                'type'     => 'expenditure',
                'date'     => $e->date?->toDateString(),
                'amount'   => (float) $e->amount,
                'label'    => $e->description ?? $e->vendor ?? 'Pengeluaran',
                'status'   => $e->status,
                'account'  => $e->account ? ['id' => $e->account->id, 'name' => $e->account->name] : null,
                'category' => $e->category ? ['id' => $e->category->id, 'name' => $e->category->name] : null,
            ]);

        $recentTransactions = $recentIncomes->concat($recentExpenditures)
            ->sortByDesc('date')
            ->values()
            ->take(10);

        return response()->json([
            'success' => true,
            'data'    => [
                'total_balance'                => (float) $totalBalance,
                'total_income_this_month'      => (float) $totalIncomeThisMonth,
                'total_expenditure_this_month' => (float) $totalExpenditureThisMonth,
                'active_projects_count'        => $activeProjectsCount,
                'pending_expenditures_count'   => $pendingExpendituresCount,
                'monthly_summary'              => $monthlySummary,
                'top_projects'                 => $topProjects->values(),
                'recent_transactions'          => $recentTransactions->values(),
            ],
        ]);
    }
}
