import Dexie, { Table } from 'dexie';
import { PatientCase } from '../types/medical';
import { auditSingleCase, calculateLundMackayTotal } from '../utils/validationAudit';

export class RhinologDatabase extends Dexie {
  cases!: Table<PatientCase, string>;

  constructor() {
    super('RhinologOfflineDB');
    this.version(1).stores({
      cases: 'id, caseCode, surgeryDate, complexityGrade, address, gender, createdAt, updatedAt',
    });
  }
}

export const db = new RhinologDatabase();

// Pre-seeded sample case matching the user's screenshot
export const sampleCase1: PatientCase = {
  id: 'c1-nt1231231',
  caseCode: 'nt1231231',
  surgeryDate: '2026-10-04',
  createdAt: Date.now() - 3600 * 24 * 1000,
  updatedAt: Date.now(),
  syncedToCloud: true,

  age: 20,
  gender: 'Nam',
  address: 'TP HCM',
  ethnicity: 'Kinh',
  occupation: 'Học sinh, sinh viên',

  complexityGrade: 'Grade II — Nâng cao (sàng sau/bướm, Draf I/IIA)',
  primaryDiagnosis: 'Viêm xoang biến chứng mắt',
  surgeryType: 'Mở sàng trước',

  comorbidities: {
    hypertension: false,
    diabetes: false,
    tuberculosis: false,
    cancer: false,
    liverKidneyFailure: false,
    priorSinusSurgery: false,
    otherDiseases: '',
  },

  admissionReasons: ['Sưng mắt', 'Đau đầu', 'Nhìn mờ'],
  symptomDurationDays: 5,
  treatmentBeforeAdmission: 'Có điều trị',
  priorTreatmentDetails: 'Kháng sinh Augmentin 1g x 3 ngày tại phòng khám tư nhưng mắt sưng tăng dần',

  nasalSymptoms: {
    nasalObstruction: 'Có',
    rhinorrhea: 'Có',
    postNasalDrip: 'Có',
    thickSecretions: 'Có',
    hyposmiaOrAnosmia: 'Không',
    sneezing: 'Có',
  },

  eyeSymptoms: {
    ptosis: 'Có',
    proptosis: 'Có',
    visualLossOrDecrease: 'Có',
    ocularMobilityDisorder: 'Có',
  },

  neurologicalSymptoms: {
    gcsCategory: 'Tỉnh (GCS: 13-15 điểm)',
    gcsScore: 15,
    focalNeurologicalDeficit: 'Không',
    seizures: 'Không',
  },

  vitalSigns: {
    pulse: 88,
    temperature: 38.4,
    systolicBP: 120,
    spo2: 98,
  },

  labResults: {
    hemoglobin: 135,
    whiteBloodCells: 16.8,
    platelets: 280,
    sodium: 138,
    potassium: 4.1,
    creatinine: 0.9,
    crp: 64.5,
    glucose: 105,
    albumin: 38,
  },

  diseaseExtent: {
    laterality: '1 bên (Phải)',
    involvedSinuses: {
      maxillary: true,
      ethmoid: true,
      sphenoid: false,
      frontal: true,
    },
    chandlerGroup: 'Nhóm III: Áp xe dưới màng xương (dưới cốt mạc)',
    intracranialExtension: ['Không'],
    cultureResult: 'Tụ cầu vàng (S. aureus)',
    cultureBacteriaName: 'Staphylococcus aureus kháng Methicillin (MRSA)',
    pathologyResult: 'Mô viêm mãn tính',
  },

  lundMackay: {
    frontalR: 1,
    frontalL: 0,
    antEthmoidR: 2,
    antEthmoidL: 1,
    postEthmoidR: 2,
    postEthmoidL: 2,
    maxillaryR: 1,
    maxillaryL: 1,
    sphenoidR: 0,
    sphenoidL: 0,
    omcR: 0,
    omcL: 0,
  },
  totalLundMackayScore: 10,
  nasalPolypScoreR: 2,
  nasalPolypScoreL: 1,
  snot22Score: 48,

  treatmentFeatures: {
    antibiotics: 'Vancomycin + Ceftriaxone IV',
    surgeryPerformed: 'Có',
    surgeryCount: 1,
    intraoperativeFindings: {
      purulentSecretions: true,
      edemaMucosa: true,
      necrosisTissue: false,
      papyraceaBoneDestruction: true,
      otherFindings: 'Hủy xương giấy góc trên trong, mủ áp xe dưới màng xương chảy vào hốc mũi',
    },
    surgicalProcedures: ['FESS TOÀN BỘ XOANG', 'DRAF IIA (MỞ NGÁCH TRÁN)', 'DẪN LƯU ÁP XE DƯỚI MÀNG XƯƠNG'],
    treatmentDays: 10,
    treatmentOutcome: 'Cải thiện',
    mortality: 'Không',
    notes: 'Thị lực hồi phục hoàn toàn sau mổ ngày thứ 3, mắt hết lồi.',
  },

  images: {
    ctScanImages: [
      {
        id: 'img-ct-1',
        title: 'CT Scan Coronal - Tổn thương xoang hàm & ổ mắt phải',
        uploadedAt: Date.now() - 3600 * 20 * 1000,
        type: 'CT_SCAN',
        timing: 'PRE_OP',
        notes: 'Tiêu xương giấy phải, tụ dịch dưới màng xương đẩy lệch nhãn cầu',
        dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%230b111e"/><circle cx="200" cy="150" r="110" fill="none" stroke="%23334155" stroke-width="6"/><circle cx="150" cy="120" r="32" fill="%231e293b" stroke="%2364748b" stroke-width="2"/><circle cx="250" cy="120" r="32" fill="%231e293b" stroke="%2364748b" stroke-width="2"/><circle cx="150" cy="120" r="14" fill="%230284c7"/><circle cx="250" cy="120" r="14" fill="%230284c7"/><path d="M 215 110 Q 230 115 228 140 Q 220 145 215 125 Z" fill="%23f43f5e" opacity="0.85"/><text x="200" y="275" fill="%2394a3b8" font-size="13" text-anchor="middle" font-family="sans-serif">CT PARANASAL SINUSES CORONAL (MÔ PHỎNG LÂM SÀNG)</text></svg>',
      },
    ],
    endoscopyImages: [
      {
        id: 'img-endo-1',
        title: 'Nội soi mũi trước mổ - Khe giữa bên phải đầy mủ',
        uploadedAt: Date.now() - 3600 * 18 * 1000,
        type: 'ENDOSCOPY',
        timing: 'PRE_OP',
        notes: 'Niêm mạc cuốn giữa phù nề, mủ đặc tháo ra từ phức hợp lỗ ngách',
        dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23020617"/><circle cx="200" cy="150" r="130" fill="%23881337"/><circle cx="180" cy="140" r="70" fill="%239f1239"/><path d="M 170 120 Q 190 140 185 180 Q 160 170 170 120 Z" fill="%23fef08a" opacity="0.9"/><text x="200" y="280" fill="%23e2e8f0" font-size="13" text-anchor="middle" font-family="sans-serif">NASAL ENDOSCOPY BASELINE (MŨI PHẢI)</text></svg>',
      },
    ],
  },
};

