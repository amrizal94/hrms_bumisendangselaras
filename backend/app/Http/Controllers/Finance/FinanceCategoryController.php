<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\FinanceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = FinanceCategory::with('createdBy:id,name')
            ->when($request->filled('type'), fn($q) => $q->where('type', $request->string('type')))
            ->when($request->filled('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'type'        => ['required', 'in:income,expense'],
            'color'       => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $category = FinanceCategory::create(array_merge($validated, [
            'created_by' => $request->user()->id,
            'is_active'  => $validated['is_active'] ?? true,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully.',
            'data'    => $category->load('createdBy:id,name'),
        ], 201);
    }

    public function show(FinanceCategory $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $category->load('createdBy:id,name'),
        ]);
    }

    public function update(Request $request, FinanceCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'type'        => ['sometimes', 'in:income,expense'],
            'color'       => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category updated.',
            'data'    => $category->load('createdBy:id,name'),
        ]);
    }

    public function destroy(FinanceCategory $category): JsonResponse
    {
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted.',
        ]);
    }
}
