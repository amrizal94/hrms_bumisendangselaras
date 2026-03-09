<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->unsignedSmallInteger('period_year');
            $table->unsignedTinyInteger('period_month');  // 1–12

            // Salary components
            $table->decimal('basic_salary',      15, 2)->default(0);
            $table->decimal('allowances',         15, 2)->default(0); // tunjangan
            $table->decimal('overtime_pay',       15, 2)->default(0);
            $table->decimal('gross_salary',       15, 2)->default(0); // basic + allowances + overtime

            // Deductions
            $table->decimal('absent_deduction',   15, 2)->default(0); // potongan absen
            $table->decimal('other_deductions',   15, 2)->default(0);
            $table->decimal('tax_deduction',      15, 2)->default(0); // PPh21 (5% flat simplified)
            $table->decimal('bpjs_deduction',     15, 2)->default(0); // BPJS 3% (1% kes + 2% JHT)

            $table->decimal('net_salary',         15, 2)->default(0); // gross - all deductions

            // Attendance summary for the period
            $table->unsignedTinyInteger('working_days')->default(0);
            $table->unsignedTinyInteger('present_days')->default(0);
            $table->unsignedTinyInteger('absent_days')->default(0);
            $table->unsignedTinyInteger('leave_days')->default(0);

            $table->enum('status', ['draft', 'finalized', 'paid'])->default('draft');
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_records');
    }
};
