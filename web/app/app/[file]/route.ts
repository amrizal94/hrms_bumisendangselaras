import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// Serves files from web/public/app/ directory
// Needed because Next.js 16 + Turbopack has a bug with public/ static file serving in dev mode

const ALLOWED_EXTENSIONS = ['.apk', '.txt', '.json']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params
  const ext = path.extname(file).toLowerCase()

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), 'public', 'app', file)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const contentTypes: Record<string, string> = {
    '.apk': 'application/vnd.android.package-archive',
    '.txt': 'text/plain; charset=utf-8',
    '.json': 'application/json',
  }

  const fileBuffer = fs.readFileSync(filePath)
  const contentType = contentTypes[ext] ?? 'application/octet-stream'

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': ext === '.apk' ? `attachment; filename="${file}"` : 'inline',
      'Cache-Control': 'no-store',
    },
  })
}
