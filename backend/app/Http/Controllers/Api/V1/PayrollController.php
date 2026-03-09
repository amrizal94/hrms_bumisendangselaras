<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PayrollResource;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\PayrollRecord;
use App\Notifications\PayrollPaid;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    // ---------------------------------------------------------------
    // Admin/HR: list all payroll records with filters
    // ---------------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = PayrollRecord::query()
            ->with(['employee.user', 'employee.department']);

        if ($request->filled('year')) {
            $query->where('period_year', $request->integer('year'));
        }

        if ($request->filled('month')) {
            $query->where('period_month', $request->integer('month'));
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $request->integer('department_id')));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->whereHas('employee.user', fn($q) => $q->where('name', 'ilike', "%{$search}%"));
        }

        $records = $query
            ->orderBy('period_year', 'desc')
            ->orderBy('period_month', 'desc')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => PayrollResource::collection($records->items()),
            'meta'    => [
                'total'        => $records->total(),
                'per_page'     => $records->perPage(),
                'current_page' => $records->currentPage(),
                'last_page'    => $records->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: bulk generate payroll for all active employees
    // ---------------------------------------------------------------
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year'  => ['required', 'integer', 'min:2020', 'max:2099'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $year  = $validated['year'];
        $month = $validated['month'];

        $employees = Employee::where('status', 'active')
            ->with(['department'])
            ->get();

        $created = 0;
        $skipped = 0;

        foreach ($employees as $employee) {
            // Skip if already exists
            if (PayrollRecord::where('employee_id', $employee->id)
                ->where('period_year', $year)
                ->where('period_month', $month)
                ->exists()) {
                $skipped++;
                continue;
            }

            $data = PayrollRecord::buildPayrollData($employee, $year, $month);

            PayrollRecord::create(array_merge($data, [
                'employee_id'  => $employee->id,
                'period_year'  => $year,
                'period_month' => $month,
                'status'       => 'draft',
            ]));

            $created++;
        }

        AuditLog::record('payroll.generate', $request, [
            'period'  => "{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT),
            'created' => $created,
            'skipped' => $skipped,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Generated {$created} payroll record(s). Skipped {$skipped} existing.",
            'data'    => ['created' => $created, 'skipped' => $skipped],
        ], 201);
    }

    // ---------------------------------------------------------------
    // Show single payroll record
    // ---------------------------------------------------------------
    public function show(PayrollRecord $payroll): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new PayrollResource($payroll->load(['employee.user', 'employee.department'])),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: update payroll (only draft)
    // ---------------------------------------------------------------
    public function update(Request $request, PayrollRecord $payroll): JsonResponse
    {
        if (!$payroll->isDraft()) {
            return response()->json(['success' => false, 'message' => 'Only draft payrolls can be edited.'], 422);
        }

        $validated = $request->validate([
            'allowances'       => ['numeric', 'min:0'],
            'overtime_pay'     => ['numeric', 'min:0'],
            'other_deductions' => ['numeric', 'min:0'],
            'notes'            => ['nullable', 'string', 'max:500'],
        ]);

        $payroll->fill($validated);
        $payroll->recalculate();
        $payroll->save();

        return response()->json([
            'success' => true,
            'message' => 'Payroll updated.',
            'data'    => new PayrollResource($payroll->load(['employee.user', 'employee.department'])),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: delete draft payroll
    // ---------------------------------------------------------------
    public function destroy(PayrollRecord $payroll): JsonResponse
    {
        if (!$payroll->isDraft()) {
            return response()->json(['success' => false, 'message' => 'Only draft payrolls can be deleted.'], 422);
        }

        $payroll->delete();

        return response()->json(['success' => true, 'message' => 'Payroll record deleted.']);
    }

    // ---------------------------------------------------------------
    // Admin/HR: finalize payroll (draft → finalized)
    // ---------------------------------------------------------------
    public function finalize(PayrollRecord $payroll): JsonResponse
    {
        if ($payroll->status !== 'draft') {
            return response()->json(['success' => false, 'message' => 'Only draft payrolls can be finalized.'], 422);
        }

        $payroll->update(['status' => 'finalized']);

        return response()->json([
            'success' => true,
            'message' => 'Payroll finalized.',
            'data'    => new PayrollResource($payroll->load(['employee.user', 'employee.department'])),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: finalize ALL drafts for a period
    // ---------------------------------------------------------------
    public function finalizeAll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year'  => ['required', 'integer'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $count = PayrollRecord::where('period_year', $validated['year'])
            ->where('period_month', $validated['month'])
            ->where('status', 'draft')
            ->update(['status' => 'finalized']);

        return response()->json([
            'success' => true,
            'message' => "{$count} payroll record(s) finalized.",
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: mark finalized payroll as paid
    // ---------------------------------------------------------------
    public function markPaid(PayrollRecord $payroll): JsonResponse
    {
        if ($payroll->status !== 'finalized') {
            return response()->json(['success' => false, 'message' => 'Only finalized payrolls can be marked as paid.'], 422);
        }

        $payroll->update(['status' => 'paid', 'paid_at' => now()]);
        $payroll->load('employee.user');
        optional($payroll->employee?->user)->notify(new PayrollPaid($payroll));

        AuditLog::record('payroll.paid', $request, [
            'target_label' => $payroll->employee?->user?->name ?? '—',
            'period'       => "{$payroll->period_year}-" . str_pad($payroll->period_month, 2, '0', STR_PAD_LEFT),
            'net_salary'   => (float) $payroll->net_salary,
        ], 'payroll', $payroll->id);

        return response()->json([
            'success' => true,
            'message' => 'Payroll marked as paid.',
            'data'    => new PayrollResource($payroll->load(['employee.user', 'employee.department'])),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: mark ALL finalized payrolls for a period as paid
    // ---------------------------------------------------------------
    public function markAllPaid(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year'  => ['required', 'integer'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $records = PayrollRecord::where('period_year', $validated['year'])
            ->where('period_month', $validated['month'])
            ->where('status', 'finalized')
            ->with('employee.user')
            ->get();

        $count = 0;
        foreach ($records as $record) {
            $record->update(['status' => 'paid', 'paid_at' => now()]);
            optional($record->employee?->user)->notify(new PayrollPaid($record));
            $count++;
        }

        AuditLog::record('payroll.paid', $request, [
            'target_label' => 'Bulk',
            'period'       => "{$validated['year']}-" . str_pad($validated['month'], 2, '0', STR_PAD_LEFT),
            'count'        => $count,
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$count} payroll record(s) marked as paid.",
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: own payslip history
    // ---------------------------------------------------------------
    public function myPayslips(Request $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found.'], 404);
        }

        $records = PayrollRecord::where('employee_id', $employee->id)
            ->with(['employee.user', 'employee.department'])
            ->whereIn('status', ['finalized', 'paid'])
            ->orderBy('period_year', 'desc')
            ->orderBy('period_month', 'desc')
            ->paginate($request->integer('per_page', 12));

        return response()->json([
            'success' => true,
            'data'    => PayrollResource::collection($records->items()),
            'meta'    => [
                'total'        => $records->total(),
                'per_page'     => $records->perPage(),
                'current_page' => $records->currentPage(),
                'last_page'    => $records->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Summary stats for a period
    // ---------------------------------------------------------------
    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year'  => ['required', 'integer'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $records = PayrollRecord::where('period_year', $validated['year'])
            ->where('period_month', $validated['month'])
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_employees'  => $records->count(),
                'total_gross'      => $records->sum('gross_salary'),
                'total_deductions' => $records->sum(fn($r) =>
                    $r->absent_deduction + $r->other_deductions + $r->tax_deduction + $r->bpjs_deduction
                ),
                'total_net'        => $records->sum('net_salary'),
                'draft_count'      => $records->where('status', 'draft')->count(),
                'finalized_count'  => $records->where('status', 'finalized')->count(),
                'paid_count'       => $records->where('status', 'paid')->count(),
            ],
        ]);
    }
}
