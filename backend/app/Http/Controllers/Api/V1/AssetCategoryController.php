<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AssetCategory;
use Illuminate\Http\Request;

class AssetCategoryController extends Controller
{
    public function index()
    {
        $categories = AssetCategory::orderBy('name')->get();
        return response()->json(['success' => true, 'message' => 'OK', 'data' => $categories]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:asset_categories,code',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category = AssetCategory::create($data);
        return response()->json(['success' => true, 'message' => 'Kategori berhasil dibuat', 'data' => $category], 201);
    }

    public function update(Request $request, AssetCategory $assetCategory)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'code' => 'sometimes|string|max:20|unique:asset_categories,code,' . $assetCategory->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $assetCategory->update($data);
        return response()->json(['success' => true, 'message' => 'Kategori berhasil diperbarui', 'data' => $assetCategory]);
    }

    public function destroy(AssetCategory $assetCategory)
    {
        if ($assetCategory->assets()->exists()) {
            return response()->json(['success' => false, 'message' => 'Kategori tidak dapat dihapus karena masih memiliki aset'], 422);
        }
        $assetCategory->delete();
        return response()->json(['success' => true, 'message' => 'Kategori berhasil dihapus']);
    }
}
