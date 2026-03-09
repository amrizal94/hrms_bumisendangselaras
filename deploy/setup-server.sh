#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# BSS HRMS — First-Time Server Setup Script
# Jalankan SEKALI saja saat pertama kali setup di server baru:
#   bash /tmp/setup-server.sh
#
# Requires:
#   - aaPanel installed (PHP 8.3, PostgreSQL, Redis, Node.js 20)
#   - SSH key sudah di-add ke GitHub deploy keys
#   - Repo: git@github.com:arimrzl/bsshrms.git (atau sesuai repo kamu)
# ─────────────────────────────────────────────────────────────────

set -e

PHP="/www/server/php/83/bin/php"
COMPOSER2="/usr/local/bin/composer2"
[ ! -f "$COMPOSER2" ] && COMPOSER2="/www/server/composer/composer.phar"
NODE_BIN="/www/server/nodejs/v20.12.2/bin"
NPM="$NODE_BIN/npm"
export PATH="$NODE_BIN:$PATH"

APP_DIR="/www/wwwroot/bsshrms"
REPO="git@github.com:arimrzl/bsshrms.git"

echo "======================================"
echo "   BSS HRMS — Server Setup"
echo "======================================"

# ── 1. Clone repo ────────────────────────────────────────────────
echo "[1/8] Clone repo..."
if [ -d "$APP_DIR/.git" ]; then
    echo "  Repo sudah ada, skip clone."
else
    git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

# ── 2. Backend: install + .env ───────────────────────────────────
echo "[2/8] Backend setup..."
cd "$APP_DIR/backend"
$PHP $COMPOSER2 install --no-dev --optimize-autoloader --no-interaction

if [ ! -f ".env" ]; then
    cp .env.example .env
    $PHP artisan key:generate
    echo ""
    echo "  ⚠️  File .env dibuat dari .env.example"
    echo "  EDIT DULU sebelum lanjut:"
    echo "    nano $APP_DIR/backend/.env"
    echo "  Isi: DB_PASSWORD, DB_DATABASE, DB_USERNAME"
    echo ""
    read -p "  Tekan ENTER setelah selesai edit .env..." _
fi

# ── 3. Database ───────────────────────────────────────────────────
echo "[3/8] Database migrate + seed..."
$PHP artisan migrate --force
$PHP artisan db:seed --force

# ── 4. Storage ────────────────────────────────────────────────────
echo "[4/8] Storage setup..."
$PHP artisan storage:link 2>/dev/null || true
chown -R www:www "$APP_DIR/backend/storage/"
chmod -R 775 "$APP_DIR/backend/storage/"
chown -R www:www "$APP_DIR/backend/bootstrap/cache/"

# ── 5. Cache ─────────────────────────────────────────────────────
echo "[5/8] Cache config & routes..."
$PHP artisan config:cache
$PHP artisan route:cache

# ── 6. Web: install + .env + build ───────────────────────────────
echo "[6/8] Web build..."
cd "$APP_DIR/web"

if [ ! -f ".env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=https://hrms.bumisendangselaras.co.id/api/v1" > .env.local
    echo "  ✓ Web .env.local dibuat"
fi

$NPM install
$NPM run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# ── 7. PM2 ───────────────────────────────────────────────────────
echo "[7/8] Setup PM2..."
if pm2 list | grep -q "bsshrms-web"; then
    pm2 restart bsshrms-web
else
    pm2 start "$APP_DIR/web/.next/standalone/server.js" \
        --name "bsshrms-web" \
        --cwd "$APP_DIR/web/.next/standalone" \
        -- --port 3001 --hostname 0.0.0.0
fi
pm2 save

# ── 8. Face service ──────────────────────────────────────────────
echo "[8/8] Face service..."
cd "$APP_DIR/face-service"
if [ -f "package.json" ]; then
    $NPM install
    if pm2 list | grep -q "face-service"; then
        pm2 restart face-service
    else
        pm2 start index.js --name "face-service" --cwd "$APP_DIR/face-service"
    fi
    pm2 save
fi

echo ""
echo "✅ Setup selesai!"
echo ""
echo "Langkah selanjutnya:"
echo "  1. Konfigurasi aaPanel: tambah site hrms.bumisendangselaras.co.id"
echo "     - PHP: 8.3, Root: $APP_DIR/backend/public"
echo "     - Proxy: port 3001 untuk Next.js"
echo "  2. Install SSL via aaPanel (Let's Encrypt)"
echo "  3. Test: https://hrms.bumisendangselaras.co.id"
echo ""
pm2 status
