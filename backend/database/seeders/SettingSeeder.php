<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            // Company
            ['key' => 'company.name',    'value' => 'PT Bumi Sendang Selaras', 'group' => 'company'],
            ['key' => 'company.address', 'value' => '',                              'group' => 'company'],
            ['key' => 'company.phone',   'value' => '',                              'group' => 'company'],
            ['key' => 'company.email',   'value' => 'info@bumisendangselaras.co.id', 'group' => 'company'],

            // Attendance policy
            ['key' => 'attendance.work_start',      'value' => '08:00', 'group' => 'attendance'],
            ['key' => 'attendance.late_threshold',  'value' => '09:00', 'group' => 'attendance'],
            ['key' => 'attendance.work_end',        'value' => '17:00', 'group' => 'attendance'],

            // Payroll policy
            ['key' => 'payroll.tax_rate',  'value' => '5',  'group' => 'payroll'],
            ['key' => 'payroll.bpjs_rate', 'value' => '3',  'group' => 'payroll'],
        ];

        foreach ($defaults as $s) {
            Setting::updateOrCreate(['key' => $s['key']], $s);
        }
    }
}
