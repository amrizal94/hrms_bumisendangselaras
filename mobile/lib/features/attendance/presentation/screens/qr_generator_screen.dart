import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../data/models/qr_session_model.dart';
import '../providers/attendance_provider.dart';

class QrGeneratorScreen extends ConsumerStatefulWidget {
  const QrGeneratorScreen({super.key});

  @override
  ConsumerState<QrGeneratorScreen> createState() => _QrGeneratorScreenState();
}

class _QrGeneratorScreenState extends ConsumerState<QrGeneratorScreen> {
  String _type = 'check_in';
  DateTime _date = DateTime.now();
  TimeOfDay _validFrom  = const TimeOfDay(hour: 7, minute: 0);
  TimeOfDay _validUntil = const TimeOfDay(hour: 9, minute: 0);
  QrSessionModel? _generated;
  bool _loading = false;
  String? _error;

  String get _dateStr =>
      '${_date.year}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}';

  String _toDatetimeStr(TimeOfDay t) =>
      '$_dateStr ${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}:00';

  String _fmtTime(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked != null) setState(() { _date = picked; _generated = null; });
  }

  Future<void> _pickTime(bool isFrom) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isFrom ? _validFrom : _validUntil,
    );
    if (picked != null) {
      setState(() {
        if (isFrom) _validFrom = picked; else _validUntil = picked;
        _generated = null;
      });
    }
  }

  Future<void> _generate() async {
    setState(() { _loading = true; _error = null; });
    final session = await ref.read(qrSessionProvider.notifier).generate(
      type:       _type,
      date:       _dateStr,
      validFrom:  _toDatetimeStr(_validFrom),
      validUntil: _toDatetimeStr(_validUntil),
    );
    if (!mounted) return;
    if (session == null) {
      setState(() { _error = 'Gagal membuat QR session. Coba lagi.'; _loading = false; });
    } else {
      setState(() { _generated = session; _loading = false; });
    }
  }

  Future<void> _deactivate(int id) async {
    final err = await ref.read(qrSessionProvider.notifier).deactivate(id);
    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
    } else {
      if (_generated?.id == id) setState(() => _generated = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessionsAsync = ref.watch(qrSessionProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('QR Absensi'),
        backgroundColor: Colors.indigo.shade700,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- Type selector ---
            const Text('Tipe QR', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'check_in',  label: Text('Check-In'),  icon: Icon(Icons.login)),
                ButtonSegment(value: 'check_out', label: Text('Check-Out'), icon: Icon(Icons.logout)),
              ],
              selected: {_type},
              onSelectionChanged: (sel) => setState(() { _type = sel.first; _generated = null; }),
            ),
            const SizedBox(height: 16),

            // --- Date ---
            const Text('Tanggal', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _pickDate,
              icon: const Icon(Icons.calendar_today, size: 16),
              label: Text(_dateStr),
            ),
            const SizedBox(height: 16),

            // --- Time range ---
            const Text('Waktu Berlaku', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickTime(true),
                    icon: const Icon(Icons.access_time, size: 16),
                    label: Text(_validFrom.format(context)),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text('–'),
                ),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickTime(false),
                    icon: const Icon(Icons.access_time, size: 16),
                    label: Text(_validUntil.format(context)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_error!, style: const TextStyle(color: Colors.red)),
              ),

            // --- Generate button ---
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _loading ? null : _generate,
                icon: _loading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.qr_code),
                label: Text(_loading ? 'Generating…' : 'Generate QR'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo.shade700,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),

            // --- Generated QR ---
            if (_generated != null) ...[
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Text(
                        '${_generated!.label} — ${_fmtTime(_generated!.validFrom)} – ${_fmtTime(_generated!.validUntil)}',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      Center(
                        child: QrImageView(
                          data: _generated!.token,
                          version: QrVersions.auto,
                          size: 220,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: _generated!.isActive
                              ? Colors.green.shade50
                              : Colors.red.shade50,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: _generated!.isActive ? Colors.green : Colors.red,
                          ),
                        ),
                        child: Text(
                          _generated!.isActive ? 'Aktif' : 'Nonaktif',
                          style: TextStyle(
                            color: _generated!.isActive ? Colors.green.shade700 : Colors.red.shade700,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      if (_generated!.isActive) ...[
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: () => _deactivate(_generated!.id),
                          icon: const Icon(Icons.power_settings_new, color: Colors.red),
                          label: const Text('Nonaktifkan', style: TextStyle(color: Colors.red)),
                          style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.red)),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],

            // --- Today's sessions list ---
            const SizedBox(height: 24),
            const Text('Session Hari Ini', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            const SizedBox(height: 8),
            sessionsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text('Error: $e', style: const TextStyle(color: Colors.red)),
              data: (sessions) {
                if (sessions.isEmpty) {
                  return const Text('Belum ada session.', style: TextStyle(color: Colors.grey));
                }
                return Column(
                  children: sessions.map((s) => _SessionTile(
                    session: s,
                    onDeactivate: () => _deactivate(s.id),
                  )).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _SessionTile extends StatelessWidget {
  final QrSessionModel session;
  final VoidCallback onDeactivate;

  const _SessionTile({required this.session, required this.onDeactivate});

  String _fmtTime(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    final typeColor = session.isCheckIn ? Colors.green : Colors.blue;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: typeColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.qr_code, color: typeColor, size: 20),
        ),
        title: Text(
          '${session.label}  •  ${_fmtTime(session.validFrom)}–${_fmtTime(session.validUntil)}',
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        subtitle: Text(
          session.createdByName != null ? 'By ${session.createdByName}' : '',
          style: const TextStyle(fontSize: 11),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: session.isActive ? Colors.green.shade50 : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: session.isActive ? Colors.green.shade300 : Colors.grey.shade300,
                ),
              ),
              child: Text(
                session.isActive ? 'Aktif' : 'Nonaktif',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: session.isActive ? Colors.green.shade700 : Colors.grey.shade600,
                ),
              ),
            ),
            if (session.isActive) ...[
              const SizedBox(width: 4),
              IconButton(
                icon: const Icon(Icons.power_settings_new, color: Colors.red, size: 18),
                tooltip: 'Nonaktifkan',
                onPressed: onDeactivate,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
