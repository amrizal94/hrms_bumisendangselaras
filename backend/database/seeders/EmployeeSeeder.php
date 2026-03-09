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
        $hrDept  = Department::where('code', 'HR')->first();
        $itDept  = Department::where('code', 'IT')->first();
        $finDept = Department::where('code', 'FIN')->first();

        $employees = [
            [
                'user' => [
                    'name'      => 'Budi Santoso',
                    'email'     => 'budi.santoso@example.com',
                    'password'  => Hash::make('EMP001'),
                    'phone'     => '+62811100001',
                    'is_active' => true,
                ],
                'employee' => [
                    'employee_number' => 'EMP001',
                    'department_id'   => $itDept?->id,
                    'position'        => 'Software Engineer',
                    'employment_type' => 'full_time',
                    'status'          => 'active',
                    'join_date'       => '2023-01-15',
                    'basic_salary'    => 8000000,
                    'gender'          => 'male',
                    'birth_date'      => '1993-05-20',
                ],
            ],
            [
                'user' => [
                    'name'      => 'Siti Rahayu',
                    'email'     => 'siti.rahayu@example.com',
                    'password'  => Hash::make('EMP002'),
                    'phone'     => '+62811100002',
                    'is_active' => true,
                ],
                'employee' => [
                    'employee_number' => 'EMP002',
                    'department_id'   => $hrDept?->id,
                    'position'        => 'HR Specialist',
                    'employment_type' => 'full_time',
                    'status'          => 'active',
                    'join_date'       => '2022-06-01',
                    'basic_salary'    => 7000000,
                    'gender'          => 'female',
                    'birth_date'      => '1995-09-12',
                ],
            ],
            [
                'user' => [
                    'name'      => 'Ahmad Fauzi',
                    'email'     => 'ahmad.fauzi@example.com',
                    'password'  => Hash::make('EMP003'),
                    'phone'     => '+62811100003',
                    'is_active' => true,
                ],
                'employee' => [
                    'employee_number' => 'EMP003',
                    'department_id'   => $finDept?->id,
                    'position'        => 'Finance Analyst',
                    'employment_type' => 'full_time',
                    'status'          => 'active',
                    'join_date'       => '2023-03-10',
                    'basic_salary'    => 7500000,
                    'gender'          => 'male',
                    'birth_date'      => '1991-02-28',
                ],
            ],
        ];

        foreach ($employees as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['user']['email']],
                $data['user']
            );
            $user->syncRoles(['staff']);

            Employee::updateOrCreate(
                ['employee_number' => $data['employee']['employee_number']],
                array_merge($data['employee'], ['user_id' => $user->id])
            );

            $this->command->info("Employee seeded: {$data['user']['name']} ({$data['employee']['employee_number']})");
        }
    }
}
