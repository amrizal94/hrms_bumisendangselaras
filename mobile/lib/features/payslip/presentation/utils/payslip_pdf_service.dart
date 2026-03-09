import 'dart:typed_data';

import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../../data/models/payslip_model.dart';

class PayslipPdfService {
  // ── Currency formatter ──────────────────────────────────────────────────────
  static String _fmt(double v) {
    final s = v.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
    return 'Rp $s';
  }

  static String _monthName(int m) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return months[m - 1];
  }

  static String _fmtDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
      ];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return iso;
    }
  }

  static PdfColor _statusBg(String s) => switch (s) {
        'paid'      => PdfColor.fromHex('D1FAE5'),
        'finalized' => PdfColor.fromHex('DBEAFE'),
        _           => PdfColor.fromHex('F1F5F9'),
      };

  static PdfColor _statusFg(String s) => switch (s) {
        'paid'      => PdfColor.fromHex('065F46'),
        'finalized' => PdfColor.fromHex('1E40AF'),
        _           => PdfColor.fromHex('475569'),
      };

  // ── Salary table row ────────────────────────────────────────────────────────
  static pw.TableRow _salRow(String label, String value, {bool bold = false, bool separator = false}) {
    final style = bold
        ? pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)
        : const pw.TextStyle(fontSize: 11);
    final topPad = separator ? 6.0 : 2.0;

    return pw.TableRow(
      decoration: separator
          ? pw.BoxDecoration(
              border: pw.Border(
                top: pw.BorderSide(color: PdfColor.fromHex('E2E8F0'), width: 0.5),
              ),
            )
          : null,
      children: [
        pw.Padding(
          padding: pw.EdgeInsets.only(top: topPad, bottom: 2),
          child: pw.Text(label, style: style),
        ),
        pw.Padding(
          padding: pw.EdgeInsets.only(top: topPad, bottom: 2),
          child: pw.Text(value, textAlign: pw.TextAlign.right, style: style),
        ),
      ],
    );
  }

  // ── Attendance box ───────────────────────────────────────────────────────────
  static pw.Widget _attBox(String label, String value) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(vertical: 8),
      color: PdfColor.fromHex('F8FAFC'),
      child: pw.Column(
        mainAxisAlignment: pw.MainAxisAlignment.center,
        children: [
          pw.Text(
            value,
            style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
            textAlign: pw.TextAlign.center,
          ),
          pw.SizedBox(height: 2),
          pw.Text(
            label,
            style: const pw.TextStyle(fontSize: 9),
            textAlign: pw.TextAlign.center,
          ),
        ],
      ),
    );
  }

  // ── Section label ────────────────────────────────────────────────────────────
  static pw.Widget _sectionLabel(String text) => pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 9,
          fontWeight: pw.FontWeight.bold,
          color: PdfColor.fromHex('94A3B8'),
          letterSpacing: 1,
        ),
      );

  // ── Main PDF builder ─────────────────────────────────────────────────────────
  static Future<Uint8List> generate(
    PayslipModel slip, {
    String companyName = 'BSS HRMS',
  }) async {
    final doc = pw.Document();
    final periodStr = slip.periodLabel ?? '${_monthName(slip.periodMonth)} ${slip.periodYear}';

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(36),
        build: (context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // ── Company header ────────────────────────────────────────────
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text(
                    companyName,
                    style: pw.TextStyle(
                      fontSize: 20,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('0F172A'),
                    ),
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text(
                        'Slip Gaji',
                        style: pw.TextStyle(
                          fontSize: 14,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.Text(
                        periodStr,
                        style: pw.TextStyle(
                          fontSize: 11,
                          color: PdfColor.fromHex('64748B'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              pw.Divider(thickness: 1.5, color: PdfColor.fromHex('1E293B')),
              pw.SizedBox(height: 8),

              // ── Employee info ──────────────────────────────────────────────
              if (slip.employeeName != null || slip.employeeNumber != null) ...[
                pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.all(12),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromHex('F8FAFC'),
                    border: pw.Border.all(color: PdfColor.fromHex('E2E8F0')),
                    borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      if (slip.employeeName != null)
                        pw.Text(
                          slip.employeeName!,
                          style: pw.TextStyle(
                            fontSize: 14,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                      if (slip.position != null || slip.departmentName != null)
                        pw.Padding(
                          padding: const pw.EdgeInsets.only(top: 2),
                          child: pw.Text(
                            [slip.position, slip.departmentName]
                                .whereType<String>()
                                .join(' · '),
                            style: pw.TextStyle(
                              fontSize: 11,
                              color: PdfColor.fromHex('475569'),
                            ),
                          ),
                        ),
                      if (slip.employeeNumber != null)
                        pw.Padding(
                          padding: const pw.EdgeInsets.only(top: 2),
                          child: pw.Text(
                            slip.employeeNumber!,
                            style: pw.TextStyle(
                              fontSize: 10,
                              color: PdfColor.fromHex('94A3B8'),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 16),
              ],

              // ── Attendance ────────────────────────────────────────────────
              _sectionLabel('KEHADIRAN'),
              pw.SizedBox(height: 6),
              pw.Table(
                border: pw.TableBorder.all(
                  color: PdfColor.fromHex('E2E8F0'),
                  width: 0.5,
                ),
                children: [
                  pw.TableRow(children: [
                    _attBox('Hari Kerja', '${slip.workingDays}'),
                    _attBox('Hadir',      '${slip.presentDays}'),
                    _attBox('Cuti',       '${slip.leaveDays}'),
                    _attBox('Alpha',      '${slip.absentDays}'),
                  ]),
                ],
              ),
              pw.SizedBox(height: 16),

              // ── Salary breakdown ──────────────────────────────────────────
              _sectionLabel('RINCIAN GAJI'),
              pw.SizedBox(height: 6),
              pw.Table(
                columnWidths: {
                  0: const pw.FlexColumnWidth(3),
                  1: const pw.FlexColumnWidth(2),
                },
                children: [
                  _salRow('Gaji Pokok', _fmt(slip.basicSalary)),
                  _salRow('Tunjangan',  _fmt(slip.allowances)),
                  _salRow('Lembur',     _fmt(slip.overtimePay)),
                  _salRow('Gaji Bruto', _fmt(slip.grossSalary), bold: true, separator: true),
                  if (slip.reimbursement > 0)
                    _salRow('Reimbursement', '+ ${_fmt(slip.reimbursement)}'),
                  _salRow('Potongan Alpha', '– ${_fmt(slip.absentDeduction)}'),
                  _salRow('Potongan Lain',  '– ${_fmt(slip.otherDeductions)}'),
                  _salRow('PPh21 (Pajak)',  '– ${_fmt(slip.taxDeduction)}'),
                  _salRow('BPJS',           '– ${_fmt(slip.bpjsDeduction)}'),
                  _salRow('Total Potongan', '– ${_fmt(slip.totalDeductions)}', bold: true, separator: true),
                ],
              ),
              pw.SizedBox(height: 14),

              // ── Net salary box ────────────────────────────────────────────
              pw.Container(
                padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromHex('EFF6FF'),
                  border: pw.Border.all(color: PdfColor.fromHex('BFDBFE')),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      'Gaji Bersih (Net)',
                      style: pw.TextStyle(
                        fontSize: 13,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.Text(
                      _fmt(slip.netSalary),
                      style: pw.TextStyle(
                        fontSize: 18,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColor.fromHex('2563EB'),
                      ),
                    ),
                  ],
                ),
              ),

              pw.Spacer(),

              // ── Footer ────────────────────────────────────────────────────
              pw.Divider(thickness: 0.5, color: PdfColor.fromHex('E2E8F0')),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: pw.BoxDecoration(
                          color: _statusBg(slip.status),
                          borderRadius:
                              const pw.BorderRadius.all(pw.Radius.circular(4)),
                        ),
                        child: pw.Text(
                          slip.status.toUpperCase(),
                          style: pw.TextStyle(
                            fontSize: 10,
                            fontWeight: pw.FontWeight.bold,
                            color: _statusFg(slip.status),
                          ),
                        ),
                      ),
                      if (slip.paidAt != null)
                        pw.Padding(
                          padding: const pw.EdgeInsets.only(top: 3),
                          child: pw.Text(
                            'Dibayar: ${_fmtDate(slip.paidAt!)}',
                            style: pw.TextStyle(
                              fontSize: 9,
                              color: PdfColor.fromHex('64748B'),
                            ),
                          ),
                        ),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.center,
                    children: [
                      pw.SizedBox(height: 44),
                      pw.Container(
                        width: 130,
                        decoration: pw.BoxDecoration(
                          border: pw.Border(
                            top: pw.BorderSide(
                              color: PdfColor.fromHex('1E293B'),
                              width: 0.5,
                            ),
                          ),
                        ),
                        padding: const pw.EdgeInsets.only(top: 4),
                        child: pw.Text(
                          'HRD / $companyName',
                          textAlign: pw.TextAlign.center,
                          style: const pw.TextStyle(fontSize: 10),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );

    return doc.save();
  }
}
