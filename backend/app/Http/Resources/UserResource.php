<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'role' => $this->getRoleNames()->first() ?? 'staff',
            'is_active' => $this->is_active,
            'must_change_password' => (bool) $this->must_change_password,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
