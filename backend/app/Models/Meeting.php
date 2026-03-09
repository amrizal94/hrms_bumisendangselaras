<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Meeting extends Model
{
    protected $fillable = [
        'title',
        'description',
        'meeting_date',
        'start_time',
        'end_time',
        'location',
        'meeting_url',
        'target_roles',
        'created_by',
    ];

    protected $casts = [
        'meeting_date' => 'date',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function rsvps(): HasMany
    {
        return $this->hasMany(MeetingRsvp::class);
    }

    public function scopeUpcomingOrToday(Builder $query): Builder
    {
        return $query->whereDate('meeting_date', '>=', today());
    }

    public function getRsvpCountsAttribute(): array
    {
        $accepted = $this->rsvps()->where('status', 'accepted')->count();
        $declined = $this->rsvps()->where('status', 'declined')->count();
        return [
            'accepted' => $accepted,
            'declined' => $declined,
            'total'    => $accepted + $declined,
        ];
    }
}
