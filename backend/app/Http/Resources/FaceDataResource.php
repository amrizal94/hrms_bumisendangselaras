<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class FaceDataResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'is_active'   => $this->is_active,
            'enrolled_at' => $this->enrolled_at?->toISOString(),
            'image_url'   => $this->image_path
                ? Storage::disk('public')->url($this->image_path)
                : null,
            'enrolled_by' => $this->whenLoaded('enrolledBy', fn() => $this->enrolledBy ? [
                'id'   => $this->enrolledBy->id,
                'name' => $this->enrolledBy->name,
            ] : null),
            'employee'    => $this->whenLoaded('employee', fn() => [
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
        ];
    }
}
