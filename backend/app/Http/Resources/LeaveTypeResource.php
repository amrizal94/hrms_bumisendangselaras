<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'code'              => $this->code,
            'description'       => $this->description,
            'max_days_per_year' => $this->max_days_per_year,
            'is_paid'           => $this->is_paid,
            'is_active'         => $this->is_active,
        ];
    }
}
