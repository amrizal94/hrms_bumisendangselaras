<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // User account fields
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'phone'    => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:8'],

            // Employee fields
            'employee_number'         => ['required', 'string', 'max:50', 'unique:employees,employee_number'],
            'department_id'           => ['nullable', 'exists:departments,id'],
            'shift_id'                => ['nullable', 'exists:shifts,id'],
            'position'                => ['required', 'string', 'max:255'],
            'employment_type'         => ['required', 'in:full_time,part_time,contract,intern'],
            'status'                  => ['required', 'in:active,inactive,terminated,on_leave'],
            'join_date'               => ['required', 'date'],
            'end_date'                => ['nullable', 'date', 'after:join_date'],
            'basic_salary'            => ['required', 'numeric', 'min:0'],
            'gender'                  => ['nullable', 'in:male,female'],
            'birth_date'              => ['nullable', 'date', 'before:today'],
            'address'                 => ['nullable', 'string', 'max:500'],
            'emergency_contact_name'  => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'bank_name'               => ['nullable', 'string', 'max:255'],
            'bank_account_number'     => ['nullable', 'string', 'max:50'],
            'tax_id'                  => ['nullable', 'string', 'max:50'],
            'national_id'             => ['nullable', 'string', 'max:50'],
            'role'                    => ['nullable', 'string', 'in:staff,hr,manager,admin,director'],
        ];
    }
}
