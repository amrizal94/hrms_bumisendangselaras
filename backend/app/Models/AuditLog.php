<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    // Immutable — only created_at, no updated_at
    public $timestamps  = false;
    const UPDATED_AT    = null;
    const CREATED_AT    = 'created_at';

    protected $fillable = [
        'user_id',
        'action',
        'target_type',
        'target_id',
        'ip_address',
        'metadata',
    ];

    protected $casts = [
        'metadata'   => 'array',
        'created_at' => 'datetime',
    ];

    // ---------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id')->withTrashed();
    }

    // ---------------------------------------------------------------
    // Convenience: write an audit entry from within a controller
    // ---------------------------------------------------------------
    public static function record(
        string  $action,
        Request $request,
        array   $metadata  = [],
        ?string $targetType = null,
        ?int    $targetId   = null,
    ): self {
        return self::create([
            'user_id'     => $request->user()?->id,
            'action'      => $action,
            'target_type' => $targetType,
            'target_id'   => $targetId,
            'ip_address'  => $request->ip(),
            'metadata'    => $metadata ?: null,
        ]);
    }
}
