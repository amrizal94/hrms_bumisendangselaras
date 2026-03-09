<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShiftResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'name'                   => $this->name,
            'check_in_time'          => substr($this->check_in_time, 0, 5),  // "08:00"
            'check_out_time'         => substr($this->check_out_time, 0, 5),
            'late_tolerance_minutes' => $this->late_tolerance_minutes,
            'work_days'              => $this->work_days,
            'is_active'              => $this->is_active,
            'employee_count'         => $this->whenLoaded('employees', fn() => $this->employees->count()),
            'created_at'             => $this->created_at?->toISOString(),
        ];
    }
}
