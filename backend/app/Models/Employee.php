<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Shift;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'employee_number',
        'department_id',
        'shift_id',
        'position',
        'employment_type',
        'status',
        'join_date',
        'end_date',
        'basic_salary',
        'gender',
        'birth_date',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'bank_name',
        'bank_account_number',
        'tax_id',
        'national_id',
    ];

    protected function casts(): array
    {
        return [
            'join_date'  => 'date',
            'end_date'   => 'date',
            'birth_date' => 'date',
            'basic_salary' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function faceData(): HasOne
    {
        return $this->hasOne(FaceData::class);
    }
}
