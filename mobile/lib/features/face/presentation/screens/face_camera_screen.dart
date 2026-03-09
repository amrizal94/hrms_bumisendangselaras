import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show HapticFeedback, WriteBuffer;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image/image.dart' as img;
import 'package:permission_handler/permission_handler.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/widgets/mock_gps_warning_dialog.dart';
import '../../../../features/attendance/presentation/providers/attendance_provider.dart';
import '../../data/datasources/face_remote_datasource.dart';

/// Screen type passed when navigating to [FaceCameraScreen].
enum FaceAction { checkIn, checkOut }

/// Visual state of the face guide oval.
enum _FaceStatus { none, detected, verified, multiple }

/// Liveness blink-detection state machine.
/// Sequence: waiting → eyesOpen → blinking → passed
enum _LivenessState { waiting, eyesOpen, blinking, passed }

// Liveness thresholds
const _kEyeOpenThreshold  = 0.7;
const _kEyeCloseThreshold = 0.3;
const _kYawMaxDeg         = 30.0; // |headEulerAngleY|
const _kPitchMaxDeg       = 20.0; // |headEulerAngleX|

/// Stages of the capture pipeline — drives overlay text + success screen.
enum _CaptureStatus { idle, capturing, processing, success }

class FaceCameraScreen extends ConsumerStatefulWidget {
  final FaceAction action;
  const FaceCameraScreen({super.key, required this.action});

  @override
  ConsumerState<FaceCameraScreen> createState() => _FaceCameraScreenState();
}

