<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status'      => ['nullable', 'in:active,completed,archived'],
            'deadline'    => ['nullable', 'date'],
        ];
    }
}
