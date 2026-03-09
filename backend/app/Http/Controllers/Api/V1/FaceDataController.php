<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\FaceDataResource;
use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\FaceData;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\FakeGpsDetected;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class FaceDataController extends Controller
{
    // Face match threshold (Euclidean distance)
    private const THRESHOLD = 0.5;

    // ---------------------------------------------------------------
    // Admin/HR: list enrollment status for all employees
    // ---------------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = Employee::query()
            ->with(['user', 'department', 'faceData.enrolledBy'])
            ->where('status', 'active');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->whereHas('user', fn($q) => $q->where('name', 'ilike', "%{$search}%"));
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }

        if ($request->filled('enrolled')) {
            $enrolled = filter_var($request->string('enrolled'), FILTER_VALIDATE_BOOLEAN);
            if ($enrolled) {
                $query->whereHas('faceData');
            } else {
                $query->whereDoesntHave('faceData');
            }
        }

        $employees = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        $data = $employees->map(function ($emp) {
            $face = $emp->faceData;
            return [
                'employee_id'     => $emp->id,
                'employee_number' => $emp->employee_number,
                'position'        => $emp->position,
                'user'            => ['id' => $emp->user->id, 'name' => $emp->user->name, 'avatar' => $emp->user->avatar],
                'department'      => $emp->department ? ['id' => $emp->department->id, 'name' => $emp->department->name] : null,
                'is_enrolled'     => (bool) $face,
                'face_data'       => $face ? [
                    'id'          => $face->id,
                    'is_active'   => $face->is_active,
                    'enrolled_at' => $face->enrolled_at?->toISOString(),
                    'image_url'   => $face->image_path ? Storage::disk('public')->url($face->image_path) : null,
                    'enrolled_by' => $face->enrolledBy ? ['id' => $face->enrolledBy->id, 'name' => $face->enrolledBy->name] : null,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
            'meta'    => [
                'total'        => $employees->total(),
                'per_page'     => $employees->perPage(),
                'current_page' => $employees->currentPage(),
                'last_page'    => $employees->lastPage(),
                'enrolled'     => FaceData::where('is_active', true)->count(),
                'not_enrolled' => Employee::where('status', 'active')->whereDoesntHave('faceData')->count(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Admin/HR: enroll face for an employee
    // ---------------------------------------------------------------
    public function enroll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id'  => ['required', 'exists:employees,id'],
            'descriptor'   => ['required', 'array', 'size:128'],
            'descriptor.*' => ['required', 'numeric', 'between:-2,2'],
            'snapshot'     => ['nullable', 'string'], // base64 PNG
        ]);

        $imagePath = null;

        // Save snapshot if provided
        if (!empty($validated['snapshot'])) {
            $base64 = preg_replace('/^data:image\/\w+;base64,/', '', $validated['snapshot']);
            $imageData = base64_decode($base64);

            if ($imageData !== false) {
                $filename  = 'faces/employee_' . $validated['employee_id'] . '_' . time() . '.jpg';
                Storage::disk('public')->put($filename, $imageData);
                $imagePath = $filename;
            }
        }

        $faceData = FaceData::updateOrCreate(
            ['employee_id' => $validated['employee_id']],
            [
                'descriptor'  => $validated['descriptor'], // encrypted:array cast handles encode+encrypt
                'image_path'  => $imagePath,
                'is_active'   => true,
                'enrolled_by' => $request->user()->id,
                'enrolled_at' => now(),
            ]
        );

        AuditLog::record('face.enroll', $request,
            ['employee_id' => $validated['employee_id']],
            'employee', $validated['employee_id']
        );

        return response()->json([
            'success' => true,
            'message' => 'Face enrolled successfully.',
            'data'    => new FaceDataResource($faceData->load(['employee.user', 'employee.department', 'enrolledBy'])),
        ], 201);
    }

    // ---------------------------------------------------------------
    // Admin/HR: delete face enrollment
    // ---------------------------------------------------------------
    public function destroy(FaceData $faceData, Request $request): JsonResponse
    {
        $employeeId = $faceData->employee_id;

        if ($faceData->image_path) {
            Storage::disk('public')->delete($faceData->image_path);
        }

        $faceData->delete();

        AuditLog::record('face.delete', $request,
            ['face_data_id' => $faceData->id],
            'employee', $employeeId
        );

        return response()->json(['success' => true, 'message' => 'Face data deleted.']);
    }

    // ---------------------------------------------------------------
    // All authenticated users: identify face → return matched employee
    // ---------------------------------------------------------------
    public function identify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'descriptor'   => ['required', 'array', 'size:128'],
            'descriptor.*' => ['required', 'numeric', 'between:-2,2'],
        ]);

        $queryDescriptor = $validated['descriptor'];

        $allFaceData = FaceData::where('is_active', true)
            ->with(['employee.user', 'employee.department'])
            ->get();

        if ($allFaceData->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No enrolled faces found.'], 404);
        }

        $bestMatch    = null;
        $bestDistance = PHP_FLOAT_MAX;

        foreach ($allFaceData as $faceData) {
            $storedDescriptor = $faceData->getDescriptorArray();
            if (count($storedDescriptor) !== 128) continue;

            $distance = FaceData::euclideanDistance($queryDescriptor, $storedDescriptor);

            if ($distance < $bestDistance) {
                $bestDistance = $distance;
                $bestMatch    = $faceData;
            }
        }

        if (!$bestMatch || $bestDistance >= self::THRESHOLD) {
            return response()->json([
                'success' => false,
                'message' => 'No matching face found. Please try again or use manual check-in.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'employee_id' => $bestMatch->employee_id,
                'employee'    => [
                    'id'              => $bestMatch->employee->id,
                    'employee_number' => $bestMatch->employee->employee_number,
                    'position'        => $bestMatch->employee->position,
                    'user'            => [
                        'id'     => $bestMatch->employee->user->id,
                        'name'   => $bestMatch->employee->user->name,
                        'avatar' => $bestMatch->employee->user->avatar,
                    ],
                    'department' => $bestMatch->employee->department
                        ? ['id' => $bestMatch->employee->department->id, 'name' => $bestMatch->employee->department->name]
                        : null,
                ],
                'confidence'  => round((1 - $bestDistance / self::THRESHOLD) * 100, 1),
                'distance'    => round($bestDistance, 4),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // All authenticated users: face check-in/out (identify + record attendance)
    // ---------------------------------------------------------------
    public function faceAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'descriptor'   => ['required', 'array', 'size:128'],
            'descriptor.*' => ['required', 'numeric', 'between:-2,2'],
            'action'       => ['required', 'in:check_in,check_out'],
        ]);

        // Check-in method policy
        $policy = Setting::get('attendance.check_in_method', 'any');
        if ($policy === 'manual_only') {
            return response()->json([
                'success' => false,
                'message' => 'Face check-in is disabled by administrator.',
            ], 422);
        }

        // Identify face
        $identifyResult = $this->identifyDescriptor($validated['descriptor']);

        if (!$identifyResult) {
            AuditLog::record('face.attendance.no_match', $request,
                ['action' => $validated['action']]
            );
            return response()->json([
                'success' => false,
                'message' => 'Face not recognized. Please try again or use manual check-in.',
            ], 404);
        }

        $employee = $identifyResult['face_data']->employee;
        $today    = Carbon::today();
        $now      = Carbon::now();
        $action   = $validated['action'];

        if ($action === 'check_in') {
            if (AttendanceRecord::where('employee_id', $employee->id)->whereDate('date', $today)->exists()) {
                return response()->json(['success' => false, 'message' => 'Already checked in today.'], 422);
            }

            $record = AttendanceRecord::create([
                'employee_id'      => $employee->id,
                'date'             => $today->toDateString(),
                'check_in'         => $now,
                'status'           => AttendanceRecord::resolveStatus($now),
                'latitude'         => $request->input('latitude'),
                'longitude'        => $request->input('longitude'),
                'location_accuracy'=> $request->input('location_accuracy'),
                'is_mock_location' => $request->boolean('is_mock_location', false),
                'check_in_method'  => 'face',
            ]);

            AuditLog::record('face.attendance.check_in', $request,
                ['confidence' => $identifyResult['confidence'], 'distance' => $identifyResult['distance']],
                'employee', $employee->id
            );

            return response()->json([
                'success'    => true,
                'message'    => "Welcome, {$employee->user->name}! Checked in at {$now->format('H:i')}.",
                'confidence' => $identifyResult['confidence'],
                'data'       => new AttendanceResource($record->load(['employee.user', 'employee.department'])),
            ], 201);
        }

        // check_out
        $record = AttendanceRecord::where('employee_id', $employee->id)
            ->whereDate('date', $today)
            ->first();

        if (!$record) {
            return response()->json(['success' => false, 'message' => 'No check-in found for today.'], 422);
        }

        if ($record->check_out) {
            return response()->json(['success' => false, 'message' => 'Already checked out today.'], 422);
        }

        $record->update([
            'check_out'  => $now,
            'work_hours' => $record->calculateWorkHours(),
        ]);

        AuditLog::record('face.attendance.check_out', $request,
            ['confidence' => $identifyResult['confidence'], 'distance' => $identifyResult['distance']],
            'employee', $employee->id
        );

        return response()->json([
            'success'    => true,
            'message'    => "Goodbye, {$employee->user->name}! Checked out at {$now->format('H:i')}.",
            'confidence' => $identifyResult['confidence'],
            'data'       => new AttendanceResource($record->load(['employee.user', 'employee.department'])),
        ]);
    }

    // ---------------------------------------------------------------
    private function rejectMockGps(Request $request, ?Employee $employee): ?JsonResponse
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
        ], $employee ? 'employee' : null, $employee?->id);

        if ($employee) {
            $notification = new FakeGpsDetected(
                $employee,
                $request->filled('latitude')  ? (float) $request->input('latitude')  : null,
                $request->filled('longitude') ? (float) $request->input('longitude') : null,
                $accuracy,
                $detectedVia,
            );
            User::role(['admin', 'hr'])->each(fn($u) => $u->notify($notification));
        }

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

    // ---------------------------------------------------------------
    private function identifyDescriptor(array $queryDescriptor): ?array
    {
        $allFaceData = FaceData::where('is_active', true)
            ->with(['employee.user', 'employee.department'])
            ->get();

        $bestMatch    = null;
        $bestDistance = PHP_FLOAT_MAX;

        foreach ($allFaceData as $faceData) {
            $stored = $faceData->getDescriptorArray();
            if (count($stored) !== 128) continue;

            $dist = FaceData::euclideanDistance($queryDescriptor, $stored);
            if ($dist < $bestDistance) {
                $bestDistance = $dist;
                $bestMatch    = $faceData;
            }
        }

        if (!$bestMatch || $bestDistance >= self::THRESHOLD) {
            return null;
        }

        return [
            'face_data'  => $bestMatch,
            'distance'   => $bestDistance,
            'confidence' => round((1 - $bestDistance / self::THRESHOLD) * 100, 1),
        ];
    }

    // ---------------------------------------------------------------
    // Helper: call face-service to extract descriptor from uploaded image
    // ---------------------------------------------------------------
    private function extractDescriptorFromImage(\Illuminate\Http\UploadedFile $image): array
    {
        $client = new \GuzzleHttp\Client(['timeout' => 15]);

        try {
            $response = $client->post('http://127.0.0.1:3003/extract', [
                'multipart' => [
                    [
                        'name'     => 'image',
                        'contents' => fopen($image->getRealPath(), 'r'),
                        'filename' => $image->getClientOriginalName(),
                    ],
                ],
            ]);

            $body = json_decode($response->getBody()->getContents(), true);

            if (!isset($body['descriptor']) || count($body['descriptor']) !== 128) {
                throw new \RuntimeException('Invalid descriptor returned from face service.');
            }

            return $body;
        } catch (\GuzzleHttp\Exception\ConnectException $e) {
            throw new \RuntimeException('Face service unavailable. Please try again later.');
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $body = json_decode($e->getResponse()->getBody()->getContents(), true);
            throw new \RuntimeException($body['error'] ?? 'Face extraction failed.');
        }
    }

    // ---------------------------------------------------------------
    // All authenticated: face check-in/out via raw image (mobile)
    // POST /face/attendance-image  { image: file, action: check_in|check_out }
    // ---------------------------------------------------------------
    public function faceAttendanceImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image'             => ['required', 'file', 'mimes:jpeg,jpg,png,webp', 'max:10240'],
            'action'            => ['required', 'in:check_in,check_out'],
            'latitude'          => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'         => ['nullable', 'numeric', 'between:-180,180'],
            'location_accuracy' => ['nullable', 'numeric', 'min:0'],
            'is_mock_location'  => ['nullable', 'boolean'],
            'liveness_verified' => ['nullable', 'boolean'],
        ]);

        // Check-in method policy
        $policy = Setting::get('attendance.check_in_method', 'any');
        if ($policy === 'manual_only') {
            return response()->json([
                'success' => false,
                'message' => 'Face check-in is disabled by administrator.',
            ], 422);
        }

        // Require client-side liveness verification
        if (!$request->boolean('liveness_verified')) {
            return response()->json([
                'success' => false,
                'message' => 'Liveness verification required. Please update the app and blink to verify.',
            ], 422);
        }

        // Reject mock/fake GPS (use auth user's employee for audit log)
        $mockReject = $this->rejectMockGps($request, $request->user()->employee);
        if ($mockReject) return $mockReject;

        // Geofence check
        $geoError = $this->validateGeofence($request->input('latitude'), $request->input('longitude'));
        if ($geoError) return $geoError;

        try {
            $extracted = $this->extractDescriptorFromImage($validated['image']);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        $identifyResult = $this->identifyDescriptor($extracted['descriptor']);

        if (!$identifyResult) {
            AuditLog::record('face.attendance.no_match', $request,
                ['action' => $validated['action'], 'via' => 'image']
            );
            return response()->json([
                'success' => false,
                'message' => 'Face not recognized. Please try again or use manual check-in.',
            ], 404);
        }

        $employee = $identifyResult['face_data']->employee;
        $today    = Carbon::today();
        $now      = Carbon::now();
        $action   = $validated['action'];

        if ($action === 'check_in') {
            if (AttendanceRecord::where('employee_id', $employee->id)->whereDate('date', $today)->exists()) {
                return response()->json(['success' => false, 'message' => 'Already checked in today.'], 422);
            }

            $record = AttendanceRecord::create([
                'employee_id'      => $employee->id,
                'date'             => $today->toDateString(),
                'check_in'         => $now,
                'status'           => AttendanceRecord::resolveStatus($now),
                'latitude'         => $validated['latitude'] ?? null,
                'longitude'        => $validated['longitude'] ?? null,
                'location_accuracy'=> $validated['location_accuracy'] ?? null,
                'is_mock_location' => $request->boolean('is_mock_location', false),
                'check_in_method'  => 'face',
            ]);

            AuditLog::record('face.attendance.check_in', $request,
                ['confidence' => $identifyResult['confidence'], 'distance' => $identifyResult['distance'], 'via' => 'image'],
                'employee', $employee->id
            );

            return response()->json([
                'success'    => true,
                'message'    => "Welcome, {$employee->user->name}! Checked in at {$now->format('H:i')}.",
                'confidence' => $identifyResult['confidence'],
                'data'       => new AttendanceResource($record->load(['employee.user', 'employee.department'])),
            ], 201);
        }

        // check_out
        $record = AttendanceRecord::where('employee_id', $employee->id)
            ->whereDate('date', $today)
            ->first();

        if (!$record) {
            return response()->json(['success' => false, 'message' => 'No check-in found for today.'], 422);
        }

        if ($record->check_out) {
            return response()->json(['success' => false, 'message' => 'Already checked out today.'], 422);
        }

        $record->update([
            'check_out'  => $now,
            'work_hours' => $record->calculateWorkHours(),
        ]);

        AuditLog::record('face.attendance.check_out', $request,
            ['confidence' => $identifyResult['confidence'], 'distance' => $identifyResult['distance'], 'via' => 'image'],
            'employee', $employee->id
        );

        return response()->json([
            'success'    => true,
            'message'    => "Goodbye, {$employee->user->name}! Checked out at {$now->format('H:i')}.",
            'confidence' => $identifyResult['confidence'],
            'data'       => new AttendanceResource($record->load(['employee.user', 'employee.department'])),
        ]);
    }

    // ---------------------------------------------------------------
    // All authenticated: check own enrollment status
    // GET /face/me
    // ---------------------------------------------------------------
    public function myStatus(Request $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee profile not found.', 'data' => null], 404);
        }

        $face = FaceData::where('employee_id', $employee->id)->where('is_active', true)->first();

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => [
                'enrolled'    => $face !== null,
                'enrolled_at' => $face?->enrolled_at?->toISOString(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // All authenticated: self-enroll own face via descriptor (web/browser)
    // POST /face/self-enroll  { descriptor: [...128], snapshot?: base64 }
    // ---------------------------------------------------------------
    public function selfEnroll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'descriptor'   => ['required', 'array', 'size:128'],
            'descriptor.*' => ['required', 'numeric', 'between:-2,2'],
            'snapshot'     => ['nullable', 'string'],
        ]);

        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee profile not found.'], 404);
        }

        $imagePath = null;

        if (!empty($validated['snapshot'])) {
            $base64    = preg_replace('/^data:image\/\w+;base64,/', '', $validated['snapshot']);
            $imageData = base64_decode($base64);

            if ($imageData !== false) {
                $filename  = 'faces/employee_' . $employee->id . '_' . time() . '.jpg';
                Storage::disk('public')->put($filename, $imageData);
                $imagePath = $filename;
            }
        }

        FaceData::updateOrCreate(
            ['employee_id' => $employee->id],
            [
                'descriptor'  => $validated['descriptor'],
                'image_path'  => $imagePath,
                'is_active'   => true,
                'enrolled_by' => $request->user()->id,
                'enrolled_at' => now(),
            ]
        );

        AuditLog::record('face.self_enroll', $request,
            ['employee_id' => $employee->id],
            'employee', $employee->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Wajah berhasil didaftarkan!',
            'data'    => ['enrolled' => true],
        ], 201);
    }

    // ---------------------------------------------------------------
    // All authenticated: self-enroll own face via image
    // POST /face/self-enroll-image  { image: file }
    // ---------------------------------------------------------------
    public function selfEnrollImage(Request $request): JsonResponse
    {
        $request->validate([
            'image'             => ['required', 'file', 'mimes:jpeg,jpg,png,webp', 'max:10240'],
            'liveness_verified' => ['nullable', 'boolean'],
        ]);

        // Require client-side liveness verification
        if (!$request->boolean('liveness_verified')) {
            return response()->json([
                'success' => false,
                'message' => 'Liveness verification required. Please update the app and blink to verify.',
            ], 422);
        }

        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee profile not found.', 'data' => null], 404);
        }

        try {
            $extracted = $this->extractDescriptorFromImage($request->file('image'));
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        $filename = 'faces/employee_' . $employee->id . '_' . time() . '.jpg';
        Storage::disk('public')->put($filename, file_get_contents($request->file('image')->getRealPath()));

        FaceData::updateOrCreate(
            ['employee_id' => $employee->id],
            [
                'descriptor'  => $extracted['descriptor'], // encrypted:array cast handles encode+encrypt
                'image_path'  => $filename,
                'is_active'   => true,
                'enrolled_by' => $request->user()->id,
                'enrolled_at' => now(),
            ]
        );

        AuditLog::record('face.self_enroll', $request,
            ['employee_id' => $employee->id],
            'employee', $employee->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Wajah berhasil didaftarkan!',
            'data'    => ['enrolled' => true],
        ], 201);
    }

    // ---------------------------------------------------------------
    // Admin/HR: enroll face via raw image (mobile enrollment)
    // POST /face/enroll-image  { employee_id: int, image: file }
    // ---------------------------------------------------------------
    public function enrollImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'image'       => ['required', 'file', 'mimes:jpeg,jpg,png,webp', 'max:10240'],
        ]);

        try {
            $extracted = $this->extractDescriptorFromImage($validated['image']);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        // Save the image to storage
        $filename  = 'faces/employee_' . $validated['employee_id'] . '_' . time() . '.jpg';
        Storage::disk('public')->put($filename, file_get_contents($validated['image']->getRealPath()));

        $faceData = FaceData::updateOrCreate(
            ['employee_id' => $validated['employee_id']],
            [
                'descriptor'  => $extracted['descriptor'], // encrypted:array cast handles encode+encrypt
                'image_path'  => $filename,
                'is_active'   => true,
                'enrolled_by' => $request->user()->id,
                'enrolled_at' => now(),
            ]
        );

        AuditLog::record('face.enroll', $request,
            ['employee_id' => $validated['employee_id'], 'via' => 'image'],
            'employee', $validated['employee_id']
        );

        return response()->json([
            'success' => true,
            'message' => 'Face enrolled successfully.',
            'data'    => new FaceDataResource($faceData->load(['employee.user', 'employee.department', 'enrolledBy'])),
        ], 201);
    }

}
