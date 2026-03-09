<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->decimal('latitude',  10, 7)->nullable()->after('notes');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('location_accuracy', 8, 2)->nullable()->after('longitude');
            $table->boolean('is_mock_location')->default(false)->after('location_accuracy');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'location_accuracy', 'is_mock_location']);
        });
    }
};
