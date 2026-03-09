<?php

namespace App\Http\Resources;

use App\Http\Resources\ShiftResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Sensitive fields only visible to admin, HR, and director
        $sensitive = $request->user()?->hasRole(['admin', 'hr', 'director']) ?? false;

        return [
            'id'              => $this->id,
            'employee_number' => $this->employee_number,
            'position'        => $this->position,
            'employment_type' => $this->employment_type,
            'status'          => $this->status,
            'join_date'       => $this->join_date?->toDateString(),
            'end_date'        => $this->end_date?->toDateString(),
            'gender'          => $this->gender,

            // --- Sensitive: hidden for manager ---
            'basic_salary'            => $this->when($sensitive, $this->basic_salary),
            'birth_date'              => $this->when($sensitive, $this->birth_date?->toDateString()),
            'address'                 => $this->when($sensitive, $this->address),
            'emergency_contact_name'  => $this->when($sensitive, $this->emergency_contact_name),
            'emergency_contact_phone' => $this->when($sensitive, $this->emergency_contact_phone),
            'bank_name'               => $this->when($sensitive, $this->bank_name),
            'bank_account_number'     => $this->when($sensitive, $this->bank_account_number),
            'tax_id'                  => $this->when($sensitive, $this->tax_id),
            'national_id'             => $this->when($sensitive, $this->national_id),

            'user' => $this->whenLoaded('user', fn() => [
                'id'        => $this->user->id,
                'name'      => $this->user->name,
                'email'     => $this->when($sensitive, $this->user->email),
                'phone'     => $this->when($sensitive, $this->user->phone),
                'avatar'    => $this->user->avatar,
                'is_active' => $this->user->is_active,
                'role'      => $this->user->role_name,
            ]),
            'department' => $this->whenLoaded('department', fn() => [
                'id'   => $this->department?->id,
                'name' => $this->department?->name,
                'code' => $this->department?->code,
            ]),
            'shift'      => new ShiftResource($this->whenLoaded('shift')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
