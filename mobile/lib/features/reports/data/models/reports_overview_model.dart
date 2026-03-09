class ReportsOverviewModel {
  final int totalEmployees;
  final int presentToday;
  final int lateToday;
  final int absentToday;
  final int onLeaveToday;
  final int pendingLeaves;
  final int pendingOvertimes;
  final int pendingExpenses;

  const ReportsOverviewModel({
    required this.totalEmployees,
    required this.presentToday,
    required this.lateToday,
    required this.absentToday,
    required this.onLeaveToday,
    required this.pendingLeaves,
    required this.pendingOvertimes,
    required this.pendingExpenses,
  });

  factory ReportsOverviewModel.fromJson(Map<String, dynamic> json) =>
      ReportsOverviewModel(
        totalEmployees:   _toInt(json['total_employees']),
        presentToday:     _toInt(json['present_today']),
        lateToday:        _toInt(json['late_today']),
        absentToday:      _toInt(json['absent_today']),
        onLeaveToday:     _toInt(json['on_leave_today']),
        pendingLeaves:    _toInt(json['pending_leaves']),
        pendingOvertimes: _toInt(json['pending_overtimes']),
        pendingExpenses:  _toInt(json['pending_expenses']),
      );

  static int _toInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '') ?? 0;
  }
}
