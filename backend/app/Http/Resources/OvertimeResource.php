<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OvertimeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'date'             => $this->date?->toDateString(),
            'overtime_hours'   => (float) $this->overtime_hours,
            'overtime_type'    => $this->overtime_type,
            'reason'           => $this->reason,
            'status'           => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'notes'            => $this->notes,
            'approved_at'      => $this->approved_at?->toISOString(),
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
            'approved_by'  => $this->whenLoaded('approvedBy', fn() => $this->approvedBy ? [
                'id'   => $this->approvedBy->id,
                'name' => $this->approvedBy->name,
            ] : null),
            'created_at'   => $this->created_at?->toISOString(),
        ];
    }
}
