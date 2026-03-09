#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# FaceHRM Backend — Setup Script (jalankan di server setelah upload)
# Usage: bash /www/wwwroot/facehrm-api/deploy/laravel-setup.sh
# ─────────────────────────────────────────────────────────────────

set -e

APP_DIR="/www/wwwroot/facehrm/backend"
WEB_USER="www"    # user Nginx/PHP-FPM di aaPanel
PHP_BIN="/www/server/php/83/bin/php"

# Cari Composer 2 (prioritas: composer2 > composer.phar > composer)
if [ -f "/usr/local/bin/composer2" ]; then
    COMPOSER_BIN="/usr/local/bin/composer2"
elif [ -f "/www/server/composer/composer.phar" ]; then
    COMPOSER_BIN="/www/server/composer/composer.phar"
else
    COMPOSER_BIN="/usr/bin/composer"
fi
echo "    Using composer: $COMPOSER_BIN"

cd "$APP_DIR" || { echo "ERROR: folder $APP_DIR tidak ditemukan"; exit 1; }

# Fix git safe directory
git config --global --add safe.directory /www/wwwroot/facehrm 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════════════"
echo "   FaceHRM Backend — Server Setup"
echo "═══════════════════════════════════════════════"

# ── 1. Cek .env ───────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo ""
    echo "❌ File .env belum ada!"
    echo "   Buat dulu dari template: cp .env.production.template .env"
    echo "   Lalu edit: nano .env"
    exit 1
fi
echo "✅ .env ditemukan"

# ── 2. Install Composer dependencies ─────────────────────────────
echo ""
echo "[1/7] Install Composer dependencies (no-dev)..."
$PHP_BIN $COMPOSER_BIN install --no-dev --optimize-autoloader --no-interaction

# ── 3. Generate APP_KEY jika belum ada ───────────────────────────
echo ""
echo "[2/7] Generate app key..."
KEY_CHECK=$(grep "^APP_KEY=" .env | cut -d'=' -f2)
if [ -z "$KEY_CHECK" ]; then
    $PHP_BIN artisan key:generate --force
    echo "    ✅ APP_KEY generated"
else
    echo "    ✅ APP_KEY sudah ada, dilewati"
fi

# ── 4. Storage link ───────────────────────────────────────────────
echo ""
echo "[3/7] Create storage symlink..."
$PHP_BIN artisan storage:link --force

# ── 5. Run Migrations ─────────────────────────────────────────────
echo ""
echo "[4/7] Run database migrations..."
$PHP_BIN artisan migrate --force

# ── 6. Seed data awal (only jika tabel users masih kosong) ───────
echo ""
echo "[5/7] Seeding initial data..."
USER_COUNT=$($PHP_BIN artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null | tail -1)
if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    $PHP_BIN artisan db:seed --force
    echo "    ✅ Data awal berhasil di-seed"
else
    echo "    ✅ Data sudah ada ($USER_COUNT users), skip seed"
fi

# ── 7. Cache config/route/view ───────────────────────────────────
echo ""
echo "[6/7] Caching config, routes, views..."
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache
$PHP_BIN artisan event:cache

# ── 8. Set permissions ────────────────────────────────────────────
echo ""
echo "[7/7] Setting file permissions..."
find "$APP_DIR" -type f -exec chmod 644 {} \;
find "$APP_DIR" -type d -exec chmod 755 {} \;
chmod -R 775 "$APP_DIR/storage"
chmod -R 775 "$APP_DIR/bootstrap/cache"
chown -R "$WEB_USER":"$WEB_USER" "$APP_DIR"

echo ""
echo "═══════════════════════════════════════════════"
echo "   ✅  Setup selesai!"
echo "═══════════════════════════════════════════════"
echo ""
echo "Test API:"
echo "  curl https://hrm.kreasikaryaarjuna.co.id/api/v1/auth/login \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"email\":\"admin@example.com\",\"password\":\"12345678\"}'"
echo ""
