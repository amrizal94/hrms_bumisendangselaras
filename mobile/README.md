# FaceHRM Mobile

Flutter Android app untuk FaceHRM — Human Resource Management System.

## Stack

- Flutter (Dart)
- `flutter_riverpod` + `riverpod_annotation` — state management
- `go_router` — navigation + route guard
- `dio` — HTTP client
- `google_mlkit_face_detection` — face detection real-time
- `camera` — kamera preview + capture
- `image` — image compression

## Fitur

| Modul | Role | Keterangan |
|-------|------|------------|
| Auth | Semua | Login, logout, session restore |
| Dashboard | Staff | Clock live, quick menu, notification badge |
| Attendance | Staff | Face check-in/out (MLKit), manual, riwayat |
| Face Self-Enroll | Staff | Daftarkan wajah sendiri sebelum check-in pertama |
| Leave | Staff | Apply cuti, riwayat, cancel pending, kuota |
| Overtime | Staff | Submit lembur, riwayat, cancel pending |
| Payslip | Staff | Daftar payslip + detail |
| Holiday | Staff | Kalender hari libur nasional & perusahaan |
| Notifications | Staff | Inbox notif, mark read, mark all read |
| Tasks | Staff | Daftar tugas + detail + toggle checklist |
| Leave Approvals | HR/Admin | Approve/reject cuti |
| Overtime Approvals | HR/Admin | Approve/reject lembur |
| Attendance Records | HR/Admin | Rekap absensi karyawan |

## Struktur Folder

```
lib/
  core/
    constants/    # ApiConstants, AppConstants
    network/      # DioClient, ApiException
    router/       # AppRouter (GoRouter), AppRoutes
    theme/
  features/
    auth/
    dashboard/
    attendance/
    face/         # FaceCameraScreen, FaceSelfEnrollScreen
    leave/
    overtime/
    holiday/
    notifications/
    payslip/
    tasks/
```

## Face Detection — Penting

- `minFaceSize: 0.25` — filter wajah kecil (gambar kaos, dll)
- `_filterFacesInOval()` — hanya hitung wajah yang center-nya masuk area oval guide
- Oval zone (normalized portrait coords): center `(0.5, 0.42)`, semi-axes `(0.40, 0.34)`
- Setelah enrollment selesai, tunggu 800ms sebelum buka kamera baru (Android camera release delay)
- `ImageFormatGroup.nv21` untuk MLKit di Android
- `stopImageStream()` + 200ms delay sebelum `takePicture()` (race condition fix)

## Self-Enrollment Flow

```
FaceCameraScreen.initState()
  → _checkEnrollmentThenInit()
  → GET /face/me
  → enrolled=false → context.push(FaceSelfEnrollScreen)
    → user enroll → context.pop(true)
  → await 800ms (camera release)
  → _initCamera() → kamera check-in normal
```

## Setup

```bash
flutter pub get
flutter run
```

## Build APK Release

```bash
flutter build apk --release
# APK: build/app/outputs/flutter-apk/app-release.apk
```

Jika build gagal karena java.exe lock (Windows):
```bash
taskkill //F //IM java.exe
rm -rf build/
flutter build apk --release
```

Upload APK ke server:
```bash
scp build/app/outputs/flutter-apk/app-release.apk \
    root@45.66.153.156:/www/wwwroot/facehrm/web/public/app/facehrm.apk
```

APK tersedia di: `https://hrm.kreasikaryaarjuna.co.id/app/facehrm.apk`

## API Base URL

`lib/core/constants/api_constants.dart`:
- **Production**: `https://hrm.kreasikaryaarjuna.co.id/api/v1`
- **Dev (emulator)**: `http://10.0.2.2/api/v1`
- **Dev (device fisik)**: `http://<machine-ip>/api/v1`
