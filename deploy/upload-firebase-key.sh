#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# BSS HRMS — Upload Firebase Service Account Key ke Server
# Jalankan dari local setiap kali key di-rotate:
#   bash deploy/upload-firebase-key.sh path/to/key.json
# ─────────────────────────────────────────────────────────────────

KEY_FILE="${1:-$HOME/Downloads/bsshrms-firebase-service-account.json}"
SERVER="root@45.66.153.156"
SSH_KEY="$HOME/.ssh/id_ed25519"
REMOTE_PATH="/www/wwwroot/bsshrms/firebase-service-account.json"

if [ ! -f "$KEY_FILE" ]; then
    echo "ERROR: Key file tidak ditemukan: $KEY_FILE"
    echo "Usage: bash deploy/upload-firebase-key.sh /path/to/key.json"
    exit 1
fi

echo "Uploading Firebase key ke server BSS HRMS..."
scp -i "$SSH_KEY" "$KEY_FILE" "${SERVER}:${REMOTE_PATH}"
ssh -i "$SSH_KEY" "$SERVER" \
    "chown www:www $REMOTE_PATH && chmod 600 $REMOTE_PATH && /etc/init.d/php-fpm-83 reload && echo 'done'"

echo "Firebase key berhasil diupload dan PHP-FPM di-reload."
