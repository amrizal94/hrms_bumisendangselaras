#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# BSS HRMS — Update Script
# Jalankan di server setiap kali ada update dari GitHub:
#   bash /www/wwwroot/bsshrms/deploy/update.sh
# ─────────────────────────────────────────────────────────────────

set -e
APP_DIR="/www/wwwroot/bsshrms"
PHP="/www/server/php/83/bin/php"
NODE="/www/server/nodejs/v20.12.2/bin/node"
NPM="/www/server/nodejs/v20.12.2/bin/npm"

cd "$APP_DIR"

echo "=== BSS HRMS Update ==="

# ── 1. Pull latest code ───────────────────────────────────────────
# git reset --hard dipakai agar server selalu match repo:
# mengatasi (1) tracked files yang diedit langsung di server,
# (2) untracked files yang akan di-overwrite oleh commit baru.
echo "[1/4] Git fetch + reset..."
git fetch origin main
git reset --hard origin/main

# ── 2. Backend update ────────────────────────────────────────────
echo "[2/4] Backend update..."
cd "$APP_DIR/backend"
COMPOSER2="/usr/local/bin/composer2"
[ ! -f "$COMPOSER2" ] && COMPOSER2="/www/server/composer/composer.phar"
$PHP $COMPOSER2 install --no-dev --optimize-autoloader --no-interaction
$PHP artisan migrate --force
$PHP artisan config:cache
$PHP artisan route:cache
# view:cache dilewati — backend ini API-only, tidak ada Blade views

# Firebase credentials — harus readable oleh PHP-FPM (user www), bukan root
# File ini di luar git (gitignored), jadi chown dijalankan setiap deploy
FIREBASE_CRED="/www/wwwroot/bsshrms/firebase-service-account.json"
if [ -f "$FIREBASE_CRED" ]; then
    chown www:www "$FIREBASE_CRED"
    chmod 600 "$FIREBASE_CRED"
fi

# Storage directory harus writable oleh www (PHP-FPM)
chown -R www:www "$APP_DIR/backend/storage/"
chmod -R 775 "$APP_DIR/backend/storage/"

/etc/init.d/php-fpm-83 reload

# ── 3. Frontend update ───────────────────────────────────────────
echo "[3/4] Frontend build..."
export PATH="/www/server/nodejs/v20.12.2/bin:$PATH"
cd "$APP_DIR/web"
$NPM install
$NPM run build
# Copy static & public ke standalone dir (diperlukan untuk output: standalone)
cp -r .next/static .next/standalone/.next/static
# Gunakan cp -r public/. agar konten public/ (termasuk models/) selalu ter-copy
# tanpa membuat nested public/public/ pada deploy berikutnya
mkdir -p .next/standalone/public
cp -r public/. .next/standalone/public/

# Pastikan Nginx dapat serve public/ files langsung (logo, favicon, dll.)
# Next.js standalone server.js TIDAK serve public/ — semua route diredirect ke /login
# File ini idempotent: tidak berubah jika sudah ada
NGINX_EXT_DIR="/www/server/panel/vhost/nginx/extension/hrms.bumisendangselaras.co.id"
STATIC_CONF="$NGINX_EXT_DIR/static-assets.conf"
mkdir -p "$NGINX_EXT_DIR"
cat > "$STATIC_CONF" << 'NGINX_EOF'
# Serve Next.js public/ static assets directly (bypass Next.js 307 redirect)
location ~* ^/(logo\.png|favicon\.ico|icon\.png|.*\.svg|.*\.webp)$ {
    root /www/wwwroot/bsshrms/web/.next/standalone/public;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    add_header X-Content-Type-Options "nosniff";
    try_files $uri =404;
}

# Serve face detection models directly (large binary files, bypass Next.js)
location ^~ /models/ {
    root /www/wwwroot/bsshrms/web/.next/standalone/public;
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
    add_header X-Content-Type-Options "nosniff";
    try_files $uri =404;
}
NGINX_EOF
nginx -s reload

# ── 4. Restart PM2 ───────────────────────────────────────────────
echo "[4/4] Restart PM2..."
pm2 restart bsshrms-web

# ── 5. Purge Nginx proxy cache ────────────────────────────────────
# Nginx mungkin cache halaman dari build lama — harus dibersihkan setiap deploy
# agar user tidak menerima HTML yang merujuk ke CSS/JS chunk yang sudah tidak ada.
echo "[5/5] Purging Nginx proxy cache..."

# Cari proxy_cache_path dari semua config Nginx (aaPanel menyimpannya di berbagai tempat)
CONFIG_DIRS="/etc/nginx /www/server/nginx /www/server/panel/vhost/nginx"
FOUND_DIRS=$(grep -rh "proxy_cache_path" $CONFIG_DIRS 2>/dev/null | awk '{print $2}' | sort -u)

PURGED=0
for cache_dir in $FOUND_DIRS \
  /www/server/nginx/proxy_cache_dir \
  /tmp/nginx_proxy_cache \
  /var/cache/nginx \
  /dev/shm/nginx_cache; do
  if [ -d "$cache_dir" ]; then
    find "$cache_dir" -type f -delete 2>/dev/null && \
      echo "  ✓ Cleared cache at: $cache_dir" && PURGED=1 || true
  fi
done

if [ "$PURGED" -eq 0 ]; then
  echo "  (no Nginx proxy cache directory found — listing proxy_cache_path in configs:)"
  grep -rh "proxy_cache_path" $CONFIG_DIRS 2>/dev/null | head -5 || echo "  (none found)"
fi

echo ""
echo "✅ Update selesai!"
pm2 status bsshrms-web
