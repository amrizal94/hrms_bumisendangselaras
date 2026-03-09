<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $departmentId = $this->route('department')?->id ?? $this->route('department');

        return [
            'name'        => ['required', 'string', 'max:255'],
            'code'        => ['required', 'string', 'max:50', "unique:departments,code,{$departmentId}"],
            'description' => ['nullable', 'string'],
            'manager_id'  => ['nullable', 'exists:users,id'],
            'is_active'   => ['boolean'],
        ];
    }
}
