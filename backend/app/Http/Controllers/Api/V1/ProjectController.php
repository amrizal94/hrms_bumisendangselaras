<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Employee;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Project::query()->withCount('tasks')->with('creator');

        if ($user->hasRole(['admin', 'hr', 'manager', 'director'])) {
            // Admin/HR see all
        } elseif ($request->boolean('for_task_creation')) {
            // Staff requesting projects for self-task creation: all active projects
            $query->where('status', 'active');
        } else {
            // Staff: only projects where at least one task is assigned to them
            $employee = Employee::where('user_id', $user->id)->first();
            $empId    = $employee?->id;
            $query->whereHas('tasks', fn($q) => $q->where('assigned_to', $empId));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('name', 'ilike', "%{$search}%");
        }

        $projects = $query->orderByDesc('created_at')->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => ProjectResource::collection($projects->items()),
            'meta'    => [
                'total'        => $projects->total(),
                'per_page'     => $projects->perPage(),
                'current_page' => $projects->currentPage(),
                'last_page'    => $projects->lastPage(),
            ],
        ]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = Project::create(array_merge(
            $request->validated(),
            ['created_by' => $request->user()->id]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Project created.',
            'data'    => new ProjectResource($project->load('creator')),
        ], 201);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasRole(['admin', 'hr', 'manager', 'director'])) {
            $employee = Employee::where('user_id', $user->id)->first();
            $empId    = $employee?->id;
            $hasTask  = $project->tasks()->where('assigned_to', $empId)->exists();
            if (!$hasTask) {
                return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data'    => new ProjectResource($project->load('creator')),
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $project->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Project updated.',
            'data'    => new ProjectResource($project->load('creator')),
        ]);
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json(['success' => true, 'message' => 'Project deleted.']);
    }
}
