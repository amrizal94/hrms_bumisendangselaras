#!/usr/bin/env bash
# deploy-apk-dev.sh — Build APK dev (LOCAL ONLY, tidak upload ke server prod)
# Usage: bash deploy-apk-dev.sh [API_URL]
# Example: bash deploy-apk-dev.sh https://apihrm.amrzaki.online
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$ROOT_DIR/mobile"
API_CONSTANTS="$MOBILE_DIR/lib/core/constants/api_constants.dart"
PROD_URL="https://hrms.bumisendangselaras.co.id/api/v1"

# ── Resolve dev API URL ────────────────────────────────────────────────────────
DEV_API="${1:-}"
if [[ -z "$DEV_API" ]]; then
  echo "Usage: bash deploy-apk-dev.sh <API_URL>"
  echo "  Example: bash deploy-apk-dev.sh https://apihrm.amrzaki.online"
  exit 1
fi
# Append /api/v1 jika belum ada
if [[ "$DEV_API" != */api/v1 ]]; then
  DEV_URL="${DEV_API%/}/api/v1"
else
  DEV_URL="$DEV_API"
fi

echo "==> Dev API URL: $DEV_URL"

# ── Swap baseUrl ke dev ────────────────────────────────────────────────────────
echo "==> Swap baseUrl → dev"
sed -i "s|static const String baseUrl = '.*';|static const String baseUrl = '$DEV_URL';|" "$API_CONSTANTS"

# ── Cleanup build ──────────────────────────────────────────────────────────────
echo "==> Clean build artifacts"
rm -rf "$MOBILE_DIR/build" "$MOBILE_DIR/android/.gradle"

# ── Build APK ─────────────────────────────────────────────────────────────────
VERSION_NAME=$(grep '^version:' "$MOBILE_DIR/pubspec.yaml" \
  | sed 's/version: //' | cut -d'+' -f1 | tr -d '[:space:]')
BUILD_NUM=$(git -C "$ROOT_DIR" rev-list --count HEAD)
echo "==> Build APK dev: v$VERSION_NAME (build $BUILD_NUM)"

cd "$MOBILE_DIR"
flutter build apk --release \
  --target-platform android-arm64 \
  --build-name="$VERSION_NAME" \
  --build-number="$BUILD_NUM"

# ── Restore baseUrl ke prod ────────────────────────────────────────────────────
echo "==> Restore baseUrl → prod"
sed -i "s|static const String baseUrl = '.*';|static const String baseUrl = '$PROD_URL';|" "$API_CONSTANTS"

# ── Salin ke output/ ──────────────────────────────────────────────────────────
APK_SRC="$MOBILE_DIR/build/app/outputs/flutter-apk/app-release.apk"
OUT_DIR="$ROOT_DIR/output"
mkdir -p "$OUT_DIR"
APK_OUT="$OUT_DIR/facehrm-dev-v${VERSION_NAME}-b${BUILD_NUM}.apk"
cp "$APK_SRC" "$APK_OUT"

APK_SIZE=$(du -sh "$APK_OUT" | cut -f1)
echo ""
echo "✅ APK DEV siap: $APK_OUT ($APK_SIZE)"
echo "   API: $DEV_URL"
echo ""
echo "Install ke HP:"
echo "   adb install \"$APK_OUT\""
echo "   atau transfer manual ke HP"
