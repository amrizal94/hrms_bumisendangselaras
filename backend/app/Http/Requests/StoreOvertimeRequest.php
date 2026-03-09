<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOvertimeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date'           => ['required', 'date', 'before_or_equal:today'],
            'overtime_hours' => ['required', 'numeric', 'min:0.5', 'max:12'],
            'overtime_type'  => ['required', 'in:regular,weekend,holiday'],
            'reason'         => ['required', 'string', 'min:5', 'max:1000'],
            'employee_id'    => ['nullable', 'exists:employees,id'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ];
    }
}
