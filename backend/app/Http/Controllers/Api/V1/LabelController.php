<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLabelRequest;
use App\Http\Resources\LabelResource;
use App\Models\Label;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LabelController extends Controller
{
    public function index(): JsonResponse
    {
        $labels = Label::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => LabelResource::collection($labels),
        ]);
    }

    public function store(StoreLabelRequest $request): JsonResponse
    {
        $label = Label::create(array_merge(
            $request->validated(),
            ['created_by' => $request->user()->id]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Label created.',
            'data'    => new LabelResource($label),
        ], 201);
    }

    public function update(StoreLabelRequest $request, Label $label): JsonResponse
    {
        $label->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Label updated.',
            'data'    => new LabelResource($label),
        ]);
    }

    public function destroy(Label $label): JsonResponse
    {
        $label->delete();

        return response()->json(['success' => true, 'message' => 'Label deleted.']);
    }
}
