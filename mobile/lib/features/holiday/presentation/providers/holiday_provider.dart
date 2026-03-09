import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/holiday_model.dart';
import '../../data/repositories/holiday_repository.dart';

final holidaysProvider = FutureProvider.family<List<HolidayModel>, int>(
  (ref, year) => ref.watch(holidayRepositoryProvider).getHolidays(year),
);