export const sampleCase2: PatientCase = {
  id: 'c2-nt121124412',
  caseCode: 'NT121124412',
  surgeryDate: '2026-10-05',
  createdAt: Date.now() - 3600 * 12 * 1000,
  updatedAt: Date.now(),
  syncedToCloud: false,

  age: 51,
  gender: 'Nam',
  address: 'Tỉnh khác',
  provinceDetails: 'Đồng Nai',
  ethnicity: 'Kinh',
  occupation: 'Công nhân viên',

  complexityGrade: 'Grade II — Nâng cao (sàng sau/bướm, Draf I/IIA)',
  primaryDiagnosis: 'Viêm xoang biến chứng mắt',
  surgeryType: 'Mở sàng trước',

  comorbidities: {
    hypertension: true,
    diabetes: true,
    tuberculosis: false,
    cancer: false,
    liverKidneyFailure: false,
    priorSinusSurgery: false,
    otherDiseases: '',
  },

  admissionReasons: ['Sưng mắt', 'Đau đầu', 'Sụp mi, hạn chế vận nhãn'],
  symptomDurationDays: 7,
  treatmentBeforeAdmission: 'Không điều trị',

  nasalSymptoms: {
    nasalObstruction: 'Có',
    rhinorrhea: 'Có',
    postNasalDrip: 'Có',
    thickSecretions: 'Có',
    hyposmiaOrAnosmia: 'Có',
    sneezing: 'Không',
  },

  eyeSymptoms: {
    ptosis: 'Có',
    proptosis: 'Có',
    visualLossOrDecrease: 'Không',
    ocularMobilityDisorder: 'Có',
  },

  neurologicalSymptoms: {
    gcsCategory: 'Tỉnh (GCS: 13-15 điểm)',
    gcsScore: 15,
    focalNeurologicalDeficit: 'Không',
    seizures: 'Không',
  },

  vitalSigns: {
    pulse: 92,
    temperature: 38.7,
    systolicBP: 150,
    spo2: 97,
  },

  labResults: {
    hemoglobin: 142,
    whiteBloodCells: 18.5,
    platelets: 310,
    sodium: 135,
    potassium: 4.3,
    creatinine: 1.2,
    crp: 98.0,
    glucose: 185,
    albumin: 35,
  },

  diseaseExtent: {
    laterality: '1 bên (Phải)',
    involvedSinuses: {
      maxillary: true,
      ethmoid: true,
      sphenoid: true,
      frontal: false,
    },
    chandlerGroup: 'Nhóm II: Viêm mô tế bào ổ mắt',
    intracranialExtension: ['Không'],
    cultureResult: 'Không mọc',
    pathologyResult: 'Mô viêm mãn tính',
  },

  lundMackay: {
    frontalR: 0,
    frontalL: 0,
    antEthmoidR: 2,
    antEthmoidL: 0,
    postEthmoidR: 2,
    postEthmoidL: 0,
    maxillaryR: 2,
    maxillaryL: 0,
    sphenoidR: 1,
    sphenoidL: 0,
    omcR: 2,
    omcL: 0,
  },
  totalLundMackayScore: 7,
  nasalPolypScoreR: 1,
  nasalPolypScoreL: 0,
  snot22Score: 52,

  treatmentFeatures: {
    antibiotics: 'Ceftriaxone + Metronidazole',
    surgeryPerformed: 'Có',
    surgeryCount: 1,
    intraoperativeFindings: {
      purulentSecretions: true,
      edemaMucosa: true,
      necrosisTissue: false,
      papyraceaBoneDestruction: false,
    },
    surgicalProcedures: ['FESS GIỚI HẠN (SÀNG TRƯỚC–HÀM)'],
    treatmentDays: 7,
    treatmentOutcome: 'Cải thiện',
    mortality: 'Không',
  },

  images: {
    ctScanImages: [],
    endoscopyImages: [],
  },
};

