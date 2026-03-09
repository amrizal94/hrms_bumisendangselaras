<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $checklistLoaded = $this->relationLoaded('checklistItems');

        return [
            'id'          => $this->id,
            'project_id'  => $this->project_id,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'priority'    => $this->priority,
            'deadline'    => $this->deadline?->toDateString(),
            'sort_order'  => $this->sort_order,
            'project'     => $this->whenLoaded('project', fn() => [
                'id'   => $this->project->id,
                'name' => $this->project->name,
            ]),
            'assignee'    => $this->whenLoaded('assignee', fn() => $this->assignee ? [
                'id'              => $this->assignee->id,
                'employee_number' => $this->assignee->employee_number,
                'user'            => [
                    'id'   => $this->assignee->user->id,
                    'name' => $this->assignee->user->name,
                ],
            ] : null),
            'creator'     => $this->whenLoaded('creator', fn() => [
                'id'   => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'labels'          => $this->whenLoaded('labels', fn() =>
                LabelResource::collection($this->labels)
            ),
            'checklist_items' => $this->whenLoaded('checklistItems', fn() =>
                TaskChecklistItemResource::collection($this->checklistItems)
            ),
            // List-view only counters — omitted when checklist relation is already loaded
            'checklist_total' => $this->when(!$checklistLoaded, fn() => $this->checklistItems()->count()),
            'checklist_done'  => $this->when(!$checklistLoaded, fn() => $this->checklistItems()->where('is_done', true)->count()),
            'photo_url'       => $this->photo_path ? asset('storage/' . $this->photo_path) : null,
            'self_reported'   => (bool) $this->self_reported,
            'notes'           => $this->notes,
            'created_gps'     => $this->created_latitude ? [
                'lat'             => $this->created_latitude,
                'lng'             => $this->created_longitude,
                'face_confidence' => $this->created_face_confidence,
            ] : null,
            'completed_gps'   => $this->completed_latitude ? [
                'lat'             => $this->completed_latitude,
                'lng'             => $this->completed_longitude,
                'accuracy'        => $this->completed_location_accuracy,
                'is_mock'         => (bool) $this->completed_is_mock,
                'face_confidence' => $this->completed_face_confidence,
            ] : null,
            'created_at'      => $this->created_at?->toISOString(),
            'completed_at'    => $this->completed_at?->toISOString(),
        ];
    }
}
