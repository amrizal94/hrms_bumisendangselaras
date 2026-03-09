import type { PayrollRecord } from '@/types/payroll'

export interface CompanyInfo {
  name: string
  address?: string
  phone?: string
  email?: string
}

const IDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

const todayStr = () =>
  new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

// ── Shared CSS ────────────────────────────────────────────────────────────────

const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;color:#1e293b;background:#fff}
.page{padding:32px;max-width:700px;margin:0 auto}
.company-header{border-bottom:2px solid #1e293b;padding-bottom:10px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end}
.company-name{font-size:20px;font-weight:700;color:#0f172a}
.company-meta{font-size:11px;color:#64748b;line-height:1.6;text-align:right}
.slip-title{font-size:16px;font-weight:700;margin-bottom:2px}
.slip-period{font-size:12px;color:#64748b;margin-bottom:2px}
.slip-date{font-size:11px;color:#94a3b8;margin-bottom:16px}
.emp-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:16px}
.emp-name{font-size:15px;font-weight:600;margin-bottom:2px}
.emp-detail{font-size:12px;color:#475569;margin-bottom:1px}
.emp-number{font-family:monospace;font-size:11px;color:#94a3b8}
.sect{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin:14px 0 8px}
.att-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:4px}
.att-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;text-align:center;padding:10px 6px}
.att-num{font-size:20px;font-weight:700;color:#1e293b}
.att-lbl{font-size:10px;color:#64748b;margin-top:2px}
table.sal{width:100%;border-collapse:collapse}
table.sal td{padding:4px 0;font-size:13px}
table.sal td:last-child{text-align:right;font-family:monospace}
table.sal td:first-child{color:#64748b;width:55%}
table.sal tr.sep td{padding-top:6px;border-top:1px solid #e2e8f0}
table.sal tr.bold td{font-weight:600;color:#1e293b}
.net-box{margin-top:14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
.net-lbl{font-size:14px;font-weight:600}
.net-amt{font-size:22px;font-weight:700;color:#2563eb;font-family:monospace}
.footer{margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px}
.sign{text-align:center;min-width:130px}
.sign-line{border-top:1px solid #1e293b;margin-top:52px;padding-top:4px;font-size:11px}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:capitalize}
.badge-paid{background:#d1fae5;color:#065f46}
.badge-finalized{background:#dbeafe;color:#1e40af}
.badge-draft{background:#f1f5f9;color:#475569}
@media print{
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pagebreak{page-break-after:always}
  .pagebreak:last-child{page-break-after:auto}
}
`

// ── Single payslip HTML body ───────────────────────────────────────────────────

function slipBody(record: PayrollRecord, company: CompanyInfo): string {
  const emp = record.employee
  const badgeClass = record.status === 'paid'
    ? 'badge-paid'
    : record.status === 'finalized'
    ? 'badge-finalized'
    : 'badge-draft'

  return `
<div class="company-header">
  <div class="company-name">${company.name}</div>
  <div class="company-meta">
    ${company.address ? `${company.address}<br>` : ''}
    ${company.phone ? `Telp: ${company.phone}<br>` : ''}
    ${company.email ? company.email : ''}
  </div>
</div>

<div class="slip-title">Slip Gaji — ${record.period_label}</div>
<div class="slip-date">Dicetak: ${todayStr()}</div>

${emp ? `
<div class="emp-box">
  <div class="emp-name">${emp.user.name}</div>
  <div class="emp-detail">${emp.position}${emp.department ? ' &middot; ' + emp.department.name : ''}</div>
  <div class="emp-number">${emp.employee_number}</div>
</div>` : ''}

<div class="sect">Kehadiran</div>
<div class="att-grid">
  <div class="att-box"><div class="att-num">${record.working_days}</div><div class="att-lbl">Hari Kerja</div></div>
  <div class="att-box"><div class="att-num">${record.present_days}</div><div class="att-lbl">Hadir</div></div>
  <div class="att-box"><div class="att-num">${record.leave_days}</div><div class="att-lbl">Cuti</div></div>
  <div class="att-box"><div class="att-num">${record.absent_days}</div><div class="att-lbl">Alpha</div></div>
</div>

<div class="sect">Rincian Gaji</div>
<table class="sal"><tbody>
  <tr><td>Gaji Pokok</td><td>${IDR(record.basic_salary)}</td></tr>
  <tr><td>Tunjangan</td><td>${IDR(record.allowances)}</td></tr>
  <tr><td>Lembur</td><td>${IDR(record.overtime_pay)}</td></tr>
  <tr class="sep bold"><td>Gaji Bruto</td><td>${IDR(record.gross_salary)}</td></tr>
  <tr><td>Potongan Alpha</td><td>&minus; ${IDR(record.absent_deduction)}</td></tr>
  <tr><td>Potongan Lain</td><td>&minus; ${IDR(record.other_deductions)}</td></tr>
  <tr><td>PPh21 (Pajak)</td><td>&minus; ${IDR(record.tax_deduction)}</td></tr>
  <tr><td>BPJS</td><td>&minus; ${IDR(record.bpjs_deduction)}</td></tr>
  <tr class="sep bold"><td>Total Potongan</td><td>&minus; ${IDR(record.total_deductions)}</td></tr>
</tbody></table>

<div class="net-box">
  <span class="net-lbl">Gaji Bersih (Net)</span>
  <span class="net-amt">${IDR(record.net_salary)}</span>
</div>

<div class="footer">
  <div style="line-height:1.8">
    <span class="badge ${badgeClass}">${record.status}</span><br>
    ${record.paid_at ? `Dibayar: ${fmtDate(record.paid_at)}<br>` : ''}
    ${record.notes ? `Catatan: ${record.notes}` : ''}
  </div>
  <div class="sign">
    <div class="sign-line">HRD / ${company.name}</div>
  </div>
</div>`
}

// ── Build full single-slip document ──────────────────────────────────────────

function buildSingleHtml(record: PayrollRecord, company: CompanyInfo): string {
  return `<!DOCTYPE html><html lang="id"><head>
<meta charset="UTF-8">
<title>Slip Gaji — ${record.period_label}${record.employee ? ' — ' + record.employee.user.name : ''}</title>
<style>${BASE_CSS}</style>
</head><body>
<div class="page">${slipBody(record, company)}</div>
</body></html>`
}

// ── Build multi-slip batch document ──────────────────────────────────────────

function buildBatchHtml(records: PayrollRecord[], company: CompanyInfo, periodLabel: string): string {
  const pages = records.map((r, i) => {
    const isLast = i === records.length - 1
    return `<div class="page${isLast ? '' : ' pagebreak'}">${slipBody(r, company)}</div>`
  }).join('\n')

  return `<!DOCTYPE html><html lang="id"><head>
<meta charset="UTF-8">
<title>Payroll — ${periodLabel} — ${company.name}</title>
<style>${BASE_CSS}.page{padding:28px;page-break-inside:avoid}</style>
</head><body>${pages}</body></html>`
}

// ── Print via hidden iframe (avoids popup blocker) ────────────────────────────

function printHtml(html: string) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;opacity:0'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) return
  doc.open()
  doc.write(html)
  doc.close()

  const cleanup = () => {
    setTimeout(() => {
      try { document.body.removeChild(iframe) } catch { /* already removed */ }
    }, 2000)
  }

  iframe.contentWindow?.addEventListener('load', () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    cleanup()
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

export function printPayslip(record: PayrollRecord, company: CompanyInfo = { name: 'BSS HRMS' }) {
  printHtml(buildSingleHtml(record, company))
}

export function printPayslips(
  records: PayrollRecord[],
  company: CompanyInfo = { name: 'BSS HRMS' },
  periodLabel = '',
) {
  if (records.length === 0) return
  if (records.length === 1) {
    printPayslip(records[0], company)
    return
  }
  printHtml(buildBatchHtml(records, company, periodLabel))
}