class _FaceCameraScreenState extends ConsumerState<FaceCameraScreen>
    with WidgetsBindingObserver {
  CameraController? _controller;
  List<CameraDescription> _cameras = [];

  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      performanceMode:    FaceDetectorMode.fast,
      enableClassification: true, // enables leftEyeOpenProbability / rightEyeOpenProbability
      minFaceSize:        0.25,
    ),
  );
  bool _isDetecting = false;

  // Screen state
  bool _permissionGranted = false;
  bool _isInitializing    = true;
  String? _initError;

  // Face detection
  int  _faceCount      = 0;
  bool _hadFaceBefore  = false;
  bool _headPoseOk     = true;

  // Liveness
  _LivenessState _livenessState = _LivenessState.waiting;

  _FaceStatus get _faceStatus {
    if (_faceCount == 0) return _FaceStatus.none;
    if (_faceCount > 1)  return _FaceStatus.multiple;
    return _livenessState == _LivenessState.passed
        ? _FaceStatus.verified
        : _FaceStatus.detected;
  }

  bool get _faceDetected   => _faceCount == 1;
  bool get _readyToCapture =>
      _faceDetected && _livenessState == _LivenessState.passed && !_isCapturing;

  // Capture pipeline state
  _CaptureStatus _captureStatus  = _CaptureStatus.idle;
  String         _successMessage = '';

  bool get _isCapturing => _captureStatus != _CaptureStatus.idle;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkEnrollmentThenInit());
  }

  /// Check if the current user has enrolled their face.
  /// If not, navigate to the self-enroll screen first.
  Future<void> _checkEnrollmentThenInit() async {
    if (!mounted) return;
    try {
      final enrolled = await ref.read(faceRemoteDatasourceProvider).getMyFaceStatus();
      if (!mounted) return;

      if (!enrolled) {
        final result = await context.push<bool>(AppRoutes.faceEnroll);
        if (!mounted) return;
        if (result != true) {
          context.pop();
          return;
        }
        // Give Android time to fully release the camera
        await Future.delayed(const Duration(milliseconds: 800));
        if (!mounted) return;
      }
    } catch (_) {
      // proceed and let the attendance API report the real error
    }
    _initCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _faceDetector.close();
    final ctrl = _controller;
    _controller = null;
    ctrl?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;

    if (state == AppLifecycleState.inactive) {
      _controller = null;
      controller.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initCamera();
    }
  }

  Future<void> _initCamera() async {
    setState(() {
      _isInitializing = true;
      _initError      = null;
      _faceCount      = 0;
      _hadFaceBefore  = false;
      _captureStatus  = _CaptureStatus.idle;
      _livenessState  = _LivenessState.waiting;
      _headPoseOk     = true;
    });

    final status = await Permission.camera.request();
    if (!status.isGranted) {
      if (mounted) {
        setState(() {
          _permissionGranted = false;
          _isInitializing    = false;
          _initError         = 'Izin kamera ditolak.';
        });
      }
      return;
    }

    _permissionGranted = true;

    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) throw Exception('Tidak ada kamera ditemukan.');

      final desc = _cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => _cameras.first,
      );

      final controller = CameraController(
        desc,
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
      if (mounted) {
        setState(() {
          _isInitializing = false;
          _initError      = 'Kamera error: $e';
        });
      }
    }
  }

  // ── Face detection loop ───────────────────────────────────────────────────

  void _startDetection(CameraController controller) {
    controller.startImageStream((CameraImage image) async {
      if (_isDetecting) return;
      _isDetecting = true;

      try {
        final inputImage = _toInputImage(image);
        if (inputImage == null) return;

        final faces         = await _faceDetector.processImage(inputImage);
        final filteredFaces = _filterFacesInOval(faces, image.width, image.height);
        final count         = filteredFaces.length;
        final face          = count == 1 ? filteredFaces.first : null;

        if (!mounted) return;

        // Head pose: face is too angled if yaw/pitch exceed thresholds
        final newHeadOk = face == null || (
          (face.headEulerAngleY?.abs() ?? 0) < _kYawMaxDeg &&
          (face.headEulerAngleX?.abs() ?? 0) < _kPitchMaxDeg
        );

        // Liveness blink state machine
        _LivenessState newLiveness = _livenessState;
        bool livePassed = false;

        if (_livenessState != _LivenessState.passed) {
          if (face == null) {
            newLiveness = _LivenessState.waiting; // face left — reset
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
              livePassed = newLiveness == _LivenessState.passed &&
                           _livenessState != _LivenessState.passed;
            }
          }
        }

        final faceChanged = count != _faceCount;

        if (count != _faceCount ||
            newHeadOk != _headPoseOk ||
            newLiveness != _livenessState) {
          setState(() {
            _faceCount     = count;
            _headPoseOk    = newHeadOk;
            _livenessState = newLiveness;
          });
        }

        if (faceChanged) {
          if (count == 1 && !_hadFaceBefore) {
            _hadFaceBefore = true;
            HapticFeedback.lightImpact();
          } else if (count == 0) {
            _hadFaceBefore = false;
          }
        }
        if (livePassed) HapticFeedback.mediumImpact();
      } catch (_) {
        // ignore per-frame errors
      } finally {
        await Future.delayed(const Duration(milliseconds: 100));
        _isDetecting = false;
      }
    });
  }

  InputImage? _toInputImage(CameraImage image) {
    final rotation = InputImageRotationValue.fromRawValue(
      _controller!.description.sensorOrientation,
    );
    if (rotation == null) return null;

    final format = InputImageFormatValue.fromRawValue(image.format.raw);
    if (format == null) return null;

    final WriteBuffer allBytes = WriteBuffer();
    for (final plane in image.planes) {
      allBytes.putUint8List(plane.bytes);
    }
    final bytes = allBytes.done().buffer.asUint8List();

    return InputImage.fromBytes(
      bytes: bytes,
      metadata: InputImageMetadata(
        size:         Size(image.width.toDouble(), image.height.toDouble()),
        rotation:     rotation,
        format:       format,
        bytesPerRow:  image.planes[0].bytesPerRow,
      ),
    );
  }

  /// Only count faces whose center falls within the oval guide area.
  List<Face> _filterFacesInOval(List<Face> faces, int imgWidth, int imgHeight) {
    final orientation = _controller?.description.sensorOrientation ?? 270;
    final bool isRotated = orientation == 90 || orientation == 270;
    final double pW = isRotated ? imgHeight.toDouble() : imgWidth.toDouble();
    final double pH = isRotated ? imgWidth.toDouble()  : imgHeight.toDouble();

    return faces.where((face) {
      final box = face.boundingBox;
      if (box.width < pW * 0.18 || box.height < pH * 0.15) return false;
      final cx = box.center.dx / pW;
      final cy = box.center.dy / pH;
      final dx = (cx - 0.5) / 0.40;
      final dy = (cy - 0.42) / 0.34;
      return dx * dx + dy * dy <= 1.0;
    }).toList();
  }

  // ── Capture pipeline ──────────────────────────────────────────────────────

  Future<void> _onCapture() async {
    if (_isCapturing || _controller == null) return;

    setState(() => _captureStatus = _CaptureStatus.capturing);

    try {
      await _controller!.stopImageStream();
      await Future.delayed(const Duration(milliseconds: 200));
      final xfile    = await _controller!.takePicture();
      final rawBytes = await xfile.readAsBytes();

      // Compress
      final original = img.decodeImage(rawBytes);
      if (original == null) throw Exception('Gagal memproses gambar.');
      final toEncode = original.width > 800
          ? img.copyResize(original, width: 800)
          : original;
      final compressed = img.encodeJpg(toEncode, quality: 85);

      if (mounted) setState(() => _captureStatus = _CaptureStatus.processing);

      final location = await LocationService.getCurrentLocation();

      if (location != null && location.isMocked) {
        if (!mounted) return;
        await showMockGpsWarningDialog(context);
        if (mounted) {
          setState(() {
            _captureStatus = _CaptureStatus.idle;
            _faceCount     = 0;
            _hadFaceBefore = false;
            _livenessState = _LivenessState.waiting;
            _headPoseOk    = true;
          });
          if (_controller != null && _controller!.value.isInitialized) {
            _startDetection(_controller!);
          }
        }
        return;
      }

      final action   = widget.action == FaceAction.checkIn ? 'check_in' : 'check_out';
      final message  = await ref.read(faceRemoteDatasourceProvider).faceAttendance(
        imageBytes:       compressed,
        action:           action,
        filename:         'face_${action}_${DateTime.now().millisecondsSinceEpoch}.jpg',
        location:         location,
        livenessVerified: true, // blink liveness was confirmed before capture
      );

      if (!mounted) return;

      HapticFeedback.mediumImpact();
      setState(() {
        _captureStatus  = _CaptureStatus.success;
        _successMessage = message;
      });

      ref.invalidate(todayAttendanceProvider);
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) context.pop();
    } catch (e) {
      if (!mounted) return;

      final msg           = _humanizeCaptureError(e);
      final isAlreadyDone = _isAlreadyDoneError(e);

      if (isAlreadyDone) {
        ref.invalidate(todayAttendanceProvider);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
        context.pop();
        return;
      }

      final isMismatch = _isFaceMismatchError(e);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:         Text(msg),
          backgroundColor: Colors.red.shade700,
          duration:        Duration(seconds: isMismatch ? 5 : 4),
          action: isMismatch
              ? SnackBarAction(
                  label:     'Coba Lagi',
                  textColor: Colors.white,
                  onPressed: () {},
                )
              : null,
        ),
      );

      setState(() {
        _captureStatus = _CaptureStatus.idle;
        _faceCount     = 0;
        _hadFaceBefore = false;
        _livenessState = _LivenessState.waiting;
        _headPoseOk    = true;
      });
      if (_controller != null && _controller!.value.isInitialized) {
        _startDetection(_controller!);
      }
    }
  }

  Future<void> _dismissSuccess() async {
    if (!mounted) return;
    context.pop();
  }

  // ── Error helpers ─────────────────────────────────────────────────────────

  String _humanizeCaptureError(Object e) {
    final raw   = e.toString().replaceFirst('ApiException: ', '');
    final lower = raw.toLowerCase();

    if (lower.contains('already checked in'))   return 'Kamu sudah check-in hari ini.';
    if (lower.contains('already checked out'))  return 'Kamu sudah check-out hari ini.';
    if (lower.contains('no check-in found'))    return 'Belum ada check-in hari ini untuk di-check-out.';
    if (lower.contains('not recognized') || lower.contains('no matching face')) {
      return 'Wajah tidak dikenali. Pastikan pencahayaan cukup lalu coba lagi.';
    }
    if (lower.contains('no enrolled faces')) {
      return 'Wajah belum terdaftar dalam sistem. Hubungi HR.';
    }
    if (lower.contains('no face') || lower.contains('extraction failed') ||
        lower.contains('invalid descriptor') || lower.contains('face extraction')) {
      return 'Tidak ada wajah terdeteksi dalam foto. Pastikan pencahayaan cukup lalu coba lagi.';
    }
    if (lower.contains('models not ready')) {
      return 'Server sedang memuat. Tunggu beberapa detik lalu coba lagi.';
    }
    if (lower.contains('terlalu lama') || lower.contains('timeout')) {
      return 'Proses terlalu lama. Coba lagi.';
    }
    if (lower.contains('koneksi gagal') || lower.contains('network error') ||
        lower.contains('connection')) {
      return 'Koneksi gagal. Periksa jaringan dan coba lagi.';
    }
    if (lower.contains('server error') || lower.contains('internal server error')) {
      return 'Terjadi kesalahan pada server. Coba lagi.';
    }
    return raw;
  }

  bool _isAlreadyDoneError(Object e) {
    final lower = e.toString().toLowerCase();
    return lower.contains('already checked in') || lower.contains('already checked out');
  }

  bool _isFaceMismatchError(Object e) {
    final lower = e.toString().toLowerCase();
    return lower.contains('not recognized') || lower.contains('no matching face');
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final actionLabel = widget.action == FaceAction.checkIn ? 'Check In' : 'Check Out';
    final actionColor = widget.action == FaceAction.checkIn ? Colors.green : Colors.blue;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title:           Text('Face $actionLabel'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
      body: _buildBody(actionLabel, actionColor),
    );
  }

  Widget _buildBody(String actionLabel, Color actionColor) {
    if (_initError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.camera_alt_outlined, size: 64, color: Colors.white54),
              const SizedBox(height: 16),
              Text(
                _initError!,
                style:     const TextStyle(color: Colors.white70),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              if (!_permissionGranted)
                ElevatedButton(
                  onPressed: () => openAppSettings(),
                  child: const Text('Buka Pengaturan'),
                )
              else
                ElevatedButton(
                  onPressed: _initCamera,
                  child: const Text('Coba Lagi'),
                ),
            ],
          ),
        ),
      );
    }

    if (_isInitializing || _controller == null) {
      return const Center(child: CircularProgressIndicator(color: Colors.white));
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        // Camera preview
        Transform.scale(
          scaleX: _controller!.description.lensDirection == CameraLensDirection.front ? -1 : 1,
          child: CameraPreview(_controller!),
        ),

        // Oval guide
        CustomPaint(painter: _FaceGuidePainter(status: _faceStatus)),

        // Instruction text
        Positioned(
          top:   24,
          left:  0,
          right: 0,
          child: Text(
            _instructionText,
            textAlign: TextAlign.center,
            style: TextStyle(
              color:      _instructionColor,
              fontSize:   15,
              fontWeight: FontWeight.w600,
              shadows: const [Shadow(blurRadius: 4, color: Colors.black)],
            ),
          ),
        ),

        // Capture button
        Positioned(
          bottom: 48,
          left:   0,
          right:  0,
          child: Center(
            child: _CaptureButton(
              label:     actionLabel,
              color:     actionColor,
              enabled:   _readyToCapture,
              onPressed: _readyToCapture ? _onCapture : null,
            ),
          ),
        ),

        // Overlays
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: switch (_captureStatus) {
            _CaptureStatus.capturing  => const _ProcessingOverlay(key: ValueKey('cap'),  label: 'Memotret wajah...'),
            _CaptureStatus.processing => const _ProcessingOverlay(key: ValueKey('proc'), label: 'Mengenali wajah...'),
            _CaptureStatus.success    => _SuccessOverlay(
                key:         const ValueKey('ok'),
                message:     _successMessage,
                actionColor: actionColor,
                onTap:       _dismissSuccess,
              ),
            _CaptureStatus.idle => const SizedBox.shrink(key: ValueKey('idle')),
          },
        ),
      ],
    );
  }

  String get _instructionText {
    if (_faceStatus == _FaceStatus.none)     return 'Posisikan wajah Anda dalam oval';
    if (_faceStatus == _FaceStatus.multiple) return 'Lebih dari 1 wajah — pastikan hanya Anda';
    if (!_headPoseOk)                        return 'Hadapkan wajah lurus ke kamera';
    return switch (_livenessState) {
      _LivenessState.waiting  => 'Kedipkan mata sekali untuk verifikasi',
      _LivenessState.eyesOpen => 'Kedipkan mata...',
      _LivenessState.blinking => 'Buka mata kembali...',
      _LivenessState.passed   => 'Terverifikasi! Tekan tombol untuk ${widget.action == FaceAction.checkIn ? 'Check In' : 'Check Out'}',
    };
  }

  Color get _instructionColor {
    if (_faceStatus == _FaceStatus.none)     return Colors.white;
    if (_faceStatus == _FaceStatus.multiple) return Colors.orangeAccent;
    if (!_headPoseOk)                        return Colors.orangeAccent;
    return switch (_livenessState) {
      _LivenessState.waiting  => Colors.white70,
      _LivenessState.eyesOpen => Colors.yellowAccent,
      _LivenessState.blinking => Colors.yellowAccent,
      _LivenessState.passed   => Colors.greenAccent,
    };
  }
}

