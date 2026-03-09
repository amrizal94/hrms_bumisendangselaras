<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceAccount extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'type', 'bank_name', 'account_number',
        'account_holder', 'balance', 'description', 'is_active', 'created_by',
    ];

    protected $casts = [
        'balance'   => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function incomes(): HasMany
    {
        return $this->hasMany(FinanceIncome::class, 'account_id');
    }

    public function expenditures(): HasMany
    {
        return $this->hasMany(FinanceExpenditure::class, 'account_id');
    }

    public function budgetProjects(): HasMany
    {
        return $this->hasMany(FinanceBudgetProject::class, 'account_id');
    }
}
