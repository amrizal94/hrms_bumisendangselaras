<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Administration',    'code' => 'ADM',  'description' => 'Handles administrative operations and office management.'],
            ['name' => 'Technical Support', 'code' => 'TSP',  'description' => 'Provides technical support and troubleshooting services.'],
            ['name' => 'NOC',               'code' => 'NOC',  'description' => 'Network Operations Center — monitors and manages network infrastructure.'],
            ['name' => 'Programmer',        'code' => 'PROG', 'description' => 'Software development and programming team.'],
            ['name' => 'Human Resource',    'code' => 'HR',   'description' => 'Manages recruitment, employee relations, and HR policies.'],
            ['name' => 'Manager',           'code' => 'MGR',  'description' => 'Management team overseeing operations and staff.'],
            ['name' => 'Director',          'code' => 'DIR',  'description' => 'Executive leadership and overall company direction.'],
        ];

        foreach ($departments as $data) {
            Department::updateOrCreate(
                ['code' => $data['code']],
                array_merge($data, ['is_active' => true])
            );
            $this->command->info("Department seeded: {$data['name']} ({$data['code']})");
        }
    }
}