// ── Oval face guide painter ──────────────────────────────────────────────────
class _FaceGuidePainter extends CustomPainter {
  final _FaceStatus status;
  const _FaceGuidePainter({required this.status});

  @override
  void paint(Canvas canvas, Size size) {
    final overlayPaint = Paint()..color = Colors.black.withValues(alpha: 0.5);
    final ovalRect = Rect.fromCenter(
      center: Offset(size.width / 2, size.height * 0.42),
      width:  size.width * 0.68,
      height: size.width * 0.85,
    );

    canvas.saveLayer(Rect.fromLTWH(0, 0, size.width, size.height), Paint());
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), overlayPaint);
    canvas.drawOval(ovalRect, Paint()..blendMode = BlendMode.clear);
    canvas.restore();

    final borderColor = switch (status) {
      _FaceStatus.none     => Colors.white70,
      _FaceStatus.detected => Colors.white70,
      _FaceStatus.verified => Colors.greenAccent,
      _FaceStatus.multiple => Colors.orangeAccent,
    };

    canvas.drawOval(
      ovalRect,
      Paint()
        ..color       = borderColor
        ..style       = PaintingStyle.stroke
        ..strokeWidth = 2.5,
    );
  }

  @override
  bool shouldRepaint(_FaceGuidePainter old) => old.status != status;
}

