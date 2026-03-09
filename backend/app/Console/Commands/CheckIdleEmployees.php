<?php

namespace App\Console\Commands;

use App\Models\AttendanceRecord;
use App\Models\Task;
use App\Notifications\TaskIdleReminder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class CheckIdleEmployees extends Command
{
    protected $signature   = 'notifications:check-idle';
    protected $description = 'Send idle reminder to staff who have no task activity 2h after check-in';

    public function handle(): void
    {
        $cutoff = now()->subHours(2);
        $today  = today()->toDateString();

        $records = AttendanceRecord::with(['employee.user'])
            ->whereDate('check_in', $today)
            ->where('check_in', '<=', $cutoff)
            ->get();

        foreach ($records as $record) {
            $employee = $record->employee;
            $user     = $employee?->user;

            if (!$user || !$user->fcm_token) {
                continue;
            }

            // Only target staff role
            if (!$user->hasRole('staff')) {
                continue;
            }

            // Skip if already notified today
            $cacheKey = "idle_notif:{$user->id}:{$today}";
            if (Cache::has($cacheKey)) {
                continue;
            }

            // Check for task activity in the last 2 hours
            $hasActivity = Task::where(function ($q) use ($user, $cutoff) {
                // Task created (self-reported) recently
                $q->where('created_by', $user->id)->where('created_at', '>=', $cutoff);
            })->orWhere(function ($q) use ($employee, $cutoff) {
                // Assigned task updated recently (status change etc.)
                $q->where('assigned_to', $employee->id)->where('updated_at', '>=', $cutoff);
            })->exists();

            if ($hasActivity) {
                continue;
            }

            // Send FCM notification
            try {
                $user->notify(new TaskIdleReminder());
            } catch (\Throwable) {
                // Silently skip failed FCM sends
            }

            // Mark as notified until end of day
            Cache::put($cacheKey, true, now()->endOfDay());
        }

        $this->info('Idle check complete.');
    }
}
