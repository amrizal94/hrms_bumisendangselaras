import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/shift_remote_datasource.dart';
import '../models/shift_model.dart';

final shiftRepositoryProvider = Provider<ShiftRepository>(
  (ref) => ShiftRepository(ref.watch(shiftRemoteDataSourceProvider)),
);

class ShiftRepository {
  final ShiftRemoteDataSource _ds;
  ShiftRepository(this._ds);

  Future<ShiftModel?> getMyShift() => _ds.getMyShift();
}
