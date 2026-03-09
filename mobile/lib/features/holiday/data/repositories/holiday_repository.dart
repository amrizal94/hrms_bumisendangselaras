import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/holiday_remote_datasource.dart';
import '../models/holiday_model.dart';

final holidayRepositoryProvider = Provider<HolidayRepository>(
  (ref) => HolidayRepository(ref.watch(holidayRemoteDataSourceProvider)),
);

class HolidayRepository {
  final HolidayRemoteDataSource _ds;
  HolidayRepository(this._ds);

  Future<List<HolidayModel>> getHolidays(int year) => _ds.getHolidays(year);
}
