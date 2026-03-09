<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceIncome extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'account_id', 'category_id', 'amount', 'date',
        'reference_number', 'source', 'description', 'attachment',
        'status', 'rejection_note',
        'assigned_by', 'created_by', 'approved_by', 'approved_at',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'date'        => 'date',
        'approved_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'account_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinanceCategory::class, 'category_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
