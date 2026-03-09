<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Creation audit (staff self-reported tasks)
            $table->decimal('created_latitude',        10, 7)->nullable()->after('notes');
            $table->decimal('created_longitude',       10, 7)->nullable()->after('created_latitude');
            $table->decimal('created_face_confidence',  5, 2)->nullable()->after('created_longitude');
            // Completion audit
            $table->decimal('completed_latitude',           10, 7)->nullable()->after('created_face_confidence');
            $table->decimal('completed_longitude',          10, 7)->nullable()->after('completed_latitude');
            $table->decimal('completed_location_accuracy',   8, 2)->nullable()->after('completed_longitude');
            $table->boolean('completed_is_mock')->default(false)->after('completed_location_accuracy');
            $table->decimal('completed_face_confidence',     5, 2)->nullable()->after('completed_is_mock');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'created_latitude', 'created_longitude', 'created_face_confidence',
                'completed_latitude', 'completed_longitude', 'completed_location_accuracy',
                'completed_is_mock', 'completed_face_confidence',
            ]);
        });
    }
};
