<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class SettingController extends Controller
{
    private const ALLOWED_KEYS = [
        'company.name', 'company.address', 'company.phone', 'company.email',
        'attendance.work_start', 'attendance.late_threshold', 'attendance.work_end',
        'attendance.geofence_enabled', 'attendance.office_latitude', 'attendance.office_longitude', 'attendance.office_radius',
        'attendance.check_in_method',
        'payroll.tax_rate', 'payroll.bpjs_rate',
    ];

    // ---------------------------------------------------------------
    // GET /settings — return all settings grouped
    // ---------------------------------------------------------------
    public function index(): JsonResponse
    {
        $settings = Setting::whereIn('key', self::ALLOWED_KEYS)
            ->get()
            ->groupBy('group')
            ->map(fn($group) => $group->pluck('value', 'key'));

        // Ensure all groups exist even if DB is empty
        $defaults = [
            'company'    => ['company.name' => '', 'company.address' => '', 'company.phone' => '', 'company.email' => ''],
            'attendance' => [
                'attendance.work_start'       => '08:00',
                'attendance.late_threshold'   => '09:00',
                'attendance.work_end'         => '17:00',
                'attendance.geofence_enabled' => '0',
                'attendance.office_latitude'  => '',
                'attendance.office_longitude' => '',
                'attendance.office_radius'    => '200',
                'attendance.check_in_method'  => 'any',
            ],
            'payroll'    => ['payroll.tax_rate' => '5', 'payroll.bpjs_rate' => '3'],
        ];

        $result = [];
        foreach ($defaults as $group => $keys) {
            $result[$group] = array_merge($keys, $settings->get($group, collect())->toArray());
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    // ---------------------------------------------------------------
    // PUT /settings — batch update any group
    // ---------------------------------------------------------------
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Company
            'company.name'    => ['sometimes', 'string', 'max:255'],
            'company.address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'company.phone'   => ['sometimes', 'nullable', 'string', 'max:30'],
            'company.email'   => ['sometimes', 'nullable', 'email', 'max:255'],

            // Attendance
            'attendance.work_start'       => ['sometimes', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'attendance.late_threshold'   => ['sometimes', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'attendance.work_end'         => ['sometimes', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'attendance.geofence_enabled' => ['sometimes', 'boolean'],
            'attendance.office_latitude'  => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'attendance.office_longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'attendance.office_radius'    => ['sometimes', 'integer', 'min:50', 'max:10000'],
            'attendance.check_in_method'  => ['sometimes', 'string', 'in:any,face_only,manual_only'],

            // Payroll
            'payroll.tax_rate'  => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'payroll.bpjs_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ]);

        // $validated has nested structure: ['company' => ['name' => ...], ...]
        // Flatten it back to dot-notation keys for storage
        foreach (Arr::dot($validated) as $key => $value) {
            if (in_array($key, self::ALLOWED_KEYS) && $value !== null) {
                $group = explode('.', $key)[0];
                Setting::set($key, $value, $group);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings saved.',
        ]);
    }
}
