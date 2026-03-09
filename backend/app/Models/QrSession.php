<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class QrSession extends Model
{
    protected $fillable = [
        'token',
        'type',
        'date',
        'created_by',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'date'        => 'date',
            'valid_from'  => 'datetime',
            'valid_until' => 'datetime',
            'is_active'   => 'boolean',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isValid(): bool
    {
        return $this->is_active
            && Carbon::now()->between($this->valid_from, $this->valid_until)
            && $this->date->isToday();
    }
}
