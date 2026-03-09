<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\HolidayResource;
use App\Models\Holiday;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    // ---------------------------------------------------------------
    // List holidays (all authenticated), filter by year
    // ---------------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $year = $request->integer('year', now()->year);

        $holidays = Holiday::whereYear('date', $year)
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => HolidayResource::collection($holidays),
            'meta'    => ['year' => $year, 'total' => $holidays->count()],
        ]);
    }

    // ---------------------------------------------------------------
    // List holiday dates only (lightweight, for client-side checks)
    // ---------------------------------------------------------------
    public function dates(Request $request): JsonResponse
    {
        $year = $request->integer('year', now()->year);

        $dates = Holiday::whereYear('date', $year)
            ->orderBy('date')
            ->pluck('date')
            ->map(fn($d) => $d->toDateString());

        return response()->json([
            'success' => true,
            'data'    => $dates,
        ]);
    }

    // ---------------------------------------------------------------
    // Create holiday (admin only)
    // ---------------------------------------------------------------
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'date'        => ['required', 'date', 'unique:holidays,date'],
            'type'        => ['required', 'in:national,company'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $holiday = Holiday::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Holiday created.',
            'data'    => new HolidayResource($holiday),
        ], 201);
    }

    // ---------------------------------------------------------------
    // Update holiday (admin only)
    // ---------------------------------------------------------------
    public function update(Request $request, Holiday $holiday): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'date'        => ['sometimes', 'date', "unique:holidays,date,{$holiday->id}"],
            'type'        => ['sometimes', 'in:national,company'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $holiday->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Holiday updated.',
            'data'    => new HolidayResource($holiday),
        ]);
    }

    // ---------------------------------------------------------------
    // Delete holiday (admin only)
    // ---------------------------------------------------------------
    public function destroy(Holiday $holiday): JsonResponse
    {
        $holiday->delete();

        return response()->json(['success' => true, 'message' => 'Holiday deleted.']);
    }
}
