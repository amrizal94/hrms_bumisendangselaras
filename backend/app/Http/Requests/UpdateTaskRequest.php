<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'project_id'                  => ['sometimes', 'exists:projects,id'],
            'title'                       => ['sometimes', 'string', 'max:500'],
            'description'                 => ['sometimes', 'nullable', 'string', 'max:5000'],
            'status'                      => ['sometimes', 'nullable', 'in:todo,in_progress,done,cancelled'],
            'priority'                    => ['sometimes', 'nullable', 'in:low,medium,high,urgent'],
            'deadline'                    => ['sometimes', 'nullable', 'date'],
            'assigned_to'                 => ['sometimes', 'nullable', 'exists:employees,id'],
            'label_ids'                   => ['sometimes', 'nullable', 'array'],
            'label_ids.*'                 => ['exists:labels,id'],
            'checklist_items'             => ['sometimes', 'nullable', 'array'],
            'checklist_items.*.title'     => ['required', 'string', 'max:500'],
        ];
    }
}
