<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = AuditLog::with('actor:id,name,email')->latest('created_at');

        $action = $request->query('action', 'face');
        if ($action && $action !== 'all') {
            $q->where('action', 'like', $action . '%');
        }
        if ($from = $request->query('from')) {
            $q->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $q->whereDate('created_at', '<=', $to);
        }

        $logs = $q->paginate((int) $request->query('per_page', 20));

        // Batch-load employee names
        $empIds = $logs->getCollection()
            ->where('target_type', 'employee')
            ->pluck('target_id')
            ->unique()
            ->filter()
            ->values();

        $employees = Employee::with('user:id,name')
            ->whereIn('id', $empIds)
            ->get(['id', 'employee_number', 'user_id'])
            ->keyBy('id');

        $data = $logs->getCollection()->map(fn($log) => [
            'id'     => $log->id,
            'action' => $log->action,
            'actor'  => $log->actor
                ? ['name' => $log->actor->name, 'email' => $log->actor->email]
                : null,
            'target_employee' => ($emp = $employees->get($log->target_id))
                ? [
                    'id'              => $emp->id,
                    'employee_number' => $emp->employee_number,
                    'name'            => $emp->user?->name,
                  ]
                : null,
            'ip_address' => $log->ip_address,
            'metadata'   => $log->metadata,
            'created_at' => $log->created_at,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $data,
            'meta'    => [
                'total'        => $logs->total(),
                'per_page'     => $logs->perPage(),
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
            ],
        ]);
    }
}
