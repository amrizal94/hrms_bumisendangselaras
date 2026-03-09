<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        // No demo employees — client adds real employees via director account
        $this->command->info("EmployeeSeeder: skipped (production mode)");
    }
}
