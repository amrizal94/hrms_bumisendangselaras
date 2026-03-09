<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Asset extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'asset_category_id', 'name', 'asset_code', 'serial_number',
        'brand', 'model', 'purchase_date', 'purchase_price', 'warranty_until',
        'condition', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date'  => 'date',
            'warranty_until' => 'date',
            'purchase_price' => 'decimal:2',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(AssetAssignment::class);
    }

    public function currentAssignment(): HasOne
    {
        return $this->hasOne(AssetAssignment::class)->whereNull('returned_date')->latest();
    }
}
