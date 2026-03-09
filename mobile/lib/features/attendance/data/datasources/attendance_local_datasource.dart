import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/pending_attendance_action.dart';

class AttendanceLocalDatasource {
  static const _key = 'pending_attendance_actions';

  Future<List<PendingAttendanceAction>> getPendingActions() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? [];
    return raw.map(PendingAttendanceAction.fromJsonString).toList();
  }

  Future<void> enqueue(PendingAttendanceAction action) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? [];
    raw.add(jsonEncode(action.toJson()));
    await prefs.setStringList(_key, raw);
  }

  Future<void> remove(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? [];
    raw.removeWhere((s) {
      try {
        return (jsonDecode(s) as Map<String, dynamic>)['id'] == id;
      } catch (_) {
        return false;
      }
    });
    await prefs.setStringList(_key, raw);
  }

  Future<int> pendingCount() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_key) ?? []).length;
  }
}

final attendanceLocalDatasourceProvider = Provider<AttendanceLocalDatasource>(
  (_) => AttendanceLocalDatasource(),
);
