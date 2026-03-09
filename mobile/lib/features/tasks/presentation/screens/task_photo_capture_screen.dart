import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Simple camera capture screen.
/// Returns [XFile?] via context.pop() — null if cancelled.
class TaskPhotoCaptureScreen extends StatefulWidget {
  const TaskPhotoCaptureScreen({super.key});

  @override
  State<TaskPhotoCaptureScreen> createState() => _TaskPhotoCaptureScreenState();
}

class _TaskPhotoCaptureScreenState extends State<TaskPhotoCaptureScreen>
    with WidgetsBindingObserver {
  CameraController? _controller;
  bool _isInitializing = true;
  bool _isCapturing    = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_controller == null) return;
    if (state == AppLifecycleState.inactive) {
      _controller!.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initCamera();
    }
  }

  Future<void> _initCamera() async {
    // Brief delay so any preceding camera (e.g. face verify) fully releases
    // its hardware resource before we open the back camera.
    await Future.delayed(const Duration(milliseconds: 400));
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() { _isInitializing = false; _error = 'No camera found.'; });
        return;
      }
      final backCamera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );
      final controller = CameraController(
        backCamera,
        ResolutionPreset.high,
        enableAudio: false,
      );
      await controller.initialize();
      if (!mounted) return;
      setState(() {
        _controller     = controller;
        _isInitializing = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _isInitializing = false; _error = e.toString(); });
    }
  }

  Future<void> _capture() async {
    if (_controller == null || _isCapturing) return;
    setState(() => _isCapturing = true);
    try {
      final xFile = await _controller!.takePicture();
      if (!mounted) return;
      context.pop(xFile);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isCapturing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal mengambil foto: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('Foto Bukti Tugas'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(null),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Camera preview
            Expanded(
              child: _isInitializing
                  ? const Center(
                      child: CircularProgressIndicator(color: Colors.white))
                  : _error != null
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Text(
                              'Kamera tidak tersedia:\n$_error',
                              style: const TextStyle(color: Colors.white),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        )
                      : ClipRect(
                          child: SizedBox.expand(
                            child: FittedBox(
                              fit: BoxFit.cover,
                              child: SizedBox(
                                width: _controller!.value.previewSize!.height,
                                height: _controller!.value.previewSize!.width,
                                child: CameraPreview(_controller!),
                              ),
                            ),
                          ),
                        ),
            ),

            // Capture button
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24),
              color: Colors.black,
              child: Center(
                child: GestureDetector(
                  onTap: _isCapturing ? null : _capture,
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                    ),
                    child: _isCapturing
                        ? const Center(
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Container(
                            margin: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
