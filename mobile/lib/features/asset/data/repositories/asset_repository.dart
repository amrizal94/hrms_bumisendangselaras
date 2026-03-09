import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/asset_remote_datasource.dart';
import '../models/asset_model.dart';

class AssetRepository {
  final AssetRemoteDatasource _ds;
  AssetRepository(this._ds);

  Future<List<AssetAssignmentModel>> getMyAssets() => _ds.getMyAssets();

  Future<Map<String, dynamic>> getAssets({
    String? status,
    int? categoryId,
    String? search,
    int page = 1,
  }) =>
      _ds.getAssets(
        status:     status,
        categoryId: categoryId,
        search:     search,
        page:       page,
      );

  Future<Map<String, dynamic>> getAssetStats() => _ds.getAssetStats();

  Future<void> assignAsset(
    int id, {
    required int employeeId,
    required String assignedDate,
    required String conditionOnAssign,
    String? notes,
  }) =>
      _ds.assignAsset(
        id,
        employeeId:        employeeId,
        assignedDate:      assignedDate,
        conditionOnAssign: conditionOnAssign,
        notes:             notes,
      );

  Future<void> returnAsset(
    int id, {
    required String returnedDate,
    required String conditionOnReturn,
    String? notes,
  }) =>
      _ds.returnAsset(
        id,
        returnedDate:      returnedDate,
        conditionOnReturn: conditionOnReturn,
        notes:             notes,
      );

  Future<void> createAsset({
    required String name,
    required String assetCode,
    int? categoryId,
    String? brand,
    String? model,
    String? serialNumber,
    String? purchaseDate,
    double? purchasePrice,
    String condition = 'good',
    String? notes,
  }) =>
      _ds.createAsset(
        name:          name,
        assetCode:     assetCode,
        categoryId:    categoryId,
        brand:         brand,
        model:         model,
        serialNumber:  serialNumber,
        purchaseDate:  purchaseDate,
        purchasePrice: purchasePrice,
        condition:     condition,
        notes:         notes,
      );

  Future<void> updateAsset(
    int id, {
    String? name,
    String? assetCode,
    int? categoryId,
    String? brand,
    String? model,
    String? serialNumber,
    String? purchaseDate,
    double? purchasePrice,
    String? condition,
    String? notes,
  }) =>
      _ds.updateAsset(
        id,
        name:          name,
        assetCode:     assetCode,
        categoryId:    categoryId,
        brand:         brand,
        model:         model,
        serialNumber:  serialNumber,
        purchaseDate:  purchaseDate,
        purchasePrice: purchasePrice,
        condition:     condition,
        notes:         notes,
      );

  Future<void> disposeAsset(int id, {String? notes}) =>
      _ds.disposeAsset(id, notes: notes);

  Future<void> deleteAsset(int id) => _ds.deleteAsset(id);

  Future<List<Map<String, dynamic>>> getActiveEmployees() =>
      _ds.getActiveEmployees();

  Future<List<Map<String, dynamic>>> getAssetCategories() =>
      _ds.getAssetCategories();
}

final assetRepositoryProvider = Provider<AssetRepository>(
  (ref) => AssetRepository(ref.watch(assetRemoteDatasourceProvider)),
);
