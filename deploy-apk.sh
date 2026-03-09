#!/usr/bin/env bash
set -euo pipefail

SERVER="${SERVER:-root@45.66.153.156}"
REMOTE_DIR="${REMOTE_DIR:-/www/wwwroot/bsshrms/web/public/app}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Windows warning ────────────────────────────────────────────────────────────
if [[ "${OSTYPE:-}" == "msys" || "${OSTYPE:-}" == "cygwin" ]]; then
  echo "WARNING: Windows detected -- pkill tidak efektif di MSYS."
  echo "    Gunakan deploy-apk.ps1 (PowerShell) untuk kill java/dart dengan benar."
fi

# ── Version info ──────────────────────────────────────────────────────────────
VERSION_NAME=$(grep '^version:' "$ROOT_DIR/mobile/pubspec.yaml" \
  | sed 's/version: //' | cut -d'+' -f1 | tr -d '[:space:]')
BUILD_NUM=$(git -C "$ROOT_DIR" rev-list --count HEAD)
echo "==> Version: v$VERSION_NAME (build $BUILD_NUM)"

# Versioned filename: bsshrms-v1.0.0-b64.apk
VERSIONED_FILE="bsshrms-v${VERSION_NAME}-b${BUILD_NUM}.apk"
STATIC_FILE="bsshrms.apk"

# ── Build ─────────────────────────────────────────────────────────────────────
cd "$ROOT_DIR/mobile"

echo "==> Stop Gradle daemon (best effort)"
if [[ -f "./android/gradlew" ]]; then
  (cd ./android && ./gradlew --stop >/dev/null 2>&1 || true)
fi

echo "==> Kill lock-prone processes (java/dart/adb)"
pkill -f "java" >/dev/null 2>&1 || true
pkill -f "dart" >/dev/null 2>&1 || true
pkill -f "adb"  >/dev/null 2>&1 || true

echo "==> Clean build artifacts"
rm -rf ./build ./android/.gradle

echo "==> Build APK release (arm64 -- ~40% lebih kecil dari fat APK)"
flutter build apk --release \
  --target-platform android-arm64 \
  --build-name="$VERSION_NAME" \
  --build-number="$BUILD_NUM"

APK_PATH="build/app/outputs/flutter-apk/app-release.apk"
if [[ ! -f "$APK_PATH" ]]; then
  echo "APK not found: $APK_PATH" >&2
  exit 1
fi

APK_SIZE=$(du -sh "$APK_PATH" | cut -f1)
echo "==> APK size: $APK_SIZE"

# ── Deploy ────────────────────────────────────────────────────────────────────
STAMP="$(date +%Y%m%d-%H%M%S)"
STATIC_PATH="$REMOTE_DIR/$STATIC_FILE"
BACKUP_PATH="$REMOTE_DIR/${STATIC_FILE}.bak-$STAMP"

echo "==> Backup bsshrms.apk lama (jika ada): $BACKUP_PATH"
ssh -i "$SSH_KEY" "$SERVER" \
  "if [ -f '$STATIC_PATH' ]; then cp '$STATIC_PATH' '$BACKUP_PATH'; fi"

echo "==> Upload as versioned: $VERSIONED_FILE"
scp -i "$SSH_KEY" "$APK_PATH" "$SERVER:$REMOTE_DIR/$VERSIONED_FILE"

echo "==> Update bsshrms.apk (copy dari versioned, untuk backward compat)"
ssh -i "$SSH_KEY" "$SERVER" \
  "cp '$REMOTE_DIR/$VERSIONED_FILE' '$STATIC_PATH'"

echo "==> Write version.txt (2 baris: version string + filename)"
TODAY="$(date +%Y-%m-%d)"
ssh -i "$SSH_KEY" "$SERVER" \
  "printf 'v%s (build %s) - %s\n%s\n' '$VERSION_NAME' '$BUILD_NUM' '$TODAY' '$VERSIONED_FILE' > '$REMOTE_DIR/version.txt'"

echo "==> Cleanup versioned APK lama (keep 3 terbaru)"
ssh -i "$SSH_KEY" "$SERVER" \
  "ls -t '$REMOTE_DIR'/bsshrms-v*-b*.apk 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null; true"

echo "==> Cleanup backup lebih dari 7 hari"
ssh -i "$SSH_KEY" "$SERVER" \
  "find '$REMOTE_DIR' -name '*.bak-*' -mtime +7 -delete 2>/dev/null || true"

echo "==> Verifikasi file remote"
ssh -i "$SSH_KEY" "$SERVER" \
  "ls -lh '$REMOTE_DIR/$VERSIONED_FILE' '$STATIC_PATH' && echo '---' && cat '$REMOTE_DIR/version.txt'"

echo "==> Verifikasi URL publik (versioned)..."
APK_URL="https://hrms.bumisendangselaras.co.id/app/$VERSIONED_FILE"
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" -I --max-time 10 "$APK_URL")
if (( HTTP_CODE < 200 || HTTP_CODE >= 400 )); then
  echo "APK tidak accessible di $APK_URL (HTTP $HTTP_CODE)" >&2
  exit 1
fi
echo "OK APK accessible (HTTP $HTTP_CODE): $APK_URL"

echo "DONE Deploy selesai: v$VERSION_NAME (build $BUILD_NUM) -> $VERSIONED_FILE"
