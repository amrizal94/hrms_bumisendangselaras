param(
  [string]$Server    = "root@45.66.153.156",
  [string]$RemoteDir = "/www/wwwroot/bsshrms/web/public/app",
  [string]$SshKey    = "$env:USERPROFILE\.ssh\id_ed25519"
)

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($root)) { $root = (Get-Location).Path }

# -- Version info --------------------------------------------------------------
$pubspecLine = Get-Content (Join-Path $root "mobile\pubspec.yaml") |
               Where-Object { $_ -match "^version:" } |
               Select-Object -First 1
$versionName  = ($pubspecLine -replace "version:\s*", "").Trim().Split("+")[0]
$buildNum     = (git -C $root rev-list --count HEAD).Trim()
Write-Host "==> Version: v$versionName (build $buildNum)"

# Versioned filename: bsshrms-v1.0.0-b64.apk
$versionedFile = "bsshrms-v${versionName}-b${buildNum}.apk"
$staticFile    = "bsshrms.apk"

# -- Build ---------------------------------------------------------------------
Set-Location (Join-Path $root "mobile")

Write-Host "==> Stop Gradle daemon (best effort)"
Set-Location .\android
if (Test-Path .\gradlew.bat) {
  .\gradlew.bat --stop 2>$null | Out-Null
} elseif (Test-Path .\gradlew) {
  .\gradlew --stop 2>$null | Out-Null
}
Set-Location ..

Write-Host "==> Kill lock-prone processes (java/dart/adb)"
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name dart -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name adb  -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "==> Clean build artifacts"
Remove-Item -Recurse -Force .\build          -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\android\.gradle -ErrorAction SilentlyContinue

Write-Host "==> Build APK release (arm64 - ~40% lebih kecil dari fat APK)"
flutter build apk --release `
  --target-platform android-arm64 `
  --build-name="$versionName" `
  --build-number="$buildNum"

$localApk = ".\build\app\outputs\flutter-apk\app-release.apk"
if (!(Test-Path $localApk)) {
  throw "APK tidak ditemukan: $localApk"
}

$apkSize = (Get-Item $localApk).Length / 1MB
Write-Host ("==> APK size: {0:N1} MB" -f $apkSize)

# -- Deploy --------------------------------------------------------------------
$stamp      = Get-Date -Format "yyyyMMdd-HHmmss"
$staticPath    = "$RemoteDir/$staticFile"
$backupPath    = "$RemoteDir/${staticFile}.bak-$stamp"
$versionedPath = "$RemoteDir/$versionedFile"

Write-Host "==> Backup bsshrms.apk lama (jika ada)"
ssh -i $SshKey $Server "if [ -f '$staticPath' ]; then cp '$staticPath' '$backupPath'; fi"

Write-Host "==> Upload as versioned: $versionedFile"
scp -i $SshKey $localApk "${Server}:${versionedPath}"

Write-Host "==> Update bsshrms.apk (copy dari versioned, untuk backward compat)"
ssh -i $SshKey $Server "cp '$versionedPath' '$staticPath'"

Write-Host "==> Write version.txt (2 baris: version string + filename)"
$today       = Get-Date -Format "yyyy-MM-dd"
$versionLine = "v$versionName (build $buildNum) - $today"
ssh -i $SshKey $Server "printf '%s\n%s\n' '$versionLine' '$versionedFile' > '$RemoteDir/version.txt'"

Write-Host "==> Cleanup versioned APK lama (keep 3 terbaru)"
ssh -i $SshKey $Server "ls -t '$RemoteDir'/bsshrms-v*-b*.apk 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null; true"

Write-Host "==> Cleanup backup lebih dari 7 hari"
ssh -i $SshKey $Server "find '$RemoteDir' -name '*.bak-*' -mtime +7 -delete 2>/dev/null; true"

Write-Host "==> Verifikasi file remote"
ssh -i $SshKey $Server "ls -lh '$versionedPath' '$staticPath' && echo '---' && cat '$RemoteDir/version.txt'"

Write-Host "==> Verifikasi URL publik (versioned)..."
$apkUrl = "https://hrms.bumisendangselaras.co.id/app/$versionedFile"
try {
  $response = Invoke-WebRequest -Uri $apkUrl -Method Head `
                                -TimeoutSec 10 -UseBasicParsing
  $httpCode = $response.StatusCode
} catch {
  $httpCode = 0
}
if ($httpCode -lt 200 -or $httpCode -ge 400) {
  throw "APK tidak accessible di $apkUrl (HTTP $httpCode)"
}
Write-Host "OK APK accessible (HTTP $httpCode): $apkUrl"

Write-Host "DONE Deploy selesai: v$versionName (build $buildNum) -> $versionedFile"
