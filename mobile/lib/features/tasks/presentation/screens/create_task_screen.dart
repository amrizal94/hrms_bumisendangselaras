import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/services/location_service.dart';
import '../../data/models/project_model.dart';
import '../providers/task_provider.dart';

class CreateTaskScreen extends ConsumerStatefulWidget {
  const CreateTaskScreen({super.key});

  @override
  ConsumerState<CreateTaskScreen> createState() => _CreateTaskScreenState();
}

class _CreateTaskScreenState extends ConsumerState<CreateTaskScreen> {
  final _titleCtrl       = TextEditingController();
  final _descCtrl        = TextEditingController();
  final _notesCtrl       = TextEditingController();
  ProjectModel? _selectedProject;
  bool _isSubmitting = false;
  bool _success      = false;

  // Data snapshot shown on success screen
  String?   _submittedTitle;
  String?   _submittedProject;
  DateTime? _submittedAt;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      !_isSubmitting && _selectedProject != null && _titleCtrl.text.trim().isNotEmpty;

  Future<void> _submit() async {
    if (!_canSubmit) return;
    final messenger = ScaffoldMessenger.of(context);

    // Step 1: Face verification
    final faceFile = await context.push<XFile?>(AppRoutes.taskFaceVerify);
    if (faceFile == null || !mounted) return;

    // Step 2: Task evidence photo (camera-only)
    final photoFile = await context.push<XFile?>(AppRoutes.capturePhoto);
    if (photoFile == null || !mounted) return;

    setState(() => _isSubmitting = true);

    // Step 3: GPS (non-blocking — null is ok)
    final location = await LocationService.getCurrentLocation();

    // Step 4: Submit with face + photo + GPS
    final faceBytes    = await faceFile.readAsBytes();
    final faceFilename = faceFile.name.isNotEmpty ? faceFile.name : 'face_verify.jpg';
    final photoBytes    = await photoFile.readAsBytes();
    final photoFilename = photoFile.name.isNotEmpty ? photoFile.name : 'task_photo.jpg';

    final err = await ref.read(myTasksProvider.notifier).createTask(
      projectId:     _selectedProject!.id,
      title:         _titleCtrl.text.trim(),
      description:   _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
      notes:         _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      faceBytes:     faceBytes.toList(),
      faceFilename:  faceFilename,
      photoBytes:    photoBytes.toList(),
      photoFilename: photoFilename,
      location:      location,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (err != null) {
      messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
    } else {
      setState(() {
        _submittedTitle   = _titleCtrl.text.trim();
        _submittedProject = _selectedProject!.name;
        _submittedAt      = DateTime.now();
        _success          = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Laporkan Tugas'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: _success ? _buildSuccess(context) : _buildForm(context),
    );
  }

  Widget _buildSuccess(BuildContext context) {
    final submittedAt = _submittedAt;
    return SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Animated check icon (scale-in bounce)
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.0, end: 1.0),
                duration: const Duration(milliseconds: 600),
                curve: Curves.elasticOut,
                builder: (_, value, child) =>
                    Transform.scale(scale: value, child: child),
                child: Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: Colors.green.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.check_circle_rounded,
                      size: 52, color: Colors.green.shade600),
                ),
              ),

              const SizedBox(height: 24),
              const Text(
                'Tugas Berhasil Dilaporkan!',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                'Terima kasih! Tim HR akan mereview laporan ini.',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                textAlign: TextAlign.center,
              ),

              // Summary card
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_submittedProject != null)
                      _SummaryRow(
                        icon: Icons.folder_outlined,
                        color: Colors.blue.shade700,
                        text: _submittedProject!,
                      ),
                    if (_submittedTitle != null) ...[
                      const SizedBox(height: 8),
                      _SummaryRow(
                        icon: Icons.task_alt_outlined,
                        color: Colors.green.shade700,
                        text: _submittedTitle!,
                      ),
                    ],
                    if (submittedAt != null) ...[
                      const SizedBox(height: 8),
                      _SummaryRow(
                        icon: Icons.schedule_outlined,
                        color: Colors.grey.shade600,
                        text: _formatSubmitTime(submittedAt),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade700,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text('Lihat Semua Tugas'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => setState(() {
                    _success          = false;
                    _submittedTitle   = null;
                    _submittedProject = null;
                    _submittedAt      = null;
                    _titleCtrl.clear();
                    _descCtrl.clear();
                    _notesCtrl.clear();
                    _selectedProject  = null;
                  }),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text('Tambah Tugas Lain'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatSubmitTime(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}, $hh:$mm';
  }

  Widget _buildForm(BuildContext context) {
    final projectsAsync = ref.watch(activeProjectsProvider);

    return SafeArea(
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Project dropdown
                  _SectionLabel(text: 'Project *'),
                  const SizedBox(height: 8),
                  projectsAsync.when(
                    loading: () => const LinearProgressIndicator(),
                    error: (e, _) => Text('Gagal memuat project: $e',
                        style: const TextStyle(color: Colors.red)),
                    data: (projects) => projects.isEmpty
                        ? Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade300),
                              borderRadius: BorderRadius.circular(8),
                              color: Colors.grey.shade100,
                            ),
                            child: Text(
                              'Tidak ada project aktif.',
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                          )
                        : DropdownButtonFormField<ProjectModel>(
                            value: _selectedProject,
                            decoration: InputDecoration(
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 12),
                              hintText: 'Pilih project',
                            ),
                            items: projects
                                .map((p) => DropdownMenuItem(
                                      value: p,
                                      child: Text(p.name,
                                          overflow: TextOverflow.ellipsis),
                                    ))
                                .toList(),
                            onChanged: (p) =>
                                setState(() => _selectedProject = p),
                          ),
                  ),

                  const SizedBox(height: 16),

                  // Title
                  _SectionLabel(text: 'Judul Tugas *'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _titleCtrl,
                    maxLength: 200,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      hintText: 'Contoh: Review dokumentasi API',
                      counterText: '',
                    ),
                    onChanged: (_) => setState(() {}),
                  ),

                  const SizedBox(height: 16),

                  // Description
                  _SectionLabel(text: 'Deskripsi (opsional)'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _descCtrl,
                    maxLines: 3,
                    maxLength: 2000,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      hintText: 'Jelaskan apa yang kamu kerjakan...',
                      counterText: '',
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Notes
                  _SectionLabel(text: 'Catatan (opsional)'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _notesCtrl,
                    maxLines: 2,
                    maxLength: 500,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      hintText: 'Catatan tambahan...',
                      counterText: '',
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Info banner — what happens on submit
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, size: 16, color: Colors.blue.shade700),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Saat submit: verifikasi wajah → foto bukti pekerjaan (kamera) → kirim.',
                      style: TextStyle(fontSize: 12, color: Colors.blue.shade800),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Submit button (pinned)
          Padding(
            padding: EdgeInsets.fromLTRB(
              16, 4, 16, 16 + MediaQuery.of(context).padding.bottom,
            ),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _canSubmit ? _submit : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue.shade700,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  disabledBackgroundColor: Colors.grey.shade300,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Laporkan Tugas',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String text;
  const _SummaryRow({required this.icon, required this.color, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }
}
