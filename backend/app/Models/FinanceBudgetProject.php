<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceBudgetProject extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'account_id', 'name', 'description', 'total_budget', 'spent_amount',
        'start_date', 'end_date', 'status', 'notes',
        'assigned_by', 'created_by',
    ];

    protected $casts = [
        'total_budget' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'start_date'   => 'date',
        'end_date'     => 'date',
    ];

    // Sisa anggaran (computed attribute)
    public function getRemainingBudgetAttribute(): float
    {
        return (float) $this->total_budget - (float) $this->spent_amount;
    }

    // Persentase terpakai
    public function getUsagePercentAttribute(): float
    {
        if ($this->total_budget <= 0) return 0;
        return round(($this->spent_amount / $this->total_budget) * 100, 2);
    }

    protected $appends = ['remaining_budget', 'usage_percent'];

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'account_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function expenditures(): HasMany
    {
        return $this->hasMany(FinanceExpenditure::class, 'budget_project_id');
    }
}
