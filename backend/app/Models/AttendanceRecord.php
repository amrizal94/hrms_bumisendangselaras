<?php

namespace App\Models;

use App\Models\Setting;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AttendanceRecord extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'employee_id',
        'date',
        'check_in',
        'check_out',
        'status',
        'work_hours',
        'notes',
        'latitude',
        'longitude',
        'location_accuracy',
        'is_mock_location',
        'check_in_method',
        'is_late',
        'late_minutes',
    ];

    protected function casts(): array
    {
        return [
            'date'             => 'date',
            'check_in'         => 'datetime',
            'check_out'        => 'datetime',
            'work_hours'       => 'decimal:2',
            'latitude'         => 'float',
            'longitude'        => 'float',
            'location_accuracy'=> 'float',
            'is_mock_location' => 'boolean',
            'is_late'          => 'boolean',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class)->withTrashed();
    }

    /**
     * Calculate work hours from check_in and check_out.
     */
    public function calculateWorkHours(): float
    {
        if (!$this->check_in || !$this->check_out) {
            return 0;
        }

        return round($this->check_out->diffInMinutes($this->check_in) / 60, 2);
    }

    /**
     * Haversine distance in meters between two GPS coordinates.
     */
    public static function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $r  = 6371000; // Earth radius in meters
        $φ1 = deg2rad($lat1);
        $φ2 = deg2rad($lat2);
        $Δφ = deg2rad($lat2 - $lat1);
        $Δλ = deg2rad($lon2 - $lon1);
        $a  = sin($Δφ / 2) ** 2 + cos($φ1) * cos($φ2) * sin($Δλ / 2) ** 2;
        return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /**
     * Determine status based on check_in time.
     * Late if checked in after 09:00.
     */
    public static function resolveStatus(\Carbon\Carbon $checkIn): string
    {
        $threshold = Setting::get('attendance.late_threshold', '09:00');
        [$hour, $minute] = array_map('intval', explode(':', $threshold));
        $cutoff = $checkIn->copy()->setTime($hour, $minute, 0);
        return $checkIn->greaterThan($cutoff) ? 'late' : 'present';
    }
}