// Seed initial database if empty
export async function initializeDatabase(): Promise<void> {
  const count = await db.cases.count();
  if (count === 0) {
    const case1Audit = auditSingleCase(sampleCase1);
    sampleCase1.auditStatus = {
      completionPercentage: case1Audit.completionPercentage,
      hasInconsistencies: case1Audit.inconsistencyCount > 0,
      inconsistencyCount: case1Audit.inconsistencyCount,
      missingRequiredCount: case1Audit.missingRequiredCount,
      issues: case1Audit.issues.map((i) => i.message),
      lastAuditedAt: Date.now(),
    };

    const case2Audit = auditSingleCase(sampleCase2);
    sampleCase2.auditStatus = {
      completionPercentage: case2Audit.completionPercentage,
      hasInconsistencies: case2Audit.inconsistencyCount > 0,
      inconsistencyCount: case2Audit.inconsistencyCount,
      missingRequiredCount: case2Audit.missingRequiredCount,
      issues: case2Audit.issues.map((i) => i.message),
      lastAuditedAt: Date.now(),
    };

    await db.cases.bulkAdd([sampleCase1, sampleCase2]);
  }
}

export function createBlankCase(): PatientCase {
  const newId = 'case-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const dateStr = new Date().toISOString().split('T')[0];
  const autoCode = 'NT' + dateStr.replace(/-/g, '').slice(2) + Math.floor(1000 + Math.random() * 9000);

  const blank: PatientCase = {
    id: newId,
    caseCode: autoCode,
    surgeryDate: dateStr,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    syncedToCloud: false,

    age: null,
    gender: 'Nam',
    address: 'TP HCM',
    ethnicity: 'Kinh',
    occupation: 'Công nhân viên',

    complexityGrade: 'Grade II — Nâng cao (sàng sau/bướm, Draf I/IIA)',
    primaryDiagnosis: 'Viêm xoang biến chứng mắt',
    surgeryType: 'Mở sàng trước',

    comorbidities: {
      hypertension: false,
      diabetes: false,
      tuberculosis: false,
      cancer: false,
      liverKidneyFailure: false,
      priorSinusSurgery: false,
      otherDiseases: '',
    },

    admissionReasons: ['Sưng mắt'],
    symptomDurationDays: null,
    treatmentBeforeAdmission: 'Không điều trị',

    nasalSymptoms: {
      nasalObstruction: 'Có',
      rhinorrhea: 'Có',
      postNasalDrip: 'Không',
      thickSecretions: 'Có',
      hyposmiaOrAnosmia: 'Không',
      sneezing: 'Không',
    },

    eyeSymptoms: {
      ptosis: 'Có',
      proptosis: 'Không',
      visualLossOrDecrease: 'Không',
      ocularMobilityDisorder: 'Không',
    },

    neurologicalSymptoms: {
      gcsCategory: 'Tỉnh (GCS: 13-15 điểm)',
      gcsScore: 15,
      focalNeurologicalDeficit: 'Không',
      seizures: 'Không',
    },

    vitalSigns: {
      pulse: null,
      temperature: null,
      systolicBP: null,
      spo2: null,
    },

    labResults: {
      hemoglobin: null,
      whiteBloodCells: null,
      platelets: null,
      sodium: null,
      potassium: null,
      creatinine: null,
      crp: null,
      glucose: null,
      albumin: null,
    },

    diseaseExtent: {
      laterality: '1 bên (Phải)',
      involvedSinuses: {
        maxillary: true,
        ethmoid: true,
        sphenoid: false,
        frontal: false,
      },
      chandlerGroup: 'Nhóm I: Viêm mô tế bào trước vách',
      intracranialExtension: ['Không'],
      cultureResult: 'Không mọc',
      pathologyResult: 'Mô viêm mãn tính',
    },

    lundMackay: {
      frontalR: 0,
      frontalL: 0,
      antEthmoidR: 1,
      antEthmoidL: 0,
      postEthmoidR: 0,
      postEthmoidL: 0,
      maxillaryR: 1,
      maxillaryL: 0,
      sphenoidR: 0,
      sphenoidL: 0,
      omcR: 0,
      omcL: 0,
    },
    totalLundMackayScore: 2,
    nasalPolypScoreR: 0,
    nasalPolypScoreL: 0,
    snot22Score: 0,

    treatmentFeatures: {
      antibiotics: '',
      surgeryPerformed: 'Có',
      surgeryCount: 1,
      intraoperativeFindings: {
        purulentSecretions: false,
        edemaMucosa: true,
        necrosisTissue: false,
        papyraceaBoneDestruction: false,
      },
      surgicalProcedures: ['FESS GIỚI HẠN (SÀNG TRƯỚC–HÀM)'],
      treatmentDays: null,
      treatmentOutcome: 'Cải thiện',
      mortality: 'Không',
    },

    images: {
      ctScanImages: [],
      endoscopyImages: [],
    },
  };

  blank.totalLundMackayScore = calculateLundMackayTotal(blank.lundMackay);
  const audit = auditSingleCase(blank);
  blank.auditStatus = {
    completionPercentage: audit.completionPercentage,
    hasInconsistencies: audit.inconsistencyCount > 0,
    inconsistencyCount: audit.inconsistencyCount,
    missingRequiredCount: audit.missingRequiredCount,
    issues: audit.issues.map((i) => i.message),
    lastAuditedAt: Date.now(),
  };

  return blank;
}
