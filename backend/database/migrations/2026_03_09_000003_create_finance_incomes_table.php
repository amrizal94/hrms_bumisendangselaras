<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_incomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('finance_accounts');
            $table->foreignId('category_id')->nullable()->constrained('finance_categories')->nullOnDelete();
            $table->decimal('amount', 18, 2);
            $table->date('date');
            $table->string('reference_number')->nullable();  // nomor bukti transfer
            $table->string('source')->nullable();            // dari siapa / sumber dana
            $table->text('description');
            $table->string('attachment')->nullable();        // path to uploaded file
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
            $table->text('rejection_note')->nullable();

            // Tracking: siapa yg bertanggung jawab atas pemasukan ini
            $table->foreignId('assigned_by')->constrained('users');
            // Siapa yg menginput record ini
            $table->foreignId('created_by')->constrained('users');
            // Siapa yg approve (jika workflow approval diaktifkan)
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_incomes');
    }
};
