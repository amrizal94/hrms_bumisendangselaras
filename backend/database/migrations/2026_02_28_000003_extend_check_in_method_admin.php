<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop existing CHECK constraint and recreate with 'admin' added
        DB::statement("ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_check_in_method_check");
        DB::statement("ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_check_in_method_check CHECK (check_in_method IN ('face', 'manual', 'admin'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_check_in_method_check");
        DB::statement("ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_check_in_method_check CHECK (check_in_method IN ('face', 'manual'))");
    }
};
