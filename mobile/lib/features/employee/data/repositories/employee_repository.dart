import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/employee_remote_datasource.dart';
import '../models/employee_model.dart';

final employeeRepositoryProvider = Provider<EmployeeRepository>(
  (ref) => EmployeeRepository(ref.watch(employeeRemoteDataSourceProvider)),
);

class EmployeeRepository {
  final EmployeeRemoteDataSource _ds;
  EmployeeRepository(this._ds);

  Future<({List<EmployeeModel> items, int total, int lastPage})> getEmployees({
    int page = 1,
    int perPage = 20,
    String? search,
    String? departmentId,
  }) => _ds.getEmployees(page: page, perPage: perPage, search: search, departmentId: departmentId);

  Future<Map<String, dynamic>> getEmployee(int id) => _ds.getEmployee(id);

  Future<EmployeeModel> createEmployee(Map<String, dynamic> data) =>
      _ds.createEmployee(data);

  Future<EmployeeModel> updateEmployee(int id, Map<String, dynamic> data) =>
      _ds.updateEmployee(id, data);

  Future<List<({int id, String name})>> getDepartments() =>
      _ds.getDepartments();

  Future<List<({int id, String name, String checkInTime, String checkOutTime})>>
      getShifts() => _ds.getShifts();

  Future<EmployeeModel> toggleActive(int employeeId) =>
      _ds.toggleActive(employeeId);
}
