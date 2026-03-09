<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'code'            => $this->code,
            'description'     => $this->description,
            'is_active'       => $this->is_active,
            'manager'         => $this->whenLoaded('manager', fn() => [
                'id'   => $this->manager->id,
                'name' => $this->manager->name,
            ]),
            'employees_count' => $this->when(
                isset($this->employees_count),
                $this->employees_count
            ),
            'created_at'      => $this->created_at?->toISOString(),
            'updated_at'      => $this->updated_at?->toISOString(),
        ];
    }
}
