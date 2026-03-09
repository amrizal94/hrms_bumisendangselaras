import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/shift_model.dart';
import '../../data/repositories/shift_repository.dart';

final myShiftProvider = FutureProvider<ShiftModel?>((ref) async {
  return ref.watch(shiftRepositoryProvider).getMyShift();
});
