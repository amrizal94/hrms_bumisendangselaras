<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Task;
use App\Models\TaskChecklistItem;
use App\Models\User;
use App\Notifications\TaskAssigned;
use App\Notifications\TaskSelfReported;
use App\Notifications\TaskStatusChanged;
use App\Services\FaceVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Task::query()->with(['project', 'assignee.user', 'labels']);

        if ($user->hasRole(['admin', 'hr', 'manager', 'director'])) {
            // Admin/HR see all
            if ($request->filled('assigned_to')) {
                $query->where('assigned_to', $request->integer('assigned_to'));
            }
        } else {
            // Staff: own assigned tasks + self-reported tasks created by them
            $employee = Employee::where('user_id', $user->id)->first();
            $query->where(function ($q) use ($employee, $user) {
                $q->where('assigned_to', $employee?->id)
                  ->orWhere(function ($q2) use ($user) {
                      $q2->where('self_reported', true)->where('created_by', $user->id);
                  });
            });
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('title', 'ilike', "%{$search}%");
        }

        $tasks = $query
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => TaskResource::collection($tasks->items()),
            'meta'    => [
                'total'        => $tasks->total(),
                'per_page'     => $tasks->perPage(),
                'current_page' => $tasks->currentPage(),
                'last_page'    => $tasks->lastPage(),
            ],
        ]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $user      = $request->user();
        $validated = $request->validated();

        if ($user->hasRole('staff')) {
            // Max 10 self-reported tasks per day
            $todayCount = Task::where('created_by', $user->id)
                ->where('self_reported', true)
                ->whereDate('created_at', today())
                ->count();

            if ($todayCount >= 10) {
                return response()->json([
                    'success' => false,
                    'message' => 'Batas maksimal 10 laporan tugas per hari.',
                ], 422);
            }

            // Validasi face + foto bukti wajib untuk staff
            $request->validate([
                'face_image' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:10240'],
                'task_photo' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
            ]);

            // Reject mock GPS
            if ($request->boolean('is_mock_location') ||
                (float) $request->input('location_accuracy', 1) === 0.0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lokasi palsu terdeteksi. Nonaktifkan mock location dan coba lagi.',
                ], 422);
            }

            // Verify face
            try {
                $faceConfidence = app(FaceVerificationService::class)
                    ->verifyForUser($request->file('face_image'), $user);
            } catch (\RuntimeException $e) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }

            // Save task evidence photo
            $photoPath = $request->file('task_photo')->store(
                'task-photos/' . now()->format('Y/m'),
                'public'
            );

            $employee = Employee::where('user_id', $user->id)->first();

            // Force self-reported fields, ignore admin-only fields
            $validated = collect($validated)
                ->only(['project_id', 'title', 'description', 'deadline', 'notes'])
                ->toArray();
            $validated['self_reported']           = true;
            $validated['assigned_to']             = $employee?->id;
            $validated['photo_path']              = $photoPath;
            $validated['created_latitude']        = $request->input('latitude');
            $validated['created_longitude']       = $request->input('longitude');
            $validated['created_face_confidence'] = $faceConfidence;
        }

        $task = Task::create(array_merge(
            collect($validated)->except(['label_ids', 'checklist_items'])->toArray(),
            [
                'created_by' => $user->id,
                'status'     => $validated['status']   ?? 'todo',
                'priority'   => $validated['priority'] ?? 'medium',
            ]
        ));

        if (!$user->hasRole('staff') && !empty($validated['label_ids'])) {
            $task->labels()->sync($validated['label_ids']);
        }

        if (!$user->hasRole('staff') && !empty($validated['checklist_items'])) {
            $items = array_map(fn($item, $i) => [
                'task_id'    => $task->id,
                'title'      => $item['title'],
                'is_done'    => false,
                'sort_order' => $i,
                'created_at' => now(),
                'updated_at' => now(),
            ], $validated['checklist_items'], array_keys($validated['checklist_items']));

            TaskChecklistItem::insert($items);
        }

        $task->load(['project', 'assignee.user', 'creator', 'labels', 'checklistItems']);

        // Notify assignee about new task (only for admin-assigned tasks)
        if ($task->assigned_to && !$task->self_reported) {
            optional($task->assignee?->user)->notify(new TaskAssigned($task));
        }

        // Notify HR/Manager when staff self-reports a task
        if ($task->self_reported) {
            $recipients = User::role(['hr', 'manager', 'director', 'admin'])->get();
            Notification::send($recipients, new TaskSelfReported($task));
        }

        AuditLog::record('task.create', $request, [
            'target_label' => $task->title,
            'self_reported' => $task->self_reported,
            'project'      => $task->project?->name,
        ], 'task', $task->id);

        return response()->json([
            'success' => true,
            'message' => 'Task created.',
            'data'    => new TaskResource($task),
        ], 201);
    }

    public function show(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasRole(['admin', 'hr', 'manager', 'director'])) {
            $employee = Employee::where('user_id', $user->id)->first();
            $ownTask  = $task->assigned_to === $employee?->id
                || ($task->self_reported && $task->created_by === $user->id);
            if (!$ownTask) {
                return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data'    => new TaskResource(
                $task->load(['project', 'assignee.user', 'creator', 'labels', 'checklistItems'])
            ),
        ]);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $user      = $request->user();
        $validated = $request->validated();

        if (!$user->hasRole(['admin', 'hr', 'manager', 'director'])) {
            // Staff: only allowed to update status on own task
            $employee = Employee::where('user_id', $user->id)->first();
            $ownTask  = $task->assigned_to === $employee?->id
                || ($task->self_reported && $task->created_by === $user->id);
            if (!$ownTask) {
                return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
            }
            $validated = collect($validated)->only(['status'])->toArray();
        }

        $labelIds      = $validated['label_ids'] ?? null;
        $data          = collect($validated)->except(['label_ids', 'checklist_items'])->toArray();
        $oldAssignee   = $task->assigned_to;
        $oldStatus     = $task->status;

        // Auto-set completed_at when status transitions to/from 'done'
        if (array_key_exists('status', $data)) {
            if ($data['status'] === 'done' && $oldStatus !== 'done') {
                $data['completed_at'] = now();
            } elseif ($data['status'] !== 'done' && $oldStatus === 'done') {
                $data['completed_at'] = null;
            }
        }

        $task->update($data);

        if ($user->hasRole(['admin', 'hr', 'manager', 'director']) && $labelIds !== null) {
            $task->labels()->sync($labelIds);
        }

        $task->load(['project', 'assignee.user', 'creator', 'labels', 'checklistItems']);

        // Notify new assignee when task is (re)assigned
        if (array_key_exists('assigned_to', $data)
            && $data['assigned_to'] !== $oldAssignee
            && $task->assigned_to
        ) {
            optional($task->assignee?->user)->notify(new TaskAssigned($task));
        }

        // Notify assignee when admin cancels their task
        if (array_key_exists('status', $data)
            && $data['status'] === 'cancelled'
            && $oldStatus !== 'cancelled'
            && $task->assigned_to
        ) {
            optional($task->assignee?->user)->notify(new TaskStatusChanged($task));
        }

        return response()->json([
            'success' => true,
            'message' => 'Task updated.',
            'data'    => new TaskResource($task),
        ]);
    }

    public function complete(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        // Staff can only complete their own tasks
        if (!$user->hasRole(['admin', 'hr', 'manager', 'director'])) {
            $employee = Employee::where('user_id', $user->id)->first();
            $ownTask  = $task->assigned_to === $employee?->id
                || ($task->self_reported && $task->created_by === $user->id);
            if (!$ownTask) {
                return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
            }
        }

        $request->validate([
            'photo'             => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
            'face_image'        => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:10240'],
            'notes'             => ['nullable', 'string', 'max:1000'],
            'latitude'          => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'         => ['nullable', 'numeric', 'between:-180,180'],
            'location_accuracy' => ['nullable', 'numeric', 'min:0'],
            'is_mock_location'  => ['nullable', 'boolean'],
        ]);

        // Reject mock GPS
        if ($request->boolean('is_mock_location') ||
            (float) $request->input('location_accuracy', 1) === 0.0) {
            return response()->json([
                'success' => false,
                'message' => 'Lokasi palsu terdeteksi. Nonaktifkan mock location dan coba lagi.',
            ], 422);
        }

        // Face verification
        try {
            $faceConfidence = app(FaceVerificationService::class)
                ->verifyForUser($request->file('face_image'), $user);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        $path = $request->file('photo')->store(
            'task-photos/' . now()->format('Y/m'),
            'public'
        );

        $task->update([
            'status'                       => 'done',
            'photo_path'                   => $path,
            'notes'                        => $request->input('notes'),
            'completed_latitude'           => $request->input('latitude'),
            'completed_longitude'          => $request->input('longitude'),
            'completed_location_accuracy'  => $request->input('location_accuracy'),
            'completed_is_mock'            => $request->boolean('is_mock_location'),
            'completed_face_confidence'    => $faceConfidence,
            'completed_at'                 => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tugas selesai.',
            'data'    => new TaskResource(
                $task->load(['project', 'assignee.user', 'creator', 'labels', 'checklistItems'])
            ),
        ]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        AuditLog::record('task.delete', $request, [
            'target_label' => $task->title,
            'project'      => $task->project?->name,
        ], 'task', $task->id);

        $task->delete();

        return response()->json(['success' => true, 'message' => 'Task deleted.']);
    }

    // ---------------------------------------------------------------
    // Checklist
    // ---------------------------------------------------------------

    public function addChecklistItem(Request $request, Task $task): JsonResponse
    {
        $request->validate(['title' => ['required', 'string', 'max:500']]);

        $maxOrder = $task->checklistItems()->max('sort_order') ?? -1;

        $item = $task->checklistItems()->create([
            'title'      => $request->string('title'),
            'is_done'    => false,
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Checklist item added.',
            'data'    => ['id' => $item->id, 'title' => $item->title, 'is_done' => $item->is_done, 'sort_order' => $item->sort_order],
        ], 201);
    }

    public function toggleChecklistItem(Request $request, Task $task, TaskChecklistItem $item): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasRole(['admin', 'hr', 'manager', 'director'])) {
            $employee = Employee::where('user_id', $user->id)->first();
            if ($task->assigned_to !== $employee?->id) {
                return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
            }
        }

        if ($item->task_id !== $task->id) {
            return response()->json(['success' => false, 'message' => 'Item not found.'], 404);
        }

        $item->update(['is_done' => !$item->is_done]);

        return response()->json([
            'success' => true,
            'data'    => ['id' => $item->id, 'is_done' => $item->is_done],
        ]);
    }

    public function deleteChecklistItem(Task $task, TaskChecklistItem $item): JsonResponse
    {
        if ($item->task_id !== $task->id) {
            return response()->json(['success' => false, 'message' => 'Item not found.'], 404);
        }

        $item->delete();

        return response()->json(['success' => true, 'message' => 'Checklist item deleted.']);
    }
}
