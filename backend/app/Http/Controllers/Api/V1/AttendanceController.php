<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\FakeGpsDetected;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AttendanceController extends Controller
{
    // ---------------------------------------------------------------
    // Admin/HR: list all attendance records with filters
    // ---------------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = AttendanceRecord::query()
            ->with(['employee.user', 'employee.department']);

        if ($request->filled('date')) {
            $query->whereDate('date', $request->string('date'));
        } elseif ($request->filled('date_from') || $request->filled('date_to')) {
            $query->when($request->filled('date_from'), fn($q) => $q->whereDate('date', '>=', $request->string('date_from')))
                  ->when($request->filled('date_to'),   fn($q) => $q->whereDate('date', '<=', $request->string('date_to')));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $request->integer('department_id')));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->whereHas('employee.user', fn($q) => $q->where('name', 'ilike', "%{$search}%"));
        }

        $records = $query
            ->orderByDesc('date')
            ->orderByDesc('check_in')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => AttendanceResource::collection($records->items()),
            'meta'    => [
                'total'        => $records->total(),
                'per_page'     => $records->perPage(),
                'current_page' => $records->currentPage(),
                'last_page'    => $records->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: manual attendance entry
    // ---------------------------------------------------------------
    public function store(StoreAttendanceRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $record = AttendanceRecord::updateOrCreate(
            [
                'employee_id' => $validated['employee_id'],
                'date'        => $validated['date'],
            ],
            [
                'check_in'        => $validated['check_in'],
                'check_out'       => $validated['check_out'] ?? null,
                'status'          => $validated['status'] ?? AttendanceRecord::resolveStatus(
                    Carbon::parse($validated['check_in'])
                ),
                'work_hours'      => isset($validated['check_out'])
                    ? $this->calcHours($validated['check_in'], $validated['check_out'])
                    : null,
                'notes'           => $validated['notes'] ?? null,
                'check_in_method' => 'admin',
            ]
        );

        $record->load(['employee.user', 'employee.department']);
        AuditLog::record('attendance.create', $request, [
            'target_label' => $record->employee?->user?->name ?? '—',
            'date'         => $validated['date'],
        ], 'attendance', $record->id);

        return response()->json([
            'success' => true,
            'message' => 'Attendance record saved.',
            'data'    => new AttendanceResource($record),
        ], 201);
    }

    // ---------------------------------------------------------------
    // Show single record
    // ---------------------------------------------------------------
    public function show(AttendanceRecord $attendance): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new AttendanceResource($attendance->load(['employee.user', 'employee.department'])),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: update/correct attendance record
    // ---------------------------------------------------------------
    public function update(UpdateAttendanceRequest $request, AttendanceRecord $attendance): JsonResponse
    {
        $validated = $request->validated();

        $checkIn  = $validated['check_in']  ?? $attendance->check_in?->format('Y-m-d H:i:s');
        $checkOut = $validated['check_out'] ?? $attendance->check_out?->format('Y-m-d H:i:s');

        $attendance->update([
            'check_in'   => $checkIn,
            'check_out'  => $checkOut,
            'status'     => $validated['status'] ?? (
                $checkIn ? AttendanceRecord::resolveStatus(Carbon::parse($checkIn)) : $attendance->status
            ),
            'work_hours' => ($checkIn && $checkOut) ? $this->calcHours($checkIn, $checkOut) : null,
            'notes'      => $validated['notes'] ?? $attendance->notes,
        ]);

        $attendance->load(['employee.user', 'employee.department']);

        AuditLog::record('attendance.update', $request, [
            'target_label'  => $attendance->employee?->user?->name ?? '—',
            'date'          => $attendance->date,
            'changed_fields' => array_keys($validated),
        ], 'attendance', $attendance->id);

        return response()->json([
            'success' => true,
            'message' => 'Attendance updated.',
            'data'    => new AttendanceResource($attendance),
        ]);
    }

    // ---------------------------------------------------------------
    // Admin: delete attendance record
    // ---------------------------------------------------------------
    public function destroy(Request $request, AttendanceRecord $attendance): JsonResponse
    {
        $attendance->load(['employee.user']);

        AuditLog::record('attendance.delete', $request, [
            'target_label' => $attendance->employee?->user?->name ?? '—',
            'date'         => $attendance->date,
        ], 'attendance', $attendance->id);

        $attendance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance record deleted.',
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: check in
    // ---------------------------------------------------------------
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'latitude'            => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'           => ['nullable', 'numeric', 'between:-180,180'],
            'location_accuracy'   => ['nullable', 'numeric', 'min:0'],
            'is_mock_location'    => ['nullable', 'boolean'],
            'client_checked_in_at'=> ['nullable', 'date'],
        ]);

        $employee = $this->getAuthEmployee($request);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found for this user.'], 404);
        }

        // Check-in method policy
        $policy = Setting::get('attendance.check_in_method', 'any');
        if ($policy === 'face_only') {
            return response()->json([
                'success' => false,
                'message' => 'Manual check-in is disabled. Please use face recognition to check in.',
            ], 422);
        }

        // Reject mock/fake GPS
        $mockReject = $this->rejectMockGps($request, $employee);
        if ($mockReject) return $mockReject;

        // Geofence check
        $geoError = $this->validateGeofence($request->input('latitude'), $request->input('longitude'));
        if ($geoError) return $geoError;

        $today = Carbon::today();

        // Accept client timestamp for offline sync — must be today and not in the future
        $checkInTime = Carbon::now();
        if ($request->filled('client_checked_in_at')) {
            try {
                $clientTime = Carbon::parse($request->string('client_checked_in_at'));
                if ($clientTime->isToday() && $clientTime->lte(Carbon::now())) {
                    $checkInTime = $clientTime;
                }
            } catch (\Exception) {
                // Fall back to server time
            }
        }

        if (AttendanceRecord::where('employee_id', $employee->id)->whereDate('date', $today)->exists()) {
            return response()->json(['success' => false, 'message' => 'Already checked in today.'], 422);
        }

        $record = AttendanceRecord::create([
            'employee_id'      => $employee->id,
            'date'             => $today->toDateString(),
            'check_in'         => $checkInTime,
            'status'           => AttendanceRecord::resolveStatus($checkInTime),
            'latitude'         => $request->input('latitude'),
            'longitude'        => $request->input('longitude'),
            'location_accuracy'=> $request->input('location_accuracy'),
            'is_mock_location' => $request->boolean('is_mock_location', false),
            'check_in_method'  => 'manual',
        ]);

        // Late detection
        $employee->loadMissing('shift');
        if ($employee->shift) {
            $shiftStart  = Carbon::createFromTimeString($employee->shift->check_in_time);
            $deadline    = $shiftStart->copy()->addMinutes($employee->shift->late_tolerance_minutes);
            if ($checkInTime->gt($deadline)) {
                $lateMinutes = (int) $checkInTime->diffInMinutes($shiftStart);
                $record->update(['is_late' => true, 'late_minutes' => $lateMinutes]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Check-in recorded at ' . $checkInTime->format('H:i'),
            'data'    => new AttendanceResource($record->load(['employee.user', 'employee.department'])),
        ], 201);
    }

    // ---------------------------------------------------------------
    // Staff: check out
    // ---------------------------------------------------------------
    public function checkOut(Request $request): JsonResponse
    {
        $request->validate([
            'latitude'             => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'            => ['nullable', 'numeric', 'between:-180,180'],
            'location_accuracy'    => ['nullable', 'numeric', 'min:0'],
            'is_mock_location'     => ['nullable', 'boolean'],
            'client_checked_out_at'=> ['nullable', 'date'],
        ]);

        $employee = $this->getAuthEmployee($request);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found for this user.'], 404);
        }

        // Reject mock/fake GPS
        $mockReject = $this->rejectMockGps($request, $employee);
        if ($mockReject) return $mockReject;

        // Geofence check
        $geoError = $this->validateGeofence($request->input('latitude'), $request->input('longitude'));
        if ($geoError) return $geoError;

        $record = AttendanceRecord::where('employee_id', $employee->id)
            ->whereDate('date', Carbon::today())
            ->first();

        if (!$record) {
            return response()->json(['success' => false, 'message' => 'No check-in found for today.'], 422);
        }

        if ($record->check_out) {
            return response()->json(['success' => false, 'message' => 'Already checked out today.'], 422);
        }

        // Accept client timestamp for offline sync — must not be in the future
        $checkOutTime = Carbon::now();
        if ($request->filled('client_checked_out_at')) {
            try {
                $clientTime = Carbon::parse($request->string('client_checked_out_at'));
                if ($clientTime->lte(Carbon::now())) {
                    $checkOutTime = $clientTime;
                }
            } catch (\Exception) {
                // Fall back to server time
            }
        }

        $record->update([
            'check_out'  => $checkOutTime,
            'work_hours' => round(
                $checkOutTime->diffInMinutes($record->check_in) / 60,
                2
            ),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Check-out recorded at ' . $checkOutTime->format('H:i'),
            'data'    => new AttendanceResource($record->load(['employee.user', 'employee.department'])),
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: get today's attendance record
    // ---------------------------------------------------------------
    public function today(Request $request): JsonResponse
    {
        $employee = $this->getAuthEmployee($request);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found.'], 404);
        }

        $record = AttendanceRecord::where('employee_id', $employee->id)
            ->whereDate('date', Carbon::today())
            ->with(['employee.user', 'employee.department'])
            ->first();

        return response()->json([
            'success' => true,
            'data'    => $record ? new AttendanceResource($record) : null,
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: own attendance history
    // ---------------------------------------------------------------
    public function myAttendance(Request $request): JsonResponse
    {
        $employee = $this->getAuthEmployee($request);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found.'], 404);
        }

        $query = AttendanceRecord::where('employee_id', $employee->id)
            ->with(['employee.user', 'employee.department']);

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->string('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->string('date_to'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $records = $query
            ->orderByDesc('date')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => AttendanceResource::collection($records->items()),
            'meta'    => [
                'total'        => $records->total(),
                'per_page'     => $records->perPage(),
                'current_page' => $records->currentPage(),
                'last_page'    => $records->lastPage(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: summary stats for a given date (default today)
    // ---------------------------------------------------------------
    public function summary(Request $request): JsonResponse
    {
        $date = $request->filled('date')
            ? Carbon::parse($request->string('date'))->toDateString()
            : Carbon::today()->toDateString();

        $totalEmployees = Employee::where('status', 'active')->count();

        $records = AttendanceRecord::whereDate('date', $date)->get();

        $present  = $records->whereIn('status', ['present', 'late', 'half_day'])->count();
        $late     = $records->where('status', 'late')->count();
        $onLeave  = $records->where('status', 'on_leave')->count();
        $absent   = max(0, $totalEmployees - $present - $onLeave);

        return response()->json([
            'success' => true,
            'data'    => [
                'date'            => $date,
                'total_employees' => $totalEmployees,
                'present'         => $present,
                'late'            => $late,
                'absent'          => $absent,
                'on_leave'        => $onLeave,
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // All authenticated: current check-in method policy (for mobile)
    // ---------------------------------------------------------------
    public function policy(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'check_in_method' => Setting::get('attendance.check_in_method', 'any'),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    private function rejectMockGps(Request $request, Employee $employee): ?JsonResponse
    {
        $isMock   = $request->boolean('is_mock_location');
        $accuracy = $request->filled('location_accuracy')
            ? (float) $request->input('location_accuracy')
            : null;
        $zeroAccuracy = $accuracy !== null && $accuracy === 0.0;

        if (!$isMock && !$zeroAccuracy) return null;

        $detectedVia = $isMock ? 'is_mock_location' : 'zero_accuracy';

        AuditLog::record('fake_gps.attempt', $request, [
            'latitude'     => $request->input('latitude'),
            'longitude'    => $request->input('longitude'),
            'accuracy'     => $accuracy,
            'detected_via' => $detectedVia,
        ], 'employee', $employee->id);

        $notification = new FakeGpsDetected(
            $employee,
            $request->filled('latitude')  ? (float) $request->input('latitude')  : null,
            $request->filled('longitude') ? (float) $request->input('longitude') : null,
            $accuracy,
            $detectedVia,
        );
        User::role(['admin', 'hr'])->each(fn($u) => $u->notify($notification));

        return response()->json([
            'success' => false,
            'message' => 'Fake GPS detected. Please disable mock location and try again.',
        ], 422);
    }

    // ---------------------------------------------------------------
    private function getAuthEmployee(Request $request): ?Employee
    {
        return Employee::where('user_id', $request->user()->id)->first();
    }

    private function calcHours(string $checkIn, string $checkOut): float
    {
        return round(Carbon::parse($checkOut)->diffInMinutes(Carbon::parse($checkIn)) / 60, 2);
    }

    private function validateGeofence(mixed $lat, mixed $lng): ?JsonResponse
    {
        $enabled = Setting::get('attendance.geofence_enabled', '0') === '1';
        if (!$enabled) return null;

        $officeLat = (float) Setting::get('attendance.office_latitude', '0');
        $officeLng = (float) Setting::get('attendance.office_longitude', '0');
        $radius    = (int)   Setting::get('attendance.office_radius', '200');

        // Skip if office location not configured
        if (!$officeLat || !$officeLng) return null;

        if ($lat === null || $lng === null) {
            return response()->json(['success' => false, 'message' => 'Location is required for attendance. Please enable GPS.'], 422);
        }

        $distance = AttendanceRecord::haversineDistance((float) $lat, (float) $lng, $officeLat, $officeLng);

        if ($distance > $radius) {
            $dist = (int) round($distance);
            return response()->json([
                'success' => false,
                'message' => "You are {$dist}m away from the office. Maximum allowed distance is {$radius}m.",
            ], 422);
        }

        return null;
    }
}
