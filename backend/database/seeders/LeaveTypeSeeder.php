<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Annual Leave',     'code' => 'annual',     'max_days_per_year' => 12, 'is_paid' => true,  'description' => 'Yearly paid leave entitlement.'],
            ['name' => 'Sick Leave',        'code' => 'sick',       'max_days_per_year' => 12, 'is_paid' => true,  'description' => 'Leave due to illness or medical appointment.'],
            ['name' => 'Emergency Leave',   'code' => 'emergency',  'max_days_per_year' => 3,  'is_paid' => true,  'description' => 'Leave for urgent personal or family matters.'],
            ['name' => 'Maternity Leave',   'code' => 'maternity',  'max_days_per_year' => 90, 'is_paid' => true,  'description' => 'Leave for female employees after childbirth.'],
            ['name' => 'Paternity Leave',   'code' => 'paternity',  'max_days_per_year' => 2,  'is_paid' => true,  'description' => 'Leave for male employees after childbirth.'],
            ['name' => 'Unpaid Leave',      'code' => 'unpaid',     'max_days_per_year' => 30, 'is_paid' => false, 'description' => 'Unpaid leave with prior approval.'],
        ];

        foreach ($types as $data) {
            LeaveType::updateOrCreate(
                ['code' => $data['code']],
                array_merge($data, ['is_active' => true])
            );
            $this->command->info("Leave type seeded: {$data['name']}");
        }
    }
}
