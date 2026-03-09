<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ResetProductionData extends Command
{
    protected $signature   = 'app:reset-production {--dry-run : Preview what will be deleted without actually deleting} {--force : Skip confirmation prompts (use with caution)}';
    protected $description = 'Reset transactional data, keeping HR/Director accounts, master data, announcements, labels, projects, and future meetings.';

    // Accounts to preserve (by email)
    private const KEEP_EMAILS = [
        'hr@example.com',
        'director@example.com',
    ];

    public function handle(): int
    {
        $isDry = $this->option('dry-run');

        $this->line('');
        $this->line('╔══════════════════════════════════════════════════════╗');
        $this->line('║         BSS HRMS — Production Data Reset              ║');
        $this->line('╚══════════════════════════════════════════════════════╝');
        $this->line('');

        if ($isDry) {
            $this->warn('  [DRY RUN] No data will be deleted. Preview only.');
            $this->line('');
        }

        // ── Resolve users to keep ──────────────────────────────────────────
        $keepUsers = DB::table('users')
            ->whereIn('email', self::KEEP_EMAILS)
            ->get(['id', 'name', 'email']);

        if ($keepUsers->isEmpty()) {
            $this->error('  No matching accounts found for: ' . implode(', ', self::KEEP_EMAILS));
            $this->error('  Aborting — cannot proceed without knowing which accounts to preserve.');
            return self::FAILURE;
        }

        $keepUserIds     = $keepUsers->pluck('id')->toArray();
        $keepEmployeeIds = DB::table('employees')
            ->whereIn('user_id', $keepUserIds)
            ->pluck('id')
            ->toArray();

        // Future meeting IDs (start_time > now) — keep these
        $keepMeetingIds = DB::table('meetings')
            ->where('start_time', '>', now())
            ->pluck('id')
            ->toArray();

        // ── Summary of what will be KEPT ──────────────────────────────────
        $this->info('  Accounts that will be KEPT:');
        foreach ($keepUsers as $u) {
            $this->line("    ✓  {$u->name} <{$u->email}>");
        }
        $this->line('');
        $this->info('  Data that will be KEPT (master + config):');
        $this->line('    ✓  Departments, Shifts, Leave Types, Expense Types');
        $this->line('    ✓  Settings, Roles & Permissions, Holidays');
        $this->line('    ✓  Announcements');
        $this->line('    ✓  Labels (task tags)');
        $this->line('    ✓  Projects (tasks inside will be deleted)');
        $this->line('    ✓  Future meetings (' . count($keepMeetingIds) . ' upcoming)');
        $this->line('');

        // ── Count what will be DELETED ────────────────────────────────────
        $counts = $this->buildDeleteCounts($keepUserIds, $keepEmployeeIds, $keepMeetingIds);

        $this->warn('  Data that will be DELETED:');
        foreach ($counts as $label => $count) {
            $this->line(sprintf('    ✗  %-35s %d rows', $label, $count));
        }
        $this->line('');

        $totalRows = array_sum($counts);
        $this->line("  Total rows to delete: {$totalRows}");
        $this->line('');

        // ── Dry run ends here ─────────────────────────────────────────────
        if ($isDry) {
            $this->warn('  [DRY RUN] Run without --dry-run to execute the reset.');
            return self::SUCCESS;
        }

        // ── Confirmation ──────────────────────────────────────────────────
        $this->error('  ⚠️  THIS ACTION CANNOT BE UNDONE.');
        $this->error('  ⚠️  Make sure you have a database backup before proceeding.');
        $this->line('');

        if (! $this->option('force')) {
            if (! $this->confirm('  Are you sure you want to delete all transactional data?')) {
                $this->line('  Aborted.');
                return self::SUCCESS;
            }

            $confirmed = $this->ask('  Type "RESET" to confirm');
            if ($confirmed !== 'RESET') {
                $this->line('  Confirmation failed. Aborted.');
                return self::SUCCESS;
            }
        }

        // ── Execute ───────────────────────────────────────────────────────
        $this->line('');
        $this->line('  Resetting data...');
        $this->line('');

        // Deletion order respects FK constraints (children before parents)
        $this->deleteTransactionalData($keepUserIds, $keepEmployeeIds, $keepMeetingIds);

        $this->line('');
        $this->info('  ✅ Reset complete!');
        $this->line('  Accounts preserved : ' . $keepUsers->pluck('email')->join(', '));
        $this->line('  Future meetings kept: ' . count($keepMeetingIds));
        $this->warn('  ⚠  Reminder: restart face-service to clear any in-memory face cache.');
        $this->line('     pm2 restart face-service');
        $this->line('');

        return self::SUCCESS;
    }

    // ─────────────────────────────────────────────────────────────────────
    private function buildDeleteCounts(array $keepUserIds, array $keepEmployeeIds, array $keepMeetingIds): array
    {
        $pastMeetingCount = DB::table('meetings')
            ->whereNotIn('id', $keepMeetingIds)
            ->count();

        $meetingRsvpCount = DB::table('meeting_rsvps')
            ->whereNotIn('meeting_id', $keepMeetingIds)
            ->count();

        return [
            'task_label (pivot)'            => DB::table('task_label')->count(),
            'task_checklist_items'          => DB::table('task_checklist_items')->count(),
            'tasks'                         => DB::table('tasks')->count(),
            'payroll_records'               => DB::table('payroll_records')->count(),
            'leave_requests'                => DB::table('leave_requests')->count(),
            'overtime_requests'             => DB::table('overtime_requests')->count(),
            'attendance_records'            => DB::table('attendance_records')->count(),
            'qr_sessions'                   => DB::table('qr_sessions')->count(),
            'expenses'                      => DB::table('expenses')->count(),
            'face_data'                     => DB::table('face_data')->count(),
            'notifications'                 => DB::table('notifications')->count(),
            'audit_logs'                    => DB::table('audit_logs')->count(),
            'meeting_rsvps (past)'          => $meetingRsvpCount,
            'meetings (past)'               => $pastMeetingCount,
            'personal_access_tokens'        => DB::table('personal_access_tokens')
                ->whereNotIn('tokenable_id', $keepUserIds)->count(),
            'employees (non-admin/hr)'      => DB::table('employees')
                ->whereNotIn('id', $keepEmployeeIds)->count(),
            'users (non-admin/hr)'          => DB::table('users')
                ->whereNotIn('id', $keepUserIds)->count(),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    private function deleteTransactionalData(array $keepUserIds, array $keepEmployeeIds, array $keepMeetingIds): void
    {
        // 1. Tasks + checklist (labels & projects are KEPT)
        $this->deleteWhere('task_label', []);          // pivot — all task labels
        $this->deleteWhere('task_checklist_items', []);
        $this->deleteWhere('tasks', []);

        // 2. HR / Payroll
        $this->deleteWhere('payroll_records', []);
        $this->deleteWhere('leave_requests', []);
        $this->deleteWhere('overtime_requests', []);

        // 3. Attendance
        $this->deleteWhere('attendance_records', []);
        $this->deleteWhere('qr_sessions', []);

        // 4. Expenses + storage files
        $this->cleanExpenseFiles();
        $this->deleteWhere('expenses', []);

        // 5. Face data + storage files
        $this->cleanFaceFiles();
        $this->deleteWhere('face_data', []);

        // 6. Notifications & audit trail
        $this->deleteWhere('notifications', []);
        $this->deleteWhere('audit_logs', []);

        // 7. Meetings — delete PAST only, keep future + their RSVPs
        if (! empty($keepMeetingIds)) {
            $count = DB::table('meeting_rsvps')->whereNotIn('meeting_id', $keepMeetingIds)->delete();
            $this->line("    ✗  meeting_rsvps past ({$count} rows)");
            $count = DB::table('meetings')->whereNotIn('id', $keepMeetingIds)->delete();
            $this->line("    ✗  meetings past ({$count} rows)");
        } else {
            $this->deleteWhere('meeting_rsvps', []);
            $this->deleteWhere('meetings', []);
        }

        // 8. Sanctum tokens for deleted users
        $count = DB::table('personal_access_tokens')
            ->whereNotIn('tokenable_id', $keepUserIds)
            ->delete();
        $this->line("    ✗  personal_access_tokens ({$count} rows)");

        // 9. Spatie: role + permission assignments for deleted users
        DB::table('model_has_roles')
            ->where('model_type', 'App\\Models\\User')
            ->whereNotIn('model_id', $keepUserIds)
            ->delete();
        DB::table('model_has_permissions')
            ->where('model_type', 'App\\Models\\User')
            ->whereNotIn('model_id', $keepUserIds)
            ->delete();

        // 10. Reassign created_by in KEPT tables to avoid FK violations / cascade deletes
        //     (announcements + meetings cascade-delete when creator is removed;
        //      projects FK-restrict and would block user deletion)
        $keeperId = $keepUserIds[0]; // reassign to first kept user (HR or Director)
        DB::table('projects')->whereNotIn('created_by', $keepUserIds)
            ->update(['created_by' => $keeperId]);
        DB::table('announcements')->whereNotIn('created_by', $keepUserIds)
            ->update(['created_by' => $keeperId]);
        if (! empty($keepMeetingIds)) {
            DB::table('meetings')->whereIn('id', $keepMeetingIds)
                ->whereNotIn('created_by', $keepUserIds)
                ->update(['created_by' => $keeperId]);
        }
        $this->line('    ✓  created_by reassigned in projects/announcements/meetings');

        // 11. Employees (keep those linked to preserved users)
        $count = DB::table('employees')
            ->whereNotIn('id', $keepEmployeeIds)
            ->delete();
        $this->line("    ✗  employees ({$count} rows)");

        // 12. Users (keep HR and director)
        $count = DB::table('users')
            ->whereNotIn('id', $keepUserIds)
            ->delete();
        $this->line("    ✗  users ({$count} rows)");

        // 13. Clean task photo storage directories
        $this->cleanStorageDirectory('task-photos');

        // 14. Reset PostgreSQL sequences
        $this->resetSequences();
    }

    // ─────────────────────────────────────────────────────────────────────
    private function deleteWhere(string $table, array $where): void
    {
        $query = DB::table($table);
        foreach ($where as $col => $val) {
            $query->where($col, $val);
        }
        $count = $query->count();
        $query->delete();
        $this->line("    ✗  {$table} ({$count} rows)");
    }

    // ─────────────────────────────────────────────────────────────────────
    private function cleanFaceFiles(): void
    {
        try {
            // Delete individual face image files recorded in DB
            $paths = DB::table('face_data')->pluck('image_path')->filter()->toArray();
            Storage::disk('public')->delete($paths);

            // Wipe the entire face-photos directory recursively
            $this->cleanStorageDirectory('face-photos');
            $this->line('    ✗  face photo files from storage');
        } catch (\Throwable $e) {
            $this->warn("    ⚠  Could not clean face files: {$e->getMessage()} (non-fatal)");
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    private function cleanExpenseFiles(): void
    {
        try {
            $paths = DB::table('expenses')->whereNotNull('receipt_path')->pluck('receipt_path')->toArray();
            Storage::disk('public')->delete($paths);
            $this->cleanStorageDirectory('receipts');
            $this->line('    ✗  expense receipt files from storage');
        } catch (\Throwable $e) {
            $this->warn("    ⚠  Could not clean expense files: {$e->getMessage()} (non-fatal)");
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    private function cleanStorageDirectory(string $dir): void
    {
        try {
            $disk = Storage::disk('public');
            // Delete files then subdirectory folders
            foreach ($disk->allFiles($dir) as $file) {
                $disk->delete($file);
            }
            foreach (array_reverse($disk->allDirectories($dir)) as $subdir) {
                $disk->deleteDirectory($subdir);
            }
        } catch (\Throwable) {
            // Non-fatal — directory may not exist
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    private function resetSequences(): void
    {
        $tables = [
            'tasks', 'task_checklist_items',
            'payroll_records', 'leave_requests', 'overtime_requests',
            'attendance_records', 'qr_sessions',
            'expenses', 'face_data',
            'notifications', 'audit_logs',
            'meetings', 'meeting_rsvps',
            'employees', 'users',
        ];

        $reset = 0;
        foreach ($tables as $table) {
            try {
                DB::statement("SELECT setval(pg_get_serial_sequence('{$table}', 'id'), coalesce((SELECT MAX(id) FROM \"{$table}\"), 0) + 1, false)");
                $reset++;
            } catch (\Throwable) {
                // Non-fatal
            }
        }
        $this->line("    ✓  PostgreSQL sequences reset ({$reset} tables)");
    }
}
