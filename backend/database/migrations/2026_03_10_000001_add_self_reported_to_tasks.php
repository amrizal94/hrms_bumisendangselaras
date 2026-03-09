<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('photo_path')->nullable()->after('sort_order');
            $table->boolean('self_reported')->default(false)->after('photo_path');
            $table->text('notes')->nullable()->after('self_reported');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['photo_path', 'self_reported', 'notes']);
        });
    }
};
