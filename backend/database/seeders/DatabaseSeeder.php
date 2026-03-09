<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            DepartmentSeeder::class,
            EmployeeSeeder::class,
            LeaveTypeSeeder::class,
            SettingSeeder::class,
            AssetCategorySeeder::class,
            FinanceSeeder::class,
        ]);
    }
}
