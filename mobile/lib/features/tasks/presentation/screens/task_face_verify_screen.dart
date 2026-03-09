import 'dart:io';
import 'dart:math' as math;

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image/image.dart' as img;

/// Liveness blink-detection state machine — waiting → eyesOpen → blinking → passed
enum _LivenessState { waiting, eyesOpen, blinking, passed }

// Liveness thresholds (same as FaceCameraScreen)
const _kEyeOpenThreshold  = 0.7;
const _kEyeCloseThreshold = 0.3;
const _kYawMaxDeg         = 30.0;
const _kPitchMaxDeg       = 20.0;

/// Face verification screen for task create/complete.
/// Returns [XFile?] via context.pop() — null if cancelled.
/// Does NOT call any API — caller is responsible for uploading the captured image.
class TaskFaceVerifyScreen extends StatefulWidget {
  const TaskFaceVerifyScreen({super.key});

  @override
  State<TaskFaceVerifyScreen> createState() => _TaskFaceVerifyScreenState();
}

class _TaskFaceVerifyScreenState extends State<TaskFaceVerifyScreen>
    with WidgetsBindingObserver {
  // Camera
  CameraController? _controller;
  bool _isInitializing = true;
  String? _initError;

  // Face detection
  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      performanceMode:    FaceDetectorMode.fast,
      enableClassification: true,
      minFaceSize:        0.25,
    ),
  );
  bool _isDetecting = false;

  int            _faceCount     = 0;
  bool           _headPoseOk    = true;
  _LivenessState _livenessState = _LivenessState.waiting;

  bool _isCapturing = false;

  bool get _readyToCapture =>
      _faceCount == 1 && _livenessState == _LivenessState.passed && !_isCapturing;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _faceDetector.close();
    _controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_controller == null) return;
    if (state == AppLifecycleState.inactive) {
      _controller!.dispose();
      _controller = null;
    } else if (state == AppLifecycleState.resumed) {
      _initCamera();
    }
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() { _isInitializing = false; _initError = 'Tidak ada kamera ditemukan.'; });
        return;
      }
      // Use front camera
      final frontCamera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      final controller = CameraController(
        frontCamera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.nv21,
      );
      await controller.initialize();
      if (!mounted) return;
      setState(() {
        _controller     = controller;
        _isInitializing = false;
      });
      _startDetection(controller);
    } catch (e) {
      if (!mounted) return;
      setState(() { _isInitializing = false; _initError = e.toString(); });
    }
  }

  void _startDetection(CameraController controller) {
    controller.startImageStream((CameraImage image) async {
      if (_isDetecting || _livenessState == _LivenessState.passed) return;
      _isDetecting = true;

      try {
        final inputImage = _toInputImage(image);
        if (inputImage == null) return;

        final faces = await _faceDetector.processImage(inputImage);
        final count = faces.length;
        final face  = count == 1 ? faces.first : null;

        // Head pose check
        final headOk = face == null || (
          (face.headEulerAngleY?.abs() ?? 0) < _kYawMaxDeg &&
          (face.headEulerAngleX?.abs() ?? 0) < _kPitchMaxDeg
        );

        // Liveness blink state machine
        _LivenessState newLiveness = _livenessState;
        if (face == null) {
          newLiveness = _LivenessState.waiting;
        } else {
          final lo = face.leftEyeOpenProbability;
          final ro = face.rightEyeOpenProbability;
          if (lo != null && ro != null) {
            final bothOpen   = lo >= _kEyeOpenThreshold  && ro >= _kEyeOpenThreshold;
            final bothClosed = lo <= _kEyeCloseThreshold && ro <= _kEyeCloseThreshold;
            newLiveness = switch (_livenessState) {
              _LivenessState.waiting  => bothOpen   ? _LivenessState.eyesOpen  : _LivenessState.waiting,
              _LivenessState.eyesOpen => bothClosed ? _LivenessState.blinking  : _LivenessState.eyesOpen,
              _LivenessState.blinking => bothOpen   ? _LivenessState.passed    : _LivenessState.blinking,
              _LivenessState.passed   => _LivenessState.passed,
            };
          }
        }

        if (mounted) {
          setState(() {
            _faceCount     = count;
            _headPoseOk    = headOk;
            _livenessState = newLiveness;
          });
        }

        // Auto-capture when liveness passed
        if (newLiveness == _LivenessState.passed && !_isCapturing) {
          await Future.delayed(const Duration(milliseconds: 300));
          _capture();
        }
      } finally {
        await Future.delayed(const Duration(milliseconds: 100));
        _isDetecting = false;
      }
    });
  }

  InputImage? _toInputImage(CameraImage image) {
    final camera = _controller?.description;
    if (camera == null) return null;

    final rotation = InputImageRotationValue.fromRawValue(camera.sensorOrientation);
    if (rotation == null) return null;

    final format = InputImageFormatValue.fromRawValue(image.format.raw);
    if (format == null) return null;

    final plane = image.planes.first;
    return InputImage.fromBytes(
      bytes: plane.bytes,
      metadata: InputImageMetadata(
        size:     Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format:   format,
        bytesPerRow: plane.bytesPerRow,
      ),
    );
  }

  Future<void> _capture() async {
    if (_isCapturing || _controller == null) return;
    setState(() => _isCapturing = true);
    try {
      await _controller!.stopImageStream();
      await Future.delayed(const Duration(milliseconds: 200));
      final xFile   = await _controller!.takePicture();
      final rawBytes = await xFile.readAsBytes();

      // Decode with EXIF orientation correction (same as FaceCameraScreen)
      final original = img.decodeImage(rawBytes);
      if (original == null) throw Exception('Gagal memproses gambar.');
      final toEncode = original.width > 800
          ? img.copyResize(original, width: 800)
          : original;
      final compressed = img.encodeJpg(toEncode, quality: 85);

      // Write corrected bytes back so the XFile reflects the processed image
      await File(xFile.path).writeAsBytes(compressed);

      HapticFeedback.mediumImpact();

      // Explicitly dispose camera BEFORE popping so the next camera screen
      // doesn't race for the hardware resource (black screen bug).
      await _controller!.dispose();
      _controller = null;

      if (!mounted) return;
      context.pop<XFile?>(XFile(xFile.path));
    } catch (e) {
      if (!mounted) return;
      setState(() => _isCapturing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal mengambil foto: $e'), backgroundColor: Colors.red),
      );
    }
  }

  // ── Overlay colors ─────────────────────────────────────────────────
  Color get _ovalColor {
    if (_isCapturing)                                return Colors.green;
    if (_livenessState == _LivenessState.passed)     return Colors.green;
    if (_faceCount == 0)                             return Colors.white54;
    if (_faceCount > 1 || !_headPoseOk)              return Colors.red;
    return Colors.blue;
  }

  String get _instructionText {
    if (_isCapturing)                                return 'Memproses...';
    if (_livenessState == _LivenessState.passed)     return 'Terverifikasi!';
    if (_faceCount == 0)                             return 'Arahkan wajah ke kamera';
    if (_faceCount > 1)                              return 'Hanya satu wajah';
    if (!_headPoseOk)                                return 'Hadapkan wajah lurus';
    return switch (_livenessState) {
      _LivenessState.waiting  => 'Arahkan wajah ke kamera',
      _LivenessState.eyesOpen => 'Kedipkan mata sekali',
      _LivenessState.blinking => 'Buka mata kembali',
      _LivenessState.passed   => 'Terverifikasi!',
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('Verifikasi Identitas'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop<XFile?>(null),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Camera preview with oval overlay
            Expanded(
              child: _isInitializing
                  ? const Center(child: CircularProgressIndicator(color: Colors.white))
                  : _initError != null
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Text(
                              'Kamera tidak tersedia:\n$_initError',
                              style: const TextStyle(color: Colors.white),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        )
                      : Stack(
                          fit: StackFit.expand,
                          children: [
                            // Camera preview
                            ClipRect(
                              child: SizedBox.expand(
                                child: FittedBox(
                                  fit: BoxFit.cover,
                                  child: SizedBox(
                                    width:  _controller!.value.previewSize!.height,
                                    height: _controller!.value.previewSize!.width,
                                    child:  CameraPreview(_controller!),
                                  ),
                                ),
                              ),
                            ),
                            // Dark overlay with oval cutout
                            CustomPaint(
                              painter: _OvalOverlayPainter(color: _ovalColor),
                            ),
                          ],
                        ),
            ),

            // Instruction panel
            Container(
              width: double.infinity,
              color: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Progress steps
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _StepDot(
                        label: 'Arahkan',
                        active: _faceCount == 1 && _headPoseOk,
                        done:   _livenessState != _LivenessState.waiting,
                      ),
                      _StepLine(done: _livenessState != _LivenessState.waiting),
                      _StepDot(
                        label: 'Kedipkan',
                        active: _livenessState == _LivenessState.eyesOpen ||
                                _livenessState == _LivenessState.blinking,
                        done:   _livenessState == _LivenessState.passed,
                      ),
                      _StepLine(done: _livenessState == _LivenessState.passed),
                      _StepDot(
                        label: 'Berhasil',
                        active: _livenessState == _LivenessState.passed,
                        done:   _isCapturing,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Instruction text
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: Text(
                      _instructionText,
                      key: ValueKey(_instructionText),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Oval cutout overlay ────────────────────────────────────────────────────────
class _OvalOverlayPainter extends CustomPainter {
  final Color color;
  const _OvalOverlayPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final ovalW = size.width  * 0.72;
    final ovalH = size.height * 0.65;
    final cx = size.width  / 2;
    final cy = size.height * 0.45;
    final oval = Rect.fromCenter(
        center: Offset(cx, cy), width: ovalW, height: ovalH);

    // Dark scrim
    final scrimPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addOval(oval)
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(scrimPath, Paint()..color = Colors.black54);

    // Colored oval border
    canvas.drawOval(
      oval,
      Paint()
        ..color  = color
        ..style  = PaintingStyle.stroke
        ..strokeWidth = 3,
    );
  }

  @override
  bool shouldRepaint(_OvalOverlayPainter old) => old.color != color;
}

// ── Step indicator widgets ─────────────────────────────────────────────────────
class _StepDot extends StatelessWidget {
  final String label;
  final bool active;
  final bool done;
  const _StepDot({required this.label, required this.active, required this.done});

  @override
  Widget build(BuildContext context) {
    final bg = done
        ? Colors.green
        : active
            ? Colors.blue
            : Colors.white24;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 24, height: 24,
          decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
          child: done
              ? const Icon(Icons.check, size: 14, color: Colors.white)
              : active
                  ? const Icon(Icons.radio_button_checked, size: 14, color: Colors.white)
                  : null,
        ),
        const SizedBox(height: 4),
        Text(label,
            style: TextStyle(
              color: (done || active) ? Colors.white : Colors.white38,
              fontSize: 10,
            )),
      ],
    );
  }
}

class _StepLine extends StatelessWidget {
  final bool done;
  const _StepLine({required this.done});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40, height: 2,
      margin: const EdgeInsets.only(bottom: 16),
      color: done ? Colors.green : Colors.white24,
    );
  }
}
