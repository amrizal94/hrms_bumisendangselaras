import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/holiday_model.dart';
import '../providers/holiday_provider.dart';

class HolidaysScreen extends ConsumerStatefulWidget {
  const HolidaysScreen({super.key});

  @override
  ConsumerState<HolidaysScreen> createState() => _HolidaysScreenState();
}

class _HolidaysScreenState extends ConsumerState<HolidaysScreen> {
  int _year = DateTime.now().year;

  @override
  Widget build(BuildContext context) {
    final holidaysAsync = ref.watch(holidaysProvider(_year));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Public Holidays'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Year selector
          Container(
            color: Colors.teal.shade50,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => setState(() => _year--),
                  tooltip: 'Previous year',
                ),
                Text(
                  '$_year',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: _year < DateTime.now().year + 1
                      ? () => setState(() => _year++)
                      : null,
                  tooltip: 'Next year',
                ),
              ],
            ),
          ),

          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(holidaysProvider(_year)),
              child: holidaysAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error: $e')),
                data: (holidays) => holidays.isEmpty
                    ? const Center(child: Text('No holidays found for this year.'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: holidays.length,
                        itemBuilder: (context, i) => _HolidayCard(holiday: holidays[i]),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HolidayCard extends StatelessWidget {
  final HolidayModel holiday;
  const _HolidayCard({required this.holiday});

  @override
  Widget build(BuildContext context) {
    final isNational = holiday.type == 'national';
    final badgeColor = isNational ? Colors.red.shade700 : Colors.teal;
    final badgeLabel = isNational ? 'NATIONAL' : 'COMPANY';

    // Parse date for display
    DateTime? date;
    try {
      date = DateTime.parse(holiday.date);
    } catch (_) {}

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: date != null
            ? SizedBox(
                width: 48,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '${date.day}',
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      monthNames[date.month - 1],
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                    Text(
                      dayNames[date.weekday - 1],
                      style: const TextStyle(fontSize: 11, color: Colors.teal),
                    ),
                  ],
                ),
              )
            : null,
        title: Text(
          holiday.name,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: holiday.description != null && holiday.description!.isNotEmpty
            ? Text(holiday.description!, style: const TextStyle(fontSize: 12))
            : null,
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: badgeColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            badgeLabel,
            style: TextStyle(
                fontSize: 10, color: badgeColor, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}
