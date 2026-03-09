<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MeetingRsvp;
use App\Models\User;
use App\Notifications\MeetingNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class MeetingController extends Controller
{
    /**
     * Admin/HR: all meetings (upcoming first, then past).
     */
    public function index(): JsonResponse
    {
        $meetings = Meeting::with(['createdBy', 'rsvps'])
            ->orderBy('meeting_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get()
            ->map(fn (Meeting $m) => $this->formatMeeting($m));

        return response()->json(['success' => true, 'data' => $meetings]);
    }

    /**
     * All authenticated: meetings relevant to the current user's role.
     */
    public function my(Request $request): JsonResponse
    {
        $user  = $request->user();
        $role  = $user->roles->first()?->name ?? '';

        $targetRoles = match ($role) {
            'staff'         => ['all', 'staff'],
            'admin', 'hr'   => ['all', 'admin_hr'],
            default         => ['all'],
        };

        $meetings = Meeting::with(['createdBy', 'rsvps'])
            ->whereIn('target_roles', $targetRoles)
            ->orderBy('meeting_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get()
            ->map(fn (Meeting $m) => $this->formatMeeting($m, $user->id));

        return response()->json(['success' => true, 'data' => $meetings]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'meeting_date' => ['required', 'date'],
            'start_time'   => ['required', 'date_format:H:i'],
            'end_time'     => ['required', 'date_format:H:i', 'after:start_time'],
            'location'     => ['nullable', 'string', 'max:255'],
            'meeting_url'  => ['nullable', 'url', 'max:500'],
            'target_roles' => ['sometimes', 'in:all,staff,admin_hr'],
        ]);

        $meeting = Meeting::create(array_merge($validated, ['created_by' => $request->user()->id]));
        $meeting->load(['createdBy', 'rsvps']);

        $users = match ($meeting->target_roles) {
            'staff'    => User::role('staff')->where('is_active', true)->get(),
            'admin_hr' => User::role(['admin', 'hr'])->where('is_active', true)->get(),
            default    => User::where('is_active', true)->get(),
        };

        Notification::send($users, new MeetingNotification($meeting));

        return response()->json([
            'success' => true,
            'message' => 'Meeting created and notifications sent.',
            'data'    => $this->formatMeeting($meeting),
        ], 201);
    }

    public function show(Request $request, Meeting $meeting): JsonResponse
    {
        $meeting->load(['createdBy', 'rsvps.user']);
        return response()->json([
            'success' => true,
            'data'    => $this->formatMeeting($meeting, $request->user()->id),
        ]);
    }

    public function update(Request $request, Meeting $meeting): JsonResponse
    {
        $validated = $request->validate([
            'title'        => ['sometimes', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'meeting_date' => ['sometimes', 'date'],
            'start_time'   => ['sometimes', 'date_format:H:i'],
            'end_time'     => ['sometimes', 'date_format:H:i'],
            'location'     => ['nullable', 'string', 'max:255'],
            'meeting_url'  => ['nullable', 'url', 'max:500'],
            'target_roles' => ['sometimes', 'in:all,staff,admin_hr'],
        ]);

        $meeting->update($validated);
        $meeting->load(['createdBy', 'rsvps']);

        return response()->json([
            'success' => true,
            'message' => 'Meeting updated.',
            'data'    => $this->formatMeeting($meeting),
        ]);
    }

    public function destroy(Meeting $meeting): JsonResponse
    {
        $meeting->delete();
        return response()->json(['success' => true, 'message' => 'Meeting deleted.']);
    }

    /**
     * Staff/all: submit or update RSVP for a meeting.
     */
    public function rsvp(Request $request, Meeting $meeting): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:accepted,declined'],
        ]);

        MeetingRsvp::updateOrCreate(
            ['meeting_id' => $meeting->id, 'user_id' => $request->user()->id],
            ['status' => $validated['status']]
        );

        $meeting->load(['createdBy', 'rsvps']);

        return response()->json([
            'success' => true,
            'message' => 'RSVP recorded.',
            'data'    => $this->formatMeeting($meeting, $request->user()->id),
        ]);
    }

    /**
     * Admin/HR: get list of RSVPs for a meeting.
     */
    public function rsvpList(Meeting $meeting): JsonResponse
    {
        $rsvps = $meeting->rsvps()->with('user')->get()->map(fn (MeetingRsvp $r) => [
            'user_id' => $r->user_id,
            'name'    => $r->user->name,
            'status'  => $r->status,
        ]);

        $accepted = $rsvps->where('status', 'accepted')->count();
        $declined = $rsvps->where('status', 'declined')->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'rsvps'  => $rsvps->values(),
                'counts' => ['accepted' => $accepted, 'declined' => $declined, 'total' => $accepted + $declined],
            ],
        ]);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private function formatMeeting(Meeting $meeting, ?int $userId = null): array
    {
        $myRsvp = $userId
            ? $meeting->rsvps->firstWhere('user_id', $userId)?->status
            : null;

        $accepted = $meeting->rsvps->where('status', 'accepted')->count();
        $declined = $meeting->rsvps->where('status', 'declined')->count();

        return [
            'id'           => $meeting->id,
            'title'        => $meeting->title,
            'description'  => $meeting->description,
            'meeting_date' => $meeting->meeting_date->toDateString(),
            'start_time'   => $meeting->start_time,
            'end_time'     => $meeting->end_time,
            'location'     => $meeting->location,
            'meeting_url'  => $meeting->meeting_url,
            'target_roles' => $meeting->target_roles,
            'created_by'   => $meeting->createdBy?->name,
            'created_at'   => $meeting->created_at?->toISOString(),
            'my_rsvp'      => $myRsvp,
            'rsvp_counts'  => [
                'accepted' => $accepted,
                'declined' => $declined,
                'total'    => $accepted + $declined,
            ],
        ];
    }
}
