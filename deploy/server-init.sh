#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# FaceHRM — Server Initialization (jalankan SEKALI di server baru)
# Menginstall: PostgreSQL 16, Redis, PHP extensions, Composer
# OS: Ubuntu 22.04/24.04 (aaPanel default)
# ─────────────────────────────────────────────────────────────────

set -e

DB_NAME="facehrm"
DB_USER="facehrm_user"
DB_PASS="GANTI_PASSWORD_KUAT"   # ← GANTI INI

echo ""
echo "═══════════════════════════════════════════════"
echo "   FaceHRM — Server Initialization"
echo "═══════════════════════════════════════════════"

# ── 1. Update package list ────────────────────────────────────────
echo "[1] Update system..."
apt-get update -qq

# ── 2. Install PostgreSQL 16 ──────────────────────────────────────
echo "[2] Install PostgreSQL 16..."
if ! command -v psql &>/dev/null; then
    apt-get install -y gnupg2 curl lsb-release
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
    echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
    apt-get update -qq
    apt-get install -y postgresql-16 postgresql-client-16
    systemctl enable postgresql
    systemctl start postgresql
    echo "    ✅ PostgreSQL 16 installed"
else
    echo "    ✅ PostgreSQL sudah ada"
fi

# ── 3. Buat database & user ───────────────────────────────────────
echo "[3] Setup PostgreSQL database..."
sudo -u postgres psql <<PSQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
        RAISE NOTICE 'User $DB_USER created';
    ELSE
        ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';
        RAISE NOTICE 'User $DB_USER password updated';
    END IF;
END
\$\$;

SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') \gexec
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
PSQL
echo "    ✅ Database '$DB_NAME' siap"

# ── 4. Install Redis ──────────────────────────────────────────────
echo "[4] Install Redis..."
if ! command -v redis-cli &>/dev/null; then
    apt-get install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
    echo "    ✅ Redis installed"
else
    echo "    ✅ Redis sudah ada"
fi

# ── 5. Install PHP extensions yang dibutuhkan Laravel ─────────────
echo "[5] Cek PHP extensions..."
PHP_BIN="/www/server/php/83/bin/php"
if [ ! -f "$PHP_BIN" ]; then
    PHP_BIN=$(which php 2>/dev/null || echo "php")
fi

echo "    PHP binary: $PHP_BIN"
echo ""
echo "    ⚠️  Di aaPanel, ekstensi PHP diinstall via UI:"
echo "    aaPanel → App Store → PHP 8.3 → Install Extensions:"
REQUIRED_EXTS="pgsql redis gd mbstring xml curl zip bcmath intl fileinfo"
echo ""
for ext in $REQUIRED_EXTS; do
    STATUS=$($PHP_BIN -r "echo extension_loaded('$ext') ? 'OK' : 'MISSING';" 2>/dev/null)
    if [ "$STATUS" = "OK" ]; then
        echo "    ✅ $ext"
    else
        echo "    ❌ $ext  ← install di aaPanel PHP Manager"
    fi
done
echo ""

# Cek kritis: pgsql dan redis harus ada
PGSQL=$($PHP_BIN -r "echo extension_loaded('pgsql') ? 'ok' : 'no';" 2>/dev/null)
REDIS_EXT=$($PHP_BIN -r "echo extension_loaded('redis') ? 'ok' : 'no';" 2>/dev/null)
if [ "$PGSQL" != "ok" ] || [ "$REDIS_EXT" != "ok" ]; then
    echo "    ❌ STOP: Install ekstensi pgsql dan redis dulu di aaPanel, lalu jalankan script ini lagi"
    exit 1
fi
echo "    ✅ Ekstensi kritis (pgsql, redis) tersedia"

# ── 6. Install Composer ───────────────────────────────────────────
echo "[6] Install Composer..."
if ! command -v composer &>/dev/null; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    echo "    ✅ Composer installed"
else
    composer self-update --quiet
    echo "    ✅ Composer sudah ada ($(composer --version --no-ansi | head -1))"
fi

# ── 7. Buat folder app ───────────────────────────────────────────
echo "[7] Prepare app directories..."
mkdir -p /www/wwwroot/hrm-backend
mkdir -p /www/wwwroot/hrm-frontend
chown -R www:www /www/wwwroot/hrm-backend
chown -R www:www /www/wwwroot/hrm-frontend

echo ""
echo "═══════════════════════════════════════════════"
echo "   ✅  Server init selesai!"
echo "═══════════════════════════════════════════════"
echo ""
echo "Langkah selanjutnya:"
echo "  1. Upload facehrm-backend-deploy.zip ke /www/wwwroot/hrm-backend/"
echo "  2. Extract: cd /www/wwwroot/hrm-backend && unzip facehrm-backend-deploy.zip"
echo "  3. Buat .env: cp .env.production.template .env && nano .env"
echo "  4. Jalankan setup: bash /www/wwwroot/hrm-backend/deploy/laravel-setup.sh"
echo "  5. Buat website di aaPanel: hrm.kreasikaryaarjuna.co.id, PHP 8.3"
echo "  6. Pasang SSL (Let's Encrypt)"
echo "  7. Ganti Nginx config dengan deploy/nginx-combined.conf"
echo ""
echo "Credentials DB untuk .env:"
echo "  DB_DATABASE=$DB_NAME"
echo "  DB_USERNAME=$DB_USER"
echo "  DB_PASSWORD=$DB_PASS"
echo ""
