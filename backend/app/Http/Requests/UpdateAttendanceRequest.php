<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'check_in'  => ['nullable', 'date_format:Y-m-d H:i:s'],
            'check_out' => ['nullable', 'date_format:Y-m-d H:i:s', 'after:check_in'],
            'status'    => ['nullable', 'in:present,late,absent,half_day,on_leave'],
            'notes'     => ['nullable', 'string', 'max:500'],
        ];
    }
}
