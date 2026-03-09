<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // finance_budget_projects = proyek anggaran perusahaan
        // (berbeda dari "projects" tabel yg untuk manajemen task/tugas)
        Schema::create('finance_budget_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('finance_accounts');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('total_budget', 18, 2);  // anggaran yang dialokasikan
            $table->decimal('spent_amount', 18, 2)->default(0);  // otomatis terupdate
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->text('notes')->nullable();

            // PIC / penanggung jawab proyek
            $table->foreignId('assigned_by')->constrained('users');
            $table->foreignId('created_by')->constrained('users');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_budget_projects');
    }
};
