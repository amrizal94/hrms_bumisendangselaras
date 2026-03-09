<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Single director account — client creates other users from this account
        $user = User::updateOrCreate(
            ['email' => 'director@bumisendangselaras.co.id'],
            [
                'name'       => 'Director',
                'password'   => Hash::make('BssHrms2024'),
                'phone'      => '+62811000001',
                'is_active'  => true,
                'must_change_password' => true,
            ]
        );

        $user->syncRoles(['director']);

        $this->command->info("User created: {$user->email} → role: director");
    }
}
