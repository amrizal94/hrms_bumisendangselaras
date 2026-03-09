<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use App\Models\User;
use App\Notifications\AnnouncementBroadcast;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::with('creator')->latest();

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        $limit = $request->integer('limit', 50);
        $announcements = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'data'    => AnnouncementResource::collection($announcements),
        ]);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new AnnouncementResource($announcement->load('creator')),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'content'      => ['required', 'string'],
            'category'     => ['sometimes', 'in:general,hr,policy,event'],
            'priority'     => ['sometimes', 'in:low,medium,high'],
            'target_roles' => ['sometimes', 'in:all,staff,admin_hr'],
        ]);

        $announcement = Announcement::create(array_merge(
            $validated,
            ['created_by' => $request->user()->id]
        ));

        $announcement->load('creator');

        // Resolve target users
        $users = match ($announcement->target_roles) {
            'staff'    => User::role('staff')->where('is_active', true)->get(),
            'admin_hr' => User::role(['admin', 'hr'])->where('is_active', true)->get(),
            default    => User::where('is_active', true)->get(),
        };

        Notification::send($users, new AnnouncementBroadcast($announcement));

        return response()->json([
            'success' => true,
            'message' => 'Announcement published and notifications sent.',
            'data'    => new AnnouncementResource($announcement),
        ], 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $validated = $request->validate([
            'title'        => ['sometimes', 'string', 'max:255'],
            'content'      => ['sometimes', 'string'],
            'category'     => ['sometimes', 'in:general,hr,policy,event'],
            'priority'     => ['sometimes', 'in:low,medium,high'],
            'target_roles' => ['sometimes', 'in:all,staff,admin_hr'],
        ]);

        $announcement->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Announcement updated.',
            'data'    => new AnnouncementResource($announcement->load('creator')),
        ]);
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted.',
        ]);
    }
}
