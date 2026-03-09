<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'date'       => $this->date?->toDateString(),
            'check_in'   => $this->check_in?->toISOString(),
            'check_out'  => $this->check_out?->toISOString(),
            'status'     => $this->status,
            'work_hours' => $this->work_hours,
            'notes'             => $this->notes,
            'latitude'          => $this->latitude,
            'longitude'         => $this->longitude,
            'location_accuracy' => $this->location_accuracy,
            'is_mock_location'  => $this->is_mock_location,
            'check_in_method'   => $this->check_in_method,
            'is_late'           => $this->is_late,
            'late_minutes'      => $this->late_minutes,
            'employee'   => $this->whenLoaded('employee', fn() => [
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
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