// ── Processing overlay ───────────────────────────────────────────────────────
class _ProcessingOverlay extends StatelessWidget {
  final String label;
  const _ProcessingOverlay({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Colors.white),
            const SizedBox(height: 16),
            Text(
              label,
              style: const TextStyle(
                color:      Colors.white,
                fontSize:   16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Success overlay ───────────────────────────────────────────────────────────
class _SuccessOverlay extends StatelessWidget {
  final String     message;
  final Color      actionColor;
  final VoidCallback onTap;

  const _SuccessOverlay({
    super.key,
    required this.message,
    required this.actionColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: Colors.black87,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TweenAnimationBuilder<double>(
                tween:    Tween(begin: 0.0, end: 1.0),
                duration: const Duration(milliseconds: 500),
                curve:    Curves.elasticOut,
                builder:  (_, value, child) =>
                    Transform.scale(scale: value, child: child),
                child: Container(
                  width:  100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: actionColor,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_rounded, color: Colors.white, size: 64),
                ),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color:      Colors.white,
                    fontSize:   18,
                    fontWeight: FontWeight.w600,
                    height:     1.4,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Tap untuk menutup',
                style: TextStyle(
                  color:    Colors.white.withValues(alpha: 0.5),
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Capture button ───────────────────────────────────────────────────────────
class _CaptureButton extends StatelessWidget {
  final String       label;
  final Color        color;
  final bool         enabled;
  final VoidCallback? onPressed;

  const _CaptureButton({
    required this.label,
    required this.color,
    required this.enabled,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity:  enabled ? 1.0 : 0.4,
      duration: const Duration(milliseconds: 200),
      child: GestureDetector(
        onTap: onPressed,
        child: Container(
          width:  72,
          height: 72,
          decoration: BoxDecoration(
            shape:     BoxShape.circle,
            color:     enabled ? color : Colors.grey,
            boxShadow: enabled
                ? [BoxShadow(color: color.withValues(alpha: 0.5), blurRadius: 12, spreadRadius: 2)]
                : [],
          ),
          child: Icon(
            enabled ? Icons.camera_alt : Icons.face_retouching_off,
            color: Colors.white,
            size:  28,
          ),
        ),
      ),
    );
  }
}
