import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/payslip_remote_datasource.dart';
import '../models/payslip_model.dart';

final payslipRepositoryProvider = Provider<PayslipRepository>(
  (ref) => PayslipRepository(ref.watch(payslipRemoteDataSourceProvider)),
);

class PayslipRepository {
  final PayslipRemoteDataSource _ds;
  PayslipRepository(this._ds);

  Future<List<PayslipModel>> getMyPayslips() => _ds.getMyPayslips();
}
