import Image from 'next/image'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

// ── Fetch APK version from /app/version.txt written by deploy-apk.sh ─────────
// Format: line 1 = "v1.0.0 (build 64) - 2026-02-27"
//         line 2 = "bsshrms-v1.0.0-b64.apk"  (versioned filename)
// Returns { version, date, filename } or null
async function getApkInfo(): Promise<{ version: string; date: string; filename: string } | null> {
  // Try web-served version.txt first (works for both local dev and prod via Next.js public/)
  // Fallback: API base URL (prod Nginx serves /app/ directly)
  const apiUrl  = process.env.NEXT_PUBLIC_API_URL ?? ''
  const apiBase = apiUrl.replace(/\/api\/v1\/?$/, '')
  const webBase = process.env.NEXT_PUBLIC_WEB_URL ?? ''
  const candidates = [
    webBase ? `${webBase}/app/version.txt` : null,
    apiBase ? `${apiBase}/app/version.txt` : null,
    '/app/version.txt', // relative — works in SSR when web and files are on same origin
  ].filter(Boolean) as string[]

  let res: Response | null = null
  for (const url of candidates) {
    try {
      const r = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(2000) })
      if (r.ok) { res = r; break }
    } catch { /* try next */ }
  }
  if (!res) return null
  try {
    const lines    = (await res.text()).trim().split('\n').map(l => l.trim()).filter(Boolean)
    const versionLine = lines[0] ?? ''
    const filename    = lines[1] ?? 'bsshrms.apk' // fallback to static name
    if (!versionLine) return null

    // "v1.0.0 (build 64) - 2026-02-27"
    const dashIdx  = versionLine.lastIndexOf(' - ')
    const version  = (dashIdx > 0 ? versionLine.slice(0, dashIdx) : versionLine).trim()
    const rawDate  = dashIdx > 0 ? versionLine.slice(dashIdx + 3).trim() : ''
    let date = ''
    if (rawDate) {
      try {
        date = new Date(rawDate).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
      } catch {
        date = rawDate
      }
    }
    return { version, date, filename }
  } catch {
    return null
  }
}

export default async function LoginPage() {
  const apkInfo = await getApkInfo()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <Image src="/logo.png" alt="BSS HRMS" width={64} height={64} className="object-contain" priority />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">BSS HRMS</h1>
          <p className="text-slate-500 text-sm">Human Resource Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Sign In</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
          </div>
          <LoginForm />
        </div>

        {/* Android App Download */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.523 15.341 20 12.869l-1.029-1.029-2.477 2.472a7.3 7.3 0 0 0-3.494-.876 7.3 7.3 0 0 0-3.494.876L7.029 11.84 6 12.869l2.477 2.472A7.44 7.44 0 0 0 5 22h14a7.44 7.44 0 0 0-3.477-6.659M9.5 19a1 1 0 1 1 0-2 1 1 0 0 1 0 2m5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2M14.471 2.297l1.905-1.905 1.078 1.078-1.905 1.905A8.3 8.3 0 0 0 12 3a8.3 8.3 0 0 0-3.549.375L6.546 1.47l1.078-1.078 1.905 1.905A8.5 8.5 0 0 1 12 2a8.5 8.5 0 0 1 2.471.297" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700">Aplikasi Android</p>
            <p className="text-xs text-slate-400">Untuk absensi wajah via smartphone</p>
            {apkInfo && (
              <p className="text-xs text-emerald-600 font-medium mt-0.5">
                {apkInfo.version}
                {apkInfo.date ? (
                  <span className="text-slate-400 font-normal"> · {apkInfo.date}</span>
                ) : null}
              </p>
            )}
          </div>
          <a
            href={apkInfo ? `/app/${apkInfo.filename}` : '/app/bsshrms.apk'}
            download={apkInfo ? `BSSHRMS-${apkInfo.filename.replace('bsshrms-', '')}` : 'BSSHRMS.apk'}
            className="shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>

        <p className="text-center text-xs text-slate-400">v1.0.0 &copy; 2026 BSS HRMS</p>
      </div>
    </div>
  )
}
