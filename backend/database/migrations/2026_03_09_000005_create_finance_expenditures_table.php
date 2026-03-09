<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // finance_expenditures = pengeluaran perusahaan
        // (berbeda dari "expenses" tabel yg untuk reimbursement karyawan)
        Schema::create('finance_expenditures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('finance_accounts');
            $table->foreignId('budget_project_id')->nullable()->constrained('finance_budget_projects')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('finance_categories')->nullOnDelete();
            $table->decimal('amount', 18, 2);
            $table->date('date');
            $table->string('reference_number')->nullable();  // nomor nota/kwitansi
            $table->string('vendor')->nullable();            // dibayar kepada siapa
            $table->text('description');
            $table->string('attachment')->nullable();        // path to uploaded nota/kwitansi
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_note')->nullable();

            // Tracking
            $table->foreignId('assigned_by')->constrained('users');   // siapa yg minta/bertanggung jawab
            $table->foreignId('created_by')->constrained('users');    // siapa yg input
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_expenditures');
    }
};
