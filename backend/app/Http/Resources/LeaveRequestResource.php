<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'start_date'       => $this->start_date?->toDateString(),
            'end_date'         => $this->end_date?->toDateString(),
            'total_days'       => $this->total_days,
            'reason'           => $this->reason,
            'status'           => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'approved_at'      => $this->approved_at?->toISOString(),
            'leave_type'       => $this->whenLoaded('leaveType', fn() => [
                'id'      => $this->leaveType->id,
                'name'    => $this->leaveType->name,
                'code'    => $this->leaveType->code,
                'is_paid' => $this->leaveType->is_paid,
            ]),
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
            'approved_by'      => $this->whenLoaded('approvedBy', fn() => $this->approvedBy ? [
                'id'   => $this->approvedBy->id,
                'name' => $this->approvedBy->name,
            ] : null),
            'created_at'       => $this->created_at?->toISOString(),
        ];
    }
}
