<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\ExpenseType;
use Illuminate\Database\Seeder;

class ExpenseTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Transport',     'code' => 'transport',     'description' => 'Transportation costs.'],
            ['name' => 'Meal',          'code' => 'meal',          'description' => 'Meal and food expenses.'],
            ['name' => 'Accommodation', 'code' => 'accommodation', 'description' => 'Hotel and lodging costs.'],
            ['name' => 'Supplies',      'code' => 'supplies',      'description' => 'Office and operational supplies.'],
            ['name' => 'Communication', 'code' => 'communication', 'description' => 'Phone and internet costs.'],
            ['name' => 'Other',         'code' => 'other',         'description' => 'Other miscellaneous expenses.'],
        ];

        foreach ($types as $data) {
            $type = ExpenseType::updateOrCreate(
                ['code' => $data['code']],
                array_merge($data, ['is_active' => true])
            );

            // Migrate existing expenses that match this category
            Expense::where('category', $data['code'])
                ->whereNull('expense_type_id')
                ->update(['expense_type_id' => $type->id]);
        }
    }
}
