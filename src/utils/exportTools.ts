import { PatientCase } from '../types/medical';

export function exportCasesToCsv(cases: PatientCase[]): void {
  const headers = [
    'Mã ca',
    'Ngày mổ',
    'Tuổi',
    'Giới tính',
    'Địa chỉ',
    'Dân tộc',
    'Nghề nghiệp',
    'Độ phức tạp',
    'Chẩn đoán',
    'Loại phẫu thuật',
    'Tăng huyết áp',
    'Đái tháo đường',
    'Lao',
    'Ung thư',
    'Suy gan thận',
    'Tiền căn mổ xoang',
    'Lý do vào viện',
    'Thời gian khởi phát (ngày)',
    'Điều trị trước NV',
    'Nghẹt mũi',
    'Chảy mũi',
    'Dịch mũi đặc',
    'Giảm khứu giác',
    'Sụp mi',
    'Lồi mắt',
    'Giảm thị lực',
    'Rối loạn vận nhãn',
    'GCS',
    'Điểm GCS',
    'Mạch (l/p)',
    'Nhiệt độ (C)',
    'Huyết áp (mmHg)',
    'SpO2 (%)',
    'Hemoglobin (g/L)',
    'Bạch cầu (G/L)',
    'Tiểu cầu (G/L)',
    'Natri (mmol/L)',
    'Kali (mmol/L)',
    'Creatinine (mg/dL)',
    'CRP (mg/L)',
    'Glucose (mg/dL)',
    'Albumin (mg/dL)',
    'Số bên tổn thương',
    'Xoang hàm',
    'Xoang sàng',
    'Xoang bướm',
    'Xoang trán',
    'Lan ổ mắt (Chandler)',
    'Lan nội sọ',
    'Lund-Mackay Score',
    'Nasal Polyp Score Phải',
    'Nasal Polyp Score Trái',
    'Kết quả cấy',
    'Chi tiết cấy',
    'Giải phẫu bệnh',
    'Kháng sinh điều trị',
    'Phẫu thuật',
    'Số lần phẫu thuật',
    'Thủ thuật thực hiện',
    'Nhầy mủ',
    'Phù nề',
    'Hoại tử',
    'Hủy xương giấy',
    'Số ngày điều trị',
    'Kết quả điều trị',
    'Tử vong',
    'Số ảnh CT',
    'Số ảnh Nội soi',
    'Độ hoàn thiện (%)',
  ];

  const rows = cases.map((c) => [
    `"${c.caseCode}"`,
    `"${c.surgeryDate}"`,
    c.age ?? '',
    `"${c.gender}"`,
    `"${c.address}"`,
    `"${c.ethnicity}"`,
    `"${c.occupation}"`,
    `"${c.complexityGrade}"`,
    `"${c.primaryDiagnosis}"`,
    `"${c.surgeryType}"`,
    c.comorbidities.hypertension ? '1' : '0',
    c.comorbidities.diabetes ? '1' : '0',
    c.comorbidities.tuberculosis ? '1' : '0',
    c.comorbidities.cancer ? '1' : '0',
    c.comorbidities.liverKidneyFailure ? '1' : '0',
    c.comorbidities.priorSinusSurgery ? '1' : '0',
    `"${c.admissionReasons?.join('; ') || ''}"`,
    c.symptomDurationDays ?? '',
    `"${c.treatmentBeforeAdmission}"`,
    `"${c.nasalSymptoms.nasalObstruction}"`,
    `"${c.nasalSymptoms.rhinorrhea}"`,
    `"${c.nasalSymptoms.thickSecretions}"`,
    `"${c.nasalSymptoms.hyposmiaOrAnosmia}"`,
    `"${c.eyeSymptoms.ptosis}"`,
    `"${c.eyeSymptoms.proptosis}"`,
    `"${c.eyeSymptoms.visualLossOrDecrease}"`,
    `"${c.eyeSymptoms.ocularMobilityDisorder}"`,
    `"${c.neurologicalSymptoms.gcsCategory}"`,
    c.neurologicalSymptoms.gcsScore ?? '',
    c.vitalSigns.pulse ?? '',
    c.vitalSigns.temperature ?? '',
    c.vitalSigns.systolicBP ?? '',
    c.vitalSigns.spo2 ?? '',
    c.labResults.hemoglobin ?? '',
    c.labResults.whiteBloodCells ?? '',
    c.labResults.platelets ?? '',
    c.labResults.sodium ?? '',
    c.labResults.potassium ?? '',
    c.labResults.creatinine ?? '',
    c.labResults.crp ?? '',
    c.labResults.glucose ?? '',
    c.labResults.albumin ?? '',
    `"${c.diseaseExtent.laterality}"`,
    c.diseaseExtent.involvedSinuses.maxillary ? '1' : '0',
    c.diseaseExtent.involvedSinuses.ethmoid ? '1' : '0',
    c.diseaseExtent.involvedSinuses.sphenoid ? '1' : '0',
    c.diseaseExtent.involvedSinuses.frontal ? '1' : '0',
    `"${c.diseaseExtent.chandlerGroup}"`,
    `"${c.diseaseExtent.intracranialExtension.join('; ')}"`,
    c.totalLundMackayScore ?? '',
    c.nasalPolypScoreR ?? '',
    c.nasalPolypScoreL ?? '',
    `"${c.diseaseExtent.cultureResult}"`,
    `"${c.diseaseExtent.cultureBacteriaName || ''}"`,
    `"${c.diseaseExtent.pathologyResult}"`,
    `"${c.treatmentFeatures.antibiotics || ''}"`,
    `"${c.treatmentFeatures.surgeryPerformed}"`,
    c.treatmentFeatures.surgeryCount ?? '',
    `"${c.treatmentFeatures.surgicalProcedures?.join('; ') || ''}"`,
    c.treatmentFeatures.intraoperativeFindings.purulentSecretions ? '1' : '0',
    c.treatmentFeatures.intraoperativeFindings.edemaMucosa ? '1' : '0',
    c.treatmentFeatures.intraoperativeFindings.necrosisTissue ? '1' : '0',
    c.treatmentFeatures.intraoperativeFindings.papyraceaBoneDestruction ? '1' : '0',
    c.treatmentFeatures.treatmentDays ?? '',
    `"${c.treatmentFeatures.treatmentOutcome}"`,
    `"${c.treatmentFeatures.mortality}"`,
    c.images?.ctScanImages?.length || 0,
    c.images?.endoscopyImages?.length || 0,
    c.auditStatus?.completionPercentage ?? 0,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, `Rhinolog_CaMo_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportDeidentifiedCsv(cases: PatientCase[]): void {
  // Removes identifying identifiers like specific names, dates replaced by year
  const headers = [
    'ID_NghienCuu',
    'NamMo',
    'Tuoi',
    'GioiTinh',
    'DiaChi',
    'DanToc',
    'NgheNghiep',
    'DoPhucTap',
    'ChanDoan',
    'Chandler_O_Mat',
    'Lan_Noi_So',
    'Lund_Mackay',
    'BachCau_G_L',
    'CRP_mg_L',
    'KetQuaCay',
    'GiaiPhauBenh',
    'PhauThuat',
    'SoLanPhauThuat',
    'HuyXuongGiay',
    'SoNgayDieuTri',
    'KetQuaDieuTri',
    'TuVong',
  ];

  const rows = cases.map((c, index) => [
    `"SUBJ_${String(index + 1).padStart(4, '0')}"`,
    c.surgeryDate ? c.surgeryDate.split('-')[0] : '',
    c.age ?? '',
    `"${c.gender}"`,
    `"${c.address}"`,
    `"${c.ethnicity}"`,
    `"${c.occupation}"`,
    `"${c.complexityGrade}"`,
    `"${c.primaryDiagnosis}"`,
    `"${c.diseaseExtent.chandlerGroup}"`,
    `"${c.diseaseExtent.intracranialExtension.join('; ')}"`,
    c.totalLundMackayScore ?? '',
    c.labResults.whiteBloodCells ?? '',
    c.labResults.crp ?? '',
    `"${c.diseaseExtent.cultureResult}"`,
    `"${c.diseaseExtent.pathologyResult}"`,
    `"${c.treatmentFeatures.surgeryPerformed}"`,
    c.treatmentFeatures.surgeryCount ?? '',
    c.treatmentFeatures.intraoperativeFindings.papyraceaBoneDestruction ? '1' : '0',
    c.treatmentFeatures.treatmentDays ?? '',
    `"${c.treatmentFeatures.treatmentOutcome}"`,
    `"${c.treatmentFeatures.mortality}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, `Rhinolog_KhuDinhDanh_Research_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportHtmlReport(cases: PatientCase[]): void {
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo cáo Nghiên cứu Viêm Mũi Xoang & Phẫu thuật - Rhinolog</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; background: #fff; }
    h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; color: #334155; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-grade { background: #fef3c7; color: #92400e; }
    .badge-success { background: #dcfce7; color: #166534; }
    .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>RHINOLOG - BÁO CÁO TỔNG HỢP CA LÂM SÀNG & NGHIÊN CỨU</h1>
  <div class="meta">
    Ngày xuất: ${new Date().toLocaleString('vi-VN')} | Tổng số ca ghi nhận: ${cases.length}
  </div>

  <table>
    <thead>
      <tr>
        <th>Mã ca</th>
        <th>Tuổi / Giới</th>
        <th>Ngày mổ</th>
        <th>Chẩn đoán</th>
        <th>Độ phức tạp</th>
        <th>Lan ổ mắt (Chandler)</th>
        <th>Lund-Mackay</th>
        <th>Vi sinh / GPB</th>
        <th>Phẫu thuật</th>
        <th>Kết quả</th>
      </tr>
    </thead>
    <tbody>
      ${cases
        .map(
          (c) => `
        <tr>
          <td><strong>${c.caseCode}</strong></td>
          <td>${c.age ?? '-'} / ${c.gender}</td>
          <td>${c.surgeryDate}</td>
          <td>${c.primaryDiagnosis}</td>
          <td><span class="badge badge-grade">${c.complexityGrade.split('—')[0]}</span></td>
          <td>${c.diseaseExtent.chandlerGroup.split(':')[0]}</td>
          <td><strong>${c.totalLundMackayScore}/24</strong></td>
          <td>${c.diseaseExtent.cultureResult} / ${c.diseaseExtent.pathologyResult}</td>
          <td>${c.treatmentFeatures.surgeryPerformed === 'Có' ? (c.treatmentFeatures.surgicalProcedures?.[0] || 'Phẫu thuật') : 'Nội khoa'}</td>
          <td><span class="badge badge-success">${c.treatmentFeatures.treatmentOutcome}</span></td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    Hệ thống Sổ tay lâm sàng và Đối soát dữ liệu mũi xoang chuyên sâu RHINOLOG
  </div>
  <script>window.print();</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) {
    downloadBlob(html, `BaoCao_Rhinolog_${new Date().toISOString().split('T')[0]}.html`, 'text/html;charset=utf-8;');
  }
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
