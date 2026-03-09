<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'BSS HRMS API is running',
        'version' => '1.0.0',
    ]);
});
