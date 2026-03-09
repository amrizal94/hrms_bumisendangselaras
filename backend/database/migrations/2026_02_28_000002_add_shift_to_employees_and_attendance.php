<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('shift_id')->nullable()->after('department_id')
                  ->constrained('shifts')->nullOnDelete();
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            $table->boolean('is_late')->default(false)->after('check_in_method');
            $table->unsignedSmallInteger('late_minutes')->default(0)->after('is_late');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn('shift_id');
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['is_late', 'late_minutes']);
        });
    }
};
