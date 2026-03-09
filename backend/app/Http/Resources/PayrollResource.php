<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'period_year'      => $this->period_year,
            'period_month'     => $this->period_month,
            'period_label'     => $this->periodLabel(),

            // Earnings
            'basic_salary'     => (float) $this->basic_salary,
            'allowances'       => (float) $this->allowances,
            'overtime_pay'     => (float) $this->overtime_pay,
            'reimbursement'    => (float) ($this->reimbursement ?? 0),
            'gross_salary'     => (float) $this->gross_salary,

            // Deductions
            'absent_deduction' => (float) $this->absent_deduction,
            'other_deductions' => (float) $this->other_deductions,
            'tax_deduction'    => (float) $this->tax_deduction,
            'bpjs_deduction'   => (float) $this->bpjs_deduction,
            'total_deductions' => round(
                (float) $this->absent_deduction +
                (float) $this->other_deductions +
                (float) $this->tax_deduction +
                (float) $this->bpjs_deduction, 2
            ),

            'net_salary'       => (float) $this->net_salary,

            // Attendance
            'working_days'     => $this->working_days,
            'present_days'     => $this->present_days,
            'absent_days'      => $this->absent_days,
            'leave_days'       => $this->leave_days,

            'status'           => $this->status,
            'paid_at'          => $this->paid_at?->toISOString(),
            'notes'            => $this->notes,

            'employee'         => $this->whenLoaded('employee', fn() => [
                'id'              => $this->employee->id,
                'employee_number' => $this->employee->employee_number,
                'position'        => $this->employee->position,
                'user'            => [
                    'id'     => $this->employee->user->id,
                    'name'   => $this->employee->user->name,
                    'avatar' => $this->employee->user->avatar,
                ],
                'department' => $this->employee->department ? [
                    'id'   => $this->employee->department->id,
                    'name' => $this->employee->department->name,
                ] : null,
            ]),
            'created_at'       => $this->created_at?->toISOString(),
        ];
    }
}
