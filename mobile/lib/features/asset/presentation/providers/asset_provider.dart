import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/asset_model.dart';
import '../../data/repositories/asset_repository.dart';

// ── Staff: My Assigned Assets ─────────────────────────────────────────────────

class MyAssetsNotifier extends AsyncNotifier<List<AssetAssignmentModel>> {
  @override
  Future<List<AssetAssignmentModel>> build() =>
      ref.watch(assetRepositoryProvider).getMyAssets();
}

final myAssetsProvider =
    AsyncNotifierProvider<MyAssetsNotifier, List<AssetAssignmentModel>>(
        () => MyAssetsNotifier());

// ── Admin/HR: All Assets ──────────────────────────────────────────────────

class AdminAssetsNotifier extends AsyncNotifier<Map<String, dynamic>> {
  String _statusFilter = 'all';
  String _search = '';

  @override
  Future<Map<String, dynamic>> build() =>
      ref.read(assetRepositoryProvider).getAssets(
            status: _statusFilter == 'all' ? null : _statusFilter,
            search: _search.isEmpty ? null : _search,
          );

  void setFilter(String status) {
    _statusFilter = status;
    ref.invalidateSelf();
  }

  void setSearch(String q) {
    _search = q;
    ref.invalidateSelf();
  }

  Future<String?> assignAsset(
    int assetId,
    int employeeId,
    String assignedDate,
    String condition,
    String? notes,
  ) async {
    try {
      await ref.read(assetRepositoryProvider).assignAsset(
            assetId,
            employeeId:        employeeId,
            assignedDate:      assignedDate,
            conditionOnAssign: condition,
            notes:             notes,
          );
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  Future<String?> returnAsset(
    int assetId,
    String returnedDate,
    String condition,
    String? notes,
  ) async {
    try {
      await ref.read(assetRepositoryProvider).returnAsset(
            assetId,
            returnedDate:      returnedDate,
            conditionOnReturn: condition,
            notes:             notes,
          );
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  Future<String?> createAsset({
    required String name,
    required String assetCode,
    int? categoryId,
    String? brand,
    String? model,
    String? serialNumber,
    String? purchasePrice,
    String condition = 'good',
    String? notes,
  }) async {
    try {
      await ref.read(assetRepositoryProvider).createAsset(
            name:          name,
            assetCode:     assetCode,
            categoryId:    categoryId,
            brand:         brand,
            model:         model,
            serialNumber:  serialNumber,
            purchasePrice: purchasePrice != null
                ? double.tryParse(purchasePrice)
                : null,
            condition:     condition,
            notes:         notes,
          );
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  Future<String?> disposeAsset(int assetId, {String? notes}) async {
    try {
      await ref.read(assetRepositoryProvider).disposeAsset(assetId, notes: notes);
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  Future<String?> deleteAsset(int assetId) async {
    try {
      await ref.read(assetRepositoryProvider).deleteAsset(assetId);
      ref.invalidateSelf();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }
}

final adminAssetsProvider =
    AsyncNotifierProvider<AdminAssetsNotifier, Map<String, dynamic>>(
        () => AdminAssetsNotifier());

// Asset Stats
class AssetStatsNotifier extends AsyncNotifier<Map<String, dynamic>> {
  @override
  Future<Map<String, dynamic>> build() =>
      ref.read(assetRepositoryProvider).getAssetStats();
}

final assetStatsProvider =
    AsyncNotifierProvider<AssetStatsNotifier, Map<String, dynamic>>(
        () => AssetStatsNotifier());

// Asset Categories (simple FutureProvider)
final assetCategoriesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.read(assetRepositoryProvider).getAssetCategories();
});

// Active employees list for assign dialog
final activeEmployeesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.read(assetRepositoryProvider).getActiveEmployees();
});
