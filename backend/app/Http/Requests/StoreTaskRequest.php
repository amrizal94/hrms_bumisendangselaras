<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'project_id'                  => ['required', 'exists:projects,id'],
            'title'                       => ['required', 'string', 'max:500'],
            'description'                 => ['nullable', 'string', 'max:5000'],
            'status'                      => ['nullable', 'in:todo,in_progress,done,cancelled'],
            'priority'                    => ['nullable', 'in:low,medium,high,urgent'],
            'deadline'                    => ['nullable', 'date'],
            'assigned_to'                 => ['nullable', 'exists:employees,id'],
            'label_ids'                   => ['nullable', 'array'],
            'label_ids.*'                 => ['exists:labels,id'],
            'checklist_items'             => ['nullable', 'array'],
            'checklist_items.*.title'     => ['required', 'string', 'max:500'],
            'notes'                       => ['nullable', 'string', 'max:1000'],
        ];
    }
}
