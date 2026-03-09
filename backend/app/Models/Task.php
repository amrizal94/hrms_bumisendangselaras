<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'deadline',
        'assigned_to',
        'created_by',
        'sort_order',
        'photo_path',
        'self_reported',
        'notes',
        'created_latitude',
        'created_longitude',
        'created_face_confidence',
        'completed_latitude',
        'completed_longitude',
        'completed_location_accuracy',
        'completed_is_mock',
        'completed_face_confidence',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'deadline'                    => 'date',
            'project_id'                  => 'integer',
            'assigned_to'                 => 'integer',
            'created_by'                  => 'integer',
            'sort_order'                  => 'integer',
            'created_latitude'            => 'float',
            'created_longitude'           => 'float',
            'created_face_confidence'     => 'float',
            'completed_latitude'          => 'float',
            'completed_longitude'         => 'float',
            'completed_location_accuracy' => 'float',
            'completed_is_mock'           => 'boolean',
            'completed_face_confidence'   => 'float',
            'completed_at'                => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'task_label');
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(TaskChecklistItem::class)->orderBy('sort_order');
    }
}
