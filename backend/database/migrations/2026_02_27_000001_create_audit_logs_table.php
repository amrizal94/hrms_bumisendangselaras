<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100);                    // e.g. face.enroll, face.attendance.check_in
            $table->string('target_type', 100)->nullable();   // e.g. employee
            $table->unsignedBigInteger('target_id')->nullable(); // target record ID
            $table->string('ip_address', 45)->nullable();
            $table->json('metadata')->nullable();             // extra context (confidence, mock_location, etc.)
            $table->timestamp('created_at')->useCurrent();    // immutable — no updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
