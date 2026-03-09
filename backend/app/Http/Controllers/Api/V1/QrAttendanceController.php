<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceResource;
use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\QrSession;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\FakeGpsDetected;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class QrAttendanceController extends Controller
{
    // ---------------------------------------------------------------
    // Admin/HR: list QR sessions for a date (default today)
    // ---------------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $date = $request->filled('date')
            ? Carbon::parse($request->string('date'))->toDateString()
            : Carbon::today()->toDateString();

        $sessions = QrSession::with('createdBy:id,name')
            ->whereDate('date', $date)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $sessions,
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: generate a new QR session
    // ---------------------------------------------------------------
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'        => ['required', 'in:check_in,check_out'],
            'date'        => ['required', 'date'],
            'valid_from'  => ['required', 'date_format:Y-m-d H:i:s'],
            'valid_until' => ['required', 'date_format:Y-m-d H:i:s', 'after:valid_from'],
        ]);

        $session = QrSession::create([
            ...$validated,
            'token'      => (string) Str::uuid(),
            'created_by' => $request->user()->id,
            'is_active'  => true,
        ]);

        $session->load('createdBy:id,name');

        return response()->json([
            'success' => true,
            'message' => 'QR session generated.',
            'data'    => $session,
        ], 201);
    }

    // ---------------------------------------------------------------
    // Admin/HR: deactivate a QR session
    // ---------------------------------------------------------------
    public function deactivate(QrSession $session): JsonResponse
    {
        $session->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'QR session deactivated.',
            'data'    => $session,
        ]);
    }

    // ---------------------------------------------------------------
    // Staff: scan QR code to check-in or check-out
    // ---------------------------------------------------------------
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'token'            => ['required', 'string'],
            'latitude'         => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'        => ['nullable', 'numeric', 'between:-180,180'],
            'location_accuracy'=> ['nullable', 'numeric', 'min:0'],
            'is_mock_location' => ['nullable', 'boolean'],
        ]);

        // Find session
        $session = QrSession::where('token', $request->string('token'))->first();
        if (!$session) {
            return response()->json(['success' => false, 'message' => 'Invalid QR code.'], 404);
        }

        // Validate session window
        if (!$session->isValid()) {
            $reason = !$session->is_active
                ? 'QR session has been deactivated.'
                : 'QR session has expired or is not yet valid.';
            return response()->json(['success' => false, 'message' => $reason], 422);
        }

        // Resolve employee
        $employee = Employee::where('user_id', $request->user()->id)->first();
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'No employee record found for this user.'], 404);
        }

        // Reject mock GPS
        $mockReject = $this->rejectMockGps($request, $employee);
        if ($mockReject) return $mockReject;

        // Geofence check
        $geoError = $this->validateGeofence($request->input('latitude'), $request->input('longitude'));
        if ($geoError) return $geoError;

        if ($session->type === 'check_in') {
            return $this->doCheckIn($request, $employee);
        } else {
            return $this->doCheckOut($request, $employee);
        }
    }

    // ---------------------------------------------------------------
    private function doCheckIn(Request $request, Employee $employee): JsonResponse
    {
        $today = Carbon::today();

        if (AttendanceRecord::where('employee_id', $employee->id)->whereDate('date', $today)->exists()) {
            return response()->json(['success' => false, 'message' => 'Already checked in today.'], 422);
        }

        $checkInTime = Carbon::now();

        $record = AttendanceRecord::create([
            'employee_id'      => $employee->id,
            'date'             => $today->toDateString(),
            'check_in'         => $checkInTime,
            'status'           => AttendanceRecord::resolveStatus($checkInTime),
            'latitude'         => $request->input('latitude'),
            'longitude'        => $request->input('longitude'),
            'location_accuracy'=> $request->input('location_accuracy'),
            'is_mock_location' => $request->boolean('is_mock_location', false),
            'check_in_method'  => 'qr',
        ]);

        // Late detection
        $employee->loadMissing('shift');
        if ($employee->shift) {
            $shiftStart = Carbon::createFromTimeString($employee->shift->check_in_time);
            $deadline   = $shiftStart->copy()->addMinutes($employee->shift->late_tolerance_minutes);
            if ($checkInTime->gt($deadline)) {
                $lateMinutes = (int) $checkInTime->diffInMinutes($shiftStart);
                $record->update(['is_late' => true, 'late_minutes' => $lateMinutes]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Check-in recorded via QR at ' . $checkInTime->format('H:i'),
            'data'    => new AttendanceResource($record->load(['employee.user', 'employee.department'])),
        ], 201);
    }

    // ---------------------------------------------------------------
    private function doCheckOut(Request $request, Employee $employee): JsonResponse
    {
        $record = AttendanceRecord::where('employee_id', $employee->id)
            ->whereDate('date', Carbon::today())
            ->first();

        if (!$record) {
            return response()->json(['success' => false, 'message' => 'No check-in found for today.'], 422);
        }

        if ($record->check_out) {
            return response()->json(['success' => false, 'message' => 'Already checked out today.'], 422);
        }

        $checkOutTime = Carbon::now();

        $record->update([
            'check_out'  => $checkOutTime,
            'work_hours' => round(
                $checkOutTime->diffInMinutes($record->check_in) / 60,
                2
            ),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Check-out recorded via QR at ' . $checkOutTime->format('H:i'),
            'data'    => new AttendanceResource($record->load(['employee.user', 'employee.department'])),
        ]);
    }

    // ---------------------------------------------------------------
    private function rejectMockGps(Request $request, Employee $employee): ?JsonResponse
    {
        $isMock      = $request->boolean('is_mock_location');
        $accuracy    = $request->filled('location_accuracy') ? (float) $request->input('location_accuracy') : null;
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
    private function validateGeofence(mixed $lat, mixed $lng): ?JsonResponse
    {
        $enabled = Setting::get('attendance.geofence_enabled', '0') === '1';
        if (!$enabled) return null;

        $officeLat = (float) Setting::get('attendance.office_latitude', '0');
        $officeLng = (float) Setting::get('attendance.office_longitude', '0');
        $radius    = (int)   Setting::get('attendance.office_radius', '200');

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
