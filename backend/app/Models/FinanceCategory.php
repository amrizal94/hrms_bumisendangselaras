<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceCategory extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'type', 'color', 'description', 'is_active', 'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function incomes(): HasMany
    {
        return $this->hasMany(FinanceIncome::class, 'category_id');
    }

    public function expenditures(): HasMany
    {
        return $this->hasMany(FinanceExpenditure::class, 'category_id');
    }
}
