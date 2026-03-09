<?php

namespace App\Models;

use App\Models\Holiday;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PayrollRecord extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'employee_id',
        'period_year',
        'period_month',
        'basic_salary',
        'allowances',
        'overtime_pay',
        'reimbursement',
        'gross_salary',
        'absent_deduction',
        'other_deductions',
        'tax_deduction',
        'bpjs_deduction',
        'net_salary',
        'working_days',
        'present_days',
        'absent_days',
        'leave_days',
        'status',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class)->withTrashed();
    }

    // -----------------------------------------------------------
    // Count Mon–Fri working days in a given month, excluding
    // public holidays stored in the holidays table.
    // $holidayDates: pre-fetched array of 'Y-m-d' strings (avoids
    // duplicate DB query when called from buildPayrollData).
    // -----------------------------------------------------------
    public static function countWorkingDays(int $year, int $month, array $holidayDates = []): int
    {
        $days  = 0;
        $total = Carbon::create($year, $month, 1)->daysInMonth;

        for ($d = 1; $d <= $total; $d++) {
            $date = Carbon::create($year, $month, $d);
            if (!$date->isWeekend() && !in_array($date->toDateString(), $holidayDates)) {
                $days++;
            }
        }

        return $days;
    }

    // -----------------------------------------------------------
    // Build payroll data for one employee + period from DB
    // -----------------------------------------------------------
    public static function buildPayrollData(Employee $employee, int $year, int $month): array
    {
        $startDate   = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate     = $startDate->copy()->endOfMonth();

        // Fetch public holidays once — reused for both countWorkingDays and holiday_days metric
        $holidayDates = Holiday::whereBetween('date', [$startDate, $endDate])
            ->pluck('date')
            ->map(fn($d) => $d->toDateString())
            ->all();

        $workingDays = self::countWorkingDays($year, $month, $holidayDates);

        // Attendance for the period
        $attendanceRecords = AttendanceRecord::where('employee_id', $employee->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        $presentDays = $attendanceRecords
            ->whereIn('status', ['present', 'late', 'half_day'])
            ->count();

        // Approved leave days overlapping the period
        $leaveDays = LeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where(fn($q) => $q
                ->whereBetween('start_date', [$startDate, $endDate])
                ->orWhereBetween('end_date', [$startDate, $endDate])
                ->orWhere(fn($q2) => $q2->where('start_date', '<=', $startDate)->where('end_date', '>=', $endDate))
            )
            ->sum('total_days');

        // Clamp to working days
        $leaveDays   = min((int) $leaveDays, $workingDays);
        $presentDays = min($presentDays, $workingDays);
        $absentDays  = max(0, $workingDays - $presentDays - $leaveDays);

        $basicSalary = (float) $employee->basic_salary;

        // Absent deduction: proportional
        $absentDeduction = $workingDays > 0
            ? round(($absentDays / $workingDays) * $basicSalary, 2)
            : 0;

        // Overtime pay from approved requests in this period
        // Hourly rate = basic_salary / (working_days * 8)
        $hourlyRate = $workingDays > 0 ? $basicSalary / ($workingDays * 8) : 0;
        $overtimeMultipliers = ['regular' => 1.5, 'weekend' => 2.0, 'holiday' => 3.0];

        $overtimeRecords = OvertimeRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        $overtimePay = $overtimeRecords->sum(function ($rec) use ($hourlyRate, $overtimeMultipliers) {
            $multiplier = $overtimeMultipliers[$rec->overtime_type] ?? 1.5;
            return (float) $rec->overtime_hours * $hourlyRate * $multiplier;
        });
        $overtimePay = round($overtimePay, 2);

        $reimbursement = \App\Models\Expense::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');
        $reimbursement = round((float) $reimbursement, 2);

        $grossSalary   = $basicSalary + $overtimePay; // allowances added manually
        $taxRate       = (float) Setting::get('payroll.tax_rate', '5') / 100;
        $bpjsRate      = (float) Setting::get('payroll.bpjs_rate', '3') / 100;
        $taxDeduction  = round($grossSalary * $taxRate, 2);
        $bpjsDeduction = round($basicSalary * $bpjsRate, 2);
        // Reimbursement added after deductions (not taxed)
        $netSalary = max(0, $grossSalary - $absentDeduction - $taxDeduction - $bpjsDeduction + $reimbursement);

        return [
            'basic_salary'     => $basicSalary,
            'allowances'       => 0,
            'overtime_pay'     => $overtimePay,
            'reimbursement'    => $reimbursement,
            'gross_salary'     => $grossSalary,
            'absent_deduction' => $absentDeduction,
            'other_deductions' => 0,
            'tax_deduction'    => $taxDeduction,
            'bpjs_deduction'   => $bpjsDeduction,
            'net_salary'       => $netSalary,
            'working_days'     => $workingDays,
            'present_days'     => $presentDays,
            'absent_days'      => $absentDays,
            'leave_days'       => $leaveDays,
            'holiday_days'     => count($holidayDates),
        ];
    }

    // -----------------------------------------------------------
    // Recalculate derived fields after edits
    // -----------------------------------------------------------
    public function recalculate(): void
    {
        $gross = (float) $this->basic_salary
                + (float) $this->allowances
                + (float) $this->overtime_pay;

        $taxRate  = (float) Setting::get('payroll.tax_rate', '5') / 100;
        $bpjsRate = (float) Setting::get('payroll.bpjs_rate', '3') / 100;

        $this->gross_salary   = $gross;
        $this->tax_deduction  = round($gross * $taxRate, 2);
        $this->bpjs_deduction = round((float) $this->basic_salary * $bpjsRate, 2);
        $this->net_salary    = max(0,
            $gross
            - (float) $this->absent_deduction
            - (float) $this->other_deductions
            - $this->tax_deduction
            - $this->bpjs_deduction
            + (float) $this->reimbursement
        );
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function periodLabel(): string
    {
        return Carbon::create($this->period_year, $this->period_month, 1)->format('F Y');
    }
}
