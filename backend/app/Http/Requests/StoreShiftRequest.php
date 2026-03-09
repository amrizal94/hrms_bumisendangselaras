<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                   => ['required', 'string', 'max:255'],
            'check_in_time'          => ['required', 'date_format:H:i'],
            'check_out_time'         => ['required', 'date_format:H:i'],
            'late_tolerance_minutes' => ['nullable', 'integer', 'min:0', 'max:120'],
            'work_days'              => ['required', 'array', 'min:1'],
            'work_days.*'            => ['integer', 'between:1,7'],
            'is_active'              => ['nullable', 'boolean'],
        ];
    }
}
