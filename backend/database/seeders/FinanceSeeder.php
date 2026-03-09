<?php

namespace Database\Seeders;

use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use Illuminate\Database\Seeder;

class FinanceSeeder extends Seeder
{
    public function run(): void
    {
        // ── Income Categories ──────────────────────────────────────────────
        $incomeCategories = [
            ['name' => 'Pendapatan Operasional', 'color' => '#22c55e'],
            ['name' => 'Investasi',               'color' => '#3b82f6'],
            ['name' => 'Pinjaman',                'color' => '#f59e0b'],
            ['name' => 'Hibah',                   'color' => '#8b5cf6'],
            ['name' => 'Lainnya',                 'color' => '#6b7280'],
        ];

        foreach ($incomeCategories as $cat) {
            FinanceCategory::firstOrCreate(
                ['name' => $cat['name'], 'type' => 'income'],
                [
                    'color'      => $cat['color'],
                    'is_active'  => true,
                    'created_by' => 1,
                ]
            );
        }

        // ── Expense Categories ─────────────────────────────────────────────
        $expenseCategories = [
            ['name' => 'Gaji & THR',       'color' => '#ef4444'],
            ['name' => 'Operasional',      'color' => '#f97316'],
            ['name' => 'Pembelian Aset',   'color' => '#eab308'],
            ['name' => 'Marketing',        'color' => '#06b6d4'],
            ['name' => 'Transportasi',     'color' => '#84cc16'],
            ['name' => 'Utilitas',         'color' => '#a855f7'],
            ['name' => 'Lainnya',          'color' => '#6b7280'],
        ];

        foreach ($expenseCategories as $cat) {
            FinanceCategory::firstOrCreate(
                ['name' => $cat['name'], 'type' => 'expense'],
                [
                    'color'      => $cat['color'],
                    'is_active'  => true,
                    'created_by' => 1,
                ]
            );
        }

        // ── Sample Account ─────────────────────────────────────────────────
        FinanceAccount::firstOrCreate(
            ['name' => 'Rekening Utama BCA'],
            [
                'type'           => 'bank',
                'bank_name'      => 'BCA',
                'account_number' => '1234567890',
                'account_holder' => 'PT Bumi Sendang Selaras',
                'balance'        => 0,
                'description'    => 'Rekening operasional utama perusahaan',
                'is_active'      => true,
                'created_by'     => 1,
            ]
        );
    }
}
