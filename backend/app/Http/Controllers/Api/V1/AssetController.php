<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\AssetCategory;
use App\Notifications\AssetAssigned;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssetController extends Controller
{
    // Admin/HR: list all assets
    public function index(Request $request)
    {
        $q = Asset::with(['category', 'currentAssignment.employee.user', 'currentAssignment.assignedBy'])
            ->withCount('assignments');

        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }
        if ($request->filled('category_id')) {
            $q->where('asset_category_id', $request->category_id);
        }
        if ($request->filled('search')) {
            $q->where(function ($sub) use ($request) {
                $sub->where('name', 'ilike', '%' . $request->search . '%')
                    ->orWhere('asset_code', 'ilike', '%' . $request->search . '%')
                    ->orWhere('serial_number', 'ilike', '%' . $request->search . '%')
                    ->orWhere('brand', 'ilike', '%' . $request->search . '%');
            });
        }

        $perPage = (int) ($request->per_page ?? 15);
        $assets = $q->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => $assets->items(),
            'meta' => [
                'total' => $assets->total(),
                'per_page' => $assets->perPage(),
                'current_page' => $assets->currentPage(),
                'last_page' => $assets->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:200',
            'asset_code' => 'required|string|max:50|unique:assets,asset_code',
            'asset_category_id' => 'nullable|exists:asset_categories,id',
            'serial_number' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'warranty_until' => 'nullable|date',
            'condition' => 'in:good,fair,poor',
            'notes' => 'nullable|string',
        ]);

        $asset = Asset::create($data);
        $asset->load('category');

        return response()->json(['success' => true, 'message' => 'Aset berhasil ditambahkan', 'data' => $asset], 201);
    }

    public function show(Asset $asset)
    {
        $asset->load(['category', 'currentAssignment.employee.user', 'currentAssignment.assignedBy',
            'assignments' => fn($q) => $q->with(['employee.user', 'assignedBy'])->orderByDesc('assigned_date')]);

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $asset]);
    }

    public function update(Request $request, Asset $asset)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:200',
            'asset_code' => 'sometimes|string|max:50|unique:assets,asset_code,' . $asset->id,
            'asset_category_id' => 'nullable|exists:asset_categories,id',
            'serial_number' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'warranty_until' => 'nullable|date',
            'condition' => 'sometimes|in:good,fair,poor',
            'status' => 'sometimes|in:available,in_use,maintenance,disposed',
            'notes' => 'nullable|string',
        ]);

        $asset->update($data);
        $asset->load('category');

        return response()->json(['success' => true, 'message' => 'Aset berhasil diperbarui', 'data' => $asset]);
    }

    public function destroy(Asset $asset)
    {
        if ($asset->currentAssignment()->exists()) {
            return response()->json(['success' => false, 'message' => 'Aset tidak dapat dihapus karena sedang digunakan'], 422);
        }
        $asset->delete();
        return response()->json(['success' => true, 'message' => 'Aset berhasil dihapus']);
    }

    // Assign asset to employee
    public function assign(Request $request, Asset $asset)
    {
        if ($asset->status === 'in_use') {
            return response()->json(['success' => false, 'message' => 'Aset sedang digunakan oleh karyawan lain'], 422);
        }
        if (in_array($asset->status, ['maintenance', 'disposed'])) {
            return response()->json(['success' => false, 'message' => 'Aset tidak tersedia untuk dipinjamkan'], 422);
        }

        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'assigned_date' => 'required|date',
            'condition_on_assign' => 'in:good,fair,poor',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($asset, $data, $request) {
            AssetAssignment::create([
                'asset_id' => $asset->id,
                'employee_id' => $data['employee_id'],
                'assigned_by' => $request->user()->id,
                'assigned_date' => $data['assigned_date'],
                'condition_on_assign' => $data['condition_on_assign'] ?? 'good',
                'notes' => $data['notes'] ?? null,
            ]);

            $asset->update(['status' => 'in_use']);
        });

        $asset->load(['category', 'currentAssignment.employee.user', 'currentAssignment.assignedBy']);
        $assignment = $asset->currentAssignment;
        try {
            optional($assignment?->employee?->user)->notify(new AssetAssigned($assignment, 'assigned'));
        } catch (\Throwable $e) {
            \Log::warning('AssetAssigned notification failed: ' . $e->getMessage());
        }

        return response()->json(['success' => true, 'message' => 'Aset berhasil dipinjamkan', 'data' => $asset]);
    }

    // Return asset from employee
    public function returnAsset(Request $request, Asset $asset)
    {
        $assignment = $asset->currentAssignment;
        if (!$assignment) {
            return response()->json(['success' => false, 'message' => 'Aset tidak sedang dipinjam'], 422);
        }

        $data = $request->validate([
            'returned_date' => 'required|date',
            'condition_on_return' => 'in:good,fair,poor',
            'notes' => 'nullable|string',
        ]);

        $assignment->loadMissing('employee.user');
        $emp = $assignment->employee;

        DB::transaction(function () use ($asset, $assignment, $data) {
            $assignment->update([
                'returned_date' => $data['returned_date'],
                'condition_on_return' => $data['condition_on_return'] ?? 'good',
                'notes' => ($assignment->notes ? $assignment->notes . ' | ' : '') . ($data['notes'] ?? ''),
            ]);

            $asset->update(['status' => 'available']);
        });

        try {
            optional($emp?->user)->notify(new AssetAssigned($assignment, 'returned'));
        } catch (\Throwable $e) {
            \Log::warning('AssetReturned notification failed: ' . $e->getMessage());
        }

        $asset->load(['category', 'currentAssignment']);

        return response()->json(['success' => true, 'message' => 'Aset berhasil dikembalikan', 'data' => $asset]);
    }

    // Mark asset as disposed (decommissioned — data preserved)
    public function dispose(Request $request, Asset $asset): \Illuminate\Http\JsonResponse
    {
        if ($asset->status === 'in_use') {
            return response()->json(['success' => false, 'message' => 'Aset sedang dipinjam. Kembalikan dulu sebelum dibuang.'], 422);
        }
        if ($asset->status === 'disposed') {
            return response()->json(['success' => false, 'message' => 'Aset sudah ditandai sebagai dibuang.'], 422);
        }

        $data = $request->validate(['notes' => 'nullable|string']);

        $asset->update([
            'status' => 'disposed',
            'notes'  => $data['notes'] ?? $asset->notes,
        ]);
        $asset->load('category');

        return response()->json(['success' => true, 'message' => 'Aset berhasil ditandai sebagai dibuang', 'data' => $asset]);
    }

    // Staff: list assets assigned to me
    public function myAssets(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['success' => true, 'message' => 'OK', 'data' => []]);
        }

        $assignments = AssetAssignment::with(['asset.category', 'assignedBy'])
            ->where('employee_id', $employee->id)
            ->whereNull('returned_date')
            ->orderByDesc('assigned_date')
            ->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $assignments]);
    }

    // Export all assets as CSV
    public function export(Request $request)
    {
        $q = Asset::with(['category', 'currentAssignment.employee.user', 'currentAssignment.employee.department', 'currentAssignment.assignedBy'])
            ->withCount('assignments');

        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }
        if ($request->filled('category_id')) {
            $q->where('asset_category_id', $request->category_id);
        }

        $assets = $q->orderByDesc('created_at')->get();

        $statusLabels = [
            'available'   => 'Tersedia',
            'in_use'      => 'Sedang Dipakai',
            'maintenance' => 'Maintenance',
            'disposed'    => 'Dibuang',
        ];
        $conditionLabels = ['good' => 'Baik', 'fair' => 'Cukup', 'poor' => 'Buruk'];

        $filename = 'laporan-aset-' . now()->format('Ymd-His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($assets, $statusLabels, $conditionLabels) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM for Excel
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'Kode Aset', 'Nama Aset', 'Kategori', 'Merek', 'Model',
                'No. Seri', 'Kondisi', 'Status', 'Harga Beli', 'Tgl Beli', 'Garansi Hingga',
                'Pemegang Saat Ini', 'Departemen', 'Tgl Dipinjam', 'Dicatat Oleh', 'Total Peminjaman', 'Catatan',
            ]);

            foreach ($assets as $asset) {
                $current = $asset->currentAssignment;
                fputcsv($handle, [
                    $asset->asset_code,
                    $asset->name,
                    $asset->category?->name ?? '-',
                    $asset->brand ?? '-',
                    $asset->model ?? '-',
                    $asset->serial_number ?? '-',
                    $conditionLabels[$asset->condition] ?? $asset->condition,
                    $statusLabels[$asset->status] ?? $asset->status,
                    $asset->purchase_price ? number_format((float) $asset->purchase_price, 0, ',', '.') : '-',
                    $asset->purchase_date?->format('d/m/Y') ?? '-',
                    $asset->warranty_until?->format('d/m/Y') ?? '-',
                    $current?->employee?->user?->name ?? '-',
                    $current?->employee?->department?->name ?? '-',
                    $current?->assigned_date?->format('d/m/Y') ?? '-',
                    $current?->assignedBy?->name ?? '-',
                    $asset->assignments_count,
                    $asset->notes ?? '-',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    // Summary stats for dashboard
    public function stats()
    {
        $total = Asset::count();
        $available = Asset::where('status', 'available')->count();
        $inUse = Asset::where('status', 'in_use')->count();
        $maintenance = Asset::where('status', 'maintenance')->count();

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => [
                'total' => $total,
                'available' => $available,
                'in_use' => $inUse,
                'maintenance' => $maintenance,
            ],
        ]);
    }
}
