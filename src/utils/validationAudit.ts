import { PatientCase, AuditIssue } from '../types/medical';

export function calculateLundMackayTotal(lm: PatientCase['lundMackay']): number {
  return (
    (lm.frontalR || 0) +
    (lm.frontalL || 0) +
    (lm.antEthmoidR || 0) +
    (lm.antEthmoidL || 0) +
    (lm.postEthmoidR || 0) +
    (lm.postEthmoidL || 0) +
    (lm.maxillaryR || 0) +
    (lm.maxillaryL || 0) +
    (lm.sphenoidR || 0) +
    (lm.sphenoidL || 0) +
    (lm.omcR || 0) +
    (lm.omcL || 0)
  );
}

export function auditSingleCase(patient: PatientCase): {
  issues: AuditIssue[];
  completionPercentage: number;
  inconsistencyCount: number;
  missingRequiredCount: number;
} {
  const issues: AuditIssue[] = [];

  // 1. Logic Consistency Checks
  // A. Phẫu thuật
  if (patient.treatmentFeatures.surgeryPerformed === 'Không') {
    if (patient.treatmentFeatures.surgeryCount && patient.treatmentFeatures.surgeryCount > 0) {
      issues.push({
        caseId: patient.id,
        caseCode: patient.caseCode,
        severity: 'error',
        category: 'logic_conflict',
        message: 'Mâu thuẫn: Phẫu thuật chọn "Không" nhưng lại có "Số lần phẫu thuật" > 0.',
        fieldKey: 'surgeryCount',
        stepNumber: 4,
      });
    }
    const hasIntraOpSigns = Object.values(patient.treatmentFeatures.intraoperativeFindings).some(
      (v) => v === true
    );
    if (hasIntraOpSigns) {
      issues.push({
        caseId: patient.id,
        caseCode: patient.caseCode,
        severity: 'error',
        category: 'logic_conflict',
        message: 'Mâu thuẫn: Phẫu thuật chọn "Không" nhưng lại ghi nhận "Dấu hiệu trong phẫu thuật".',
        fieldKey: 'intraoperativeFindings',
        stepNumber: 4,
      });
    }
    if (patient.treatmentFeatures.surgicalProcedures && patient.treatmentFeatures.surgicalProcedures.length > 0) {
      issues.push({
        caseId: patient.id,
        caseCode: patient.caseCode,
        severity: 'error',
        category: 'logic_conflict',
        message: 'Mâu thuẫn: Phẫu thuật chọn "Không" nhưng có chọn danh sách "Thủ thuật phẫu thuật".',
        fieldKey: 'surgicalProcedures',
        stepNumber: 4,
      });
    }
  } else if (patient.treatmentFeatures.surgeryPerformed === 'Có') {
    if (!patient.treatmentFeatures.surgeryCount || patient.treatmentFeatures.surgeryCount < 1) {
      issues.push({
        caseId: patient.id,
        caseCode: patient.caseCode,
        severity: 'warning',
        category: 'missing_field',
        message: 'Có phẫu thuật nhưng chưa nhập "Số lần phẫu thuật".',
        fieldKey: 'surgeryCount',
        stepNumber: 4,
      });
    }
  }

  // B. Tử vong vs Kết quả điều trị
  if (patient.treatmentFeatures.mortality === 'Có' && patient.treatmentFeatures.treatmentOutcome === 'Cải thiện') {
    issues.push({
      caseId: patient.id,
      caseCode: patient.caseCode,
      severity: 'error',
      category: 'logic_conflict',
      message: 'Mâu thuẫn nghiêm trọng: Bệnh nhân "Tử vong = Có" nhưng kết quả điều trị lại để "Cải thiện".',
      fieldKey: 'treatmentOutcome',
      stepNumber: 5,
    });
  }

  // C. Glasgow Coma Scale (GCS)
  if (patient.neurologicalSymptoms.gcsScore !== undefined && patient.neurologicalSymptoms.gcsScore !== null) {
    const score = patient.neurologicalSymptoms.gcsScore;
    if (patient.neurologicalSymptoms.gcsCategory.startsWith('Tỉnh') && score < 13) {
      issues.push({
        caseId: patient.id,
        caseCode: patient.caseCode,
        severity: 'warning',
        category: 'logic_conflict',
        message: `Phân độ GCS là "Tỉnh" nhưng điểm GCS nhập là ${score} (< 13 điểm).`,
        fieldKey: 'gcsScore',
        stepNumber: 2,
      });
    } else if (patient.neurologicalSymptoms.gcsCategory.startsWith('Mê') && score > 8) {
      issues.push({
        caseId: patient.id,
        caseCode: patient.caseCode,
        severity: 'warning',
        category: 'logic_conflict',
        message: `Phân độ GCS là "Mê" nhưng điểm GCS nhập là ${score} (> 8 điểm).`,
        fieldKey: 'gcsScore',
        stepNumber: 2,
      });
    }
  }

  // D. Lan ổ mắt (Chandler) vs Triệu chứng mắt
  const isChandlerComplication = patient.diseaseExtent.chandlerGroup !== 'Không lan ổ mắt (Nhóm 0)';
  const hasEyeSymptoms =
    patient.eyeSymptoms.ptosis === 'Có' ||
    patient.eyeSymptoms.proptosis === 'Có' ||
    patient.eyeSymptoms.visualLossOrDecrease === 'Có' ||
    patient.eyeSymptoms.ocularMobilityDisorder === 'Có';

  if (isChandlerComplication && !hasEyeSymptoms) {
    issues.push({
      caseId: patient.id,
      caseCode: patient.caseCode,
      severity: 'warning',
      category: 'logic_conflict',
      message: `Chẩn đoán biến chứng mắt "${patient.diseaseExtent.chandlerGroup}" nhưng tất cả triệu chứng mắt đều ghi nhận là "Không". Cần kiểm tra lại.`,
      fieldKey: 'eyeSymptoms',
      stepNumber: 3,
    });
  }

  // E. Sinh hiệu bất thường / Cảnh báo nguy kịch
  if (patient.vitalSigns.temperature && patient.vitalSigns.temperature >= 39.5) {
    issues.push({
      caseId: patient.id,
      caseCode: patient.caseCode,
      severity: 'warning',
      category: 'vital_outlier',
      message: `Nhiệt độ cao bất thường (${patient.vitalSigns.temperature}°C). Cần theo dõi nhiễm trùng huyết hoặc biến chứng nội sọ.`,
      fieldKey: 'temperature',
      stepNumber: 2,
    });
  }
  if (patient.vitalSigns.spo2 && patient.vitalSigns.spo2 < 90) {
    issues.push({
      caseId: patient.id,
      caseCode: patient.caseCode,
      severity: 'warning',
      category: 'vital_outlier',
      message: `SpO2 báo động giảm (${patient.vitalSigns.spo2}%).`,
      fieldKey: 'spo2',
      stepNumber: 2,
    });
  }

  // F. Cận lâm sàng bất thường
  if (patient.labResults.whiteBloodCells && patient.labResults.whiteBloodCells > 25) {
    issues.push({
      caseId: patient.id,
      caseCode: patient.caseCode,
      severity: 'warning',
      category: 'lab_outlier',
      message: `Bạch cầu tăng rất cao (${patient.labResults.whiteBloodCells} G/L).`,
      fieldKey: 'whiteBloodCells',
      stepNumber: 3,
    });
  }

  // 2. Missing Essential Variables Check (Tính độ hoàn thiện)
  const checklist = [
    { val: patient.caseCode, weight: 5, field: 'caseCode', name: 'Mã ca bệnh' },
    { val: patient.age, weight: 5, field: 'age', name: 'Tuổi' },
    { val: patient.gender, weight: 5, field: 'gender', name: 'Giới tính' },
    { val: patient.address, weight: 5, field: 'address', name: 'Địa chỉ' },
    { val: patient.occupation, weight: 5, field: 'occupation', name: 'Nghề nghiệp' },
    { val: patient.ethnicity, weight: 5, field: 'ethnicity', name: 'Dân tộc' },
    { val: patient.surgeryDate, weight: 5, field: 'surgeryDate', name: 'Ngày mổ' },
    { val: patient.primaryDiagnosis, weight: 5, field: 'primaryDiagnosis', name: 'Chẩn đoán' },
    { val: patient.admissionReasons?.length > 0, weight: 5, field: 'admissionReasons', name: 'Lý do vào viện' },
    { val: patient.symptomDurationDays !== null, weight: 5, field: 'symptomDurationDays', name: 'Thời gian khởi phát' },
    { val: patient.diseaseExtent.chandlerGroup, weight: 5, field: 'chandlerGroup', name: 'Phân độ Chandler ổ mắt' },
    { val: patient.diseaseExtent.cultureResult, weight: 5, field: 'cultureResult', name: 'Kết quả cấy vi sinh' },
    { val: patient.diseaseExtent.pathologyResult, weight: 5, field: 'pathologyResult', name: 'Kết quả giải phẫu bệnh' },
    { val: patient.treatmentFeatures.antibiotics, weight: 5, field: 'antibiotics', name: 'Kháng sinh điều trị' },
    { val: patient.treatmentFeatures.surgeryPerformed, weight: 5, field: 'surgeryPerformed', name: 'Phẫu thuật' },
    { val: patient.treatmentFeatures.treatmentDays !== null, weight: 5, field: 'treatmentDays', name: 'Số ngày điều trị' },
    { val: patient.treatmentFeatures.treatmentOutcome, weight: 5, field: 'treatmentOutcome', name: 'Kết quả điều trị' },
    { val: patient.treatmentFeatures.mortality, weight: 5, field: 'mortality', name: 'Tử vong' },
    { val: patient.labResults.whiteBloodCells !== null, weight: 5, field: 'whiteBloodCells', name: 'Bạch cầu' },
    { val: (patient.images.ctScanImages?.length || 0) + (patient.images.endoscopyImages?.length || 0) > 0, weight: 5, field: 'images', name: 'Hình ảnh CT hoặc Nội soi' },
  ];

  let completedWeight = 0;
  let missingRequiredCount = 0;

  for (const item of checklist) {
    if (item.val !== null && item.val !== undefined && item.val !== '' && item.val !== false) {
      completedWeight += item.weight;
    } else {
      missingRequiredCount++;
      // Only register as info/warning if not already covered
      if (item.field === 'cultureResult' || item.field === 'pathologyResult' || item.field === 'treatmentOutcome') {
        issues.push({
          caseId: patient.id,
          caseCode: patient.caseCode,
          severity: 'info',
          category: 'missing_field',
          message: `Chưa cập nhật "${item.name}".`,
          fieldKey: item.field,
          stepNumber: item.field === 'treatmentOutcome' ? 5 : 3,
        });
      }
    }
  }

  const completionPercentage = Math.min(100, Math.round(completedWeight));
  const inconsistencyCount = issues.filter((i) => i.severity === 'error' || i.category === 'logic_conflict').length;

  return {
    issues,
    completionPercentage,
    inconsistencyCount,
    missingRequiredCount,
  };
}
