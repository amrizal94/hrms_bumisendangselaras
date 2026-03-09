<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qr_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('token')->unique();
            $table->enum('type', ['check_in', 'check_out'])->default('check_in');
            $table->date('date');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('valid_from');
            $table->timestamp('valid_until');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['date', 'type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_sessions');
    }
};
