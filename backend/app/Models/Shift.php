<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    protected $fillable = [
        'name',
        'check_in_time',
        'check_out_time',
        'late_tolerance_minutes',
        'work_days',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'work_days' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
