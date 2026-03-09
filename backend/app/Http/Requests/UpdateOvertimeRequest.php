<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOvertimeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date'           => ['nullable', 'date', 'before_or_equal:today'],
            'overtime_hours' => ['nullable', 'numeric', 'min:0.5', 'max:12'],
            'overtime_type'  => ['nullable', 'in:regular,weekend,holiday'],
            'reason'         => ['nullable', 'string', 'min:5', 'max:1000'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ];
    }
}
