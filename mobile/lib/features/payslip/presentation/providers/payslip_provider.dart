import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/payslip_model.dart';
import '../../data/repositories/payslip_repository.dart';

final myPayslipsProvider = FutureProvider<List<PayslipModel>>(
  (ref) => ref.watch(payslipRepositoryProvider).getMyPayslips(),
);
