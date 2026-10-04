export type Gender = 'Nam' | 'Nữ';
export type AddressType = 'TP HCM' | 'Tỉnh khác';
export type Ethnicity = 'Kinh' | 'Dân tộc khác';
export type Occupation = 'Công nhân viên' | 'Nội trợ' | 'Học sinh, sinh viên' | 'Nông dân' | 'Buôn bán' | 'Khác';

export type ComplexityGrade = 'Grade I — Cơ bản' | 'Grade II — Nâng cao (sàng sau/bướm, Draf I/IIA)' | 'Grade III — Phức tạp (Draf IIB/III, u sàng sọ)' | 'Grade IV — Rất phức tạp (sàn sọ, mạch máu lớn)';

export type YesNo = 'Có' | 'Không';

export type TreatmentBeforeAdmission = 'Có điều trị' | 'Không điều trị';

export type GCSStatus = 'Tỉnh (GCS: 13-15 điểm)' | 'Lơ mơ (GCS: 9-12 điểm)' | 'Mê (GCS: 3-8 điểm)';

export type ChandlerGrade = 
  | 'Không lan ổ mắt (Nhóm 0)'
  | 'Nhóm I: Viêm mô tế bào trước vách'
  | 'Nhóm II: Viêm mô tế bào ổ mắt'
  | 'Nhóm III: Áp xe dưới màng xương (dưới cốt mạc)'
  | 'Nhóm IV: Áp xe ổ mắt'
  | 'Nhóm V: Viêm tắc xoang hang';

export type IntracranialSpread = 'Không' | 'Viêm màng não' | 'Áp xe dưới màng cứng' | 'Áp xe ngoài màng cứng' | 'Áp xe não';

export type CultureResult = 'Không mọc' | 'Tụ cầu vàng (S. aureus)' | 'Phế cầu (S. pneumoniae)' | 'Pseudomonas aeruginosa' | 'Nấm Aspergillus' | 'Nấm Mucor / Rhizopus' | 'Vi khuẩn khác';

export type PathologyResult = 'Mô viêm mãn tính' | 'Nhiễm nấm xâm lấn' | 'Polyp mũi xoang lành tính' | 'U nhú đảo ngược' | 'Khác';

export type TreatmentOutcome = 'Không thay đổi' | 'Cải thiện' | 'Nặng thêm';

// Lund-Mackay CT anatomy
export interface LundMackayScore {
  frontalR: number; // 0, 1, 2
  frontalL: number;
  antEthmoidR: number;
  antEthmoidL: number;
  postEthmoidR: number;
  postEthmoidL: number;
  maxillaryR: number;
  maxillaryL: number;
  sphenoidR: number;
  sphenoidL: number;
  omcR: number; // 0 or 2
  omcL: number; // 0 or 2
}

// Medical Case record covering all 5 research variable tables
export interface PatientCase {
  id: string; // Internal UUID
  caseCode: string; // Mã ca gia định danh (e.g. NT121124412)
  surgeryDate: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  syncedToCloud?: boolean;

  // Bảng 1: Đặc điểm dịch tễ
  age: number | null; // Tuổi (Định lượng: Năm)
  gender: Gender;
  address: AddressType;
  provinceDetails?: string; // Ghi chú tỉnh thành nếu Tỉnh khác
  ethnicity: Ethnicity;
  occupation: Occupation;

  // Bảng 2 & 1: Phân loại ca
  complexityGrade: ComplexityGrade;
  primaryDiagnosis: string; // Chẩn đoán
  surgeryType: string; // Loại phẫu thuật chính

  // Bảng 2: Tiền sử & Lâm sàng
  comorbidities: {
    hypertension: boolean; // Tăng huyết áp
    diabetes: boolean; // Đái tháo đường
    tuberculosis: boolean; // Lao
    cancer: boolean; // Ung thư
    liverKidneyFailure: boolean; // Suy gan/thận
    priorSinusSurgery: boolean; // Tiền căn phẫu thuật mũi xoang
    otherDiseases: string; // Các bệnh lý khác
  };

  admissionReasons: string[]; // Sưng mắt, Đau đầu, Nhìn mờ, Nhìn đôi, Sụp mi, Hạn chế vận nhãn...
  symptomDurationDays: number | null; // Thời gian có triệu chứng đến khi nhập viện (ngày)
  treatmentBeforeAdmission: TreatmentBeforeAdmission;
  priorTreatmentDetails?: string;

  // Triệu chứng mũi xoang (Có, Không)
  nasalSymptoms: {
    nasalObstruction: YesNo; // Nghẹt mũi
    rhinorrhea: YesNo; // Chảy mũi
    postNasalDrip: YesNo; // Chảy mũi sau
    thickSecretions: YesNo; // Dịch mũi đặc
    hyposmiaOrAnosmia: YesNo; // Giảm hoặc mất khứu giác / vị giác
    sneezing: YesNo; // Hắt hơi
  };

  // Bảng 3: Triệu chứng mắt & Thần kinh
  eyeSymptoms: {
    ptosis: YesNo; // Sụp mi
    proptosis: YesNo; // Lồi mắt
    visualLossOrDecrease: YesNo; // Mất/giảm thị lực
    ocularMobilityDisorder: YesNo; // Rối loạn vận nhãn
  };

  neurologicalSymptoms: {
    gcsCategory: GCSStatus; // GCS: Tỉnh, Lơ mơ, Mê
    gcsScore?: number; // 3 - 15
    focalNeurologicalDeficit: YesNo; // Dấu thần kinh định vị
    seizures: YesNo; // Co giật
  };

  // Sinh hiệu lúc nhập viện
  vitalSigns: {
    pulse: number | null; // Mạch (lần/phút)
    temperature: number | null; // Nhiệt độ (°C)
    systolicBP: number | null; // HA tâm thu (mmHg)
    spo2: number | null; // SpO2 (%)
  };

  // Xét nghiệm máu
  labResults: {
    hemoglobin: number | null; // g/L
    whiteBloodCells: number | null; // G/L
    platelets: number | null; // G/L
    sodium: number | null; // mmol/L
    potassium: number | null; // mmol/L
    creatinine: number | null; // mg/dL
    crp: number | null; // mg/L
    glucose: number | null; // mg/dL
    albumin: number | null; // mg/dL
  };

  // Bảng 4: Mức độ lan rộng của bệnh
  diseaseExtent: {
    laterality: '1 bên (Phải)' | '1 bên (Trái)' | '2 bên';
    involvedSinuses: {
      maxillary: boolean; // Xoang hàm
      ethmoid: boolean; // Xoang sàng
      sphenoid: boolean; // Xoang bướm
      frontal: boolean; // Xoang trán
    };
    chandlerGroup: ChandlerGrade; // Lan vào mắt/ổ mắt
    intracranialExtension: IntracranialSpread[]; // Lan vào nội sọ
    cultureResult: CultureResult;
    cultureBacteriaName?: string; // Tên chi tiết
    pathologyResult: PathologyResult;
    pathologyDetails?: string;
  };

  // Sơ đồ thang điểm chuyên sâu
  lundMackay: LundMackayScore;
  totalLundMackayScore: number; // 0 - 24
  nasalPolypScoreR: number; // 0 - 4
  nasalPolypScoreL: number; // 0 - 4
  snot22Score?: number; // 0 - 110

  // Bảng 5: Đặc điểm điều trị & Tiên lượng
  treatmentFeatures: {
    antibiotics: string; // Loại kháng sinh hoặc kháng nấm
    surgeryPerformed: YesNo; // Phẫu thuật: Có / Không
    surgeryCount: number | null; // Số lần phẫu thuật
    intraoperativeFindings: {
      purulentSecretions: boolean; // Nhầy mủ
      edemaMucosa: boolean; // Phù nề
      necrosisTissue: boolean; // Hoại tử
      papyraceaBoneDestruction: boolean; // Hủy xương giấy
      otherFindings?: string;
    };
    surgicalProcedures: string[]; // FESS giới hạn, FESS toàn bộ, Draf IIA, v.v.
    treatmentDays: number | null; // Số ngày điều trị
    treatmentOutcome: TreatmentOutcome; // Không thay đổi, cải thiện, nặng thêm
    mortality: YesNo; // Tử vong: Có / Không
    notes?: string;
  };

  // Hình ảnh lâm sàng & CT
  images: {
    ctScanImages: ClinicalImage[];
    endoscopyImages: ClinicalImage[];
  };

  // Metadata đối soát
  auditStatus?: {
    completionPercentage: number;
    hasInconsistencies: boolean;
    inconsistencyCount: number;
    missingRequiredCount: number;
    issues: string[];
    lastAuditedAt: number;
  };
}

export interface ClinicalImage {
  id: string;
  dataUrl: string; // Base64 data
  title?: string;
  uploadedAt: number;
  type: 'CT_SCAN' | 'ENDOSCOPY';
  timing: 'PRE_OP' | 'POST_OP';
  notes?: string;
}

export interface AuditIssue {
  caseId: string;
  caseCode: string;
  severity: 'error' | 'warning' | 'info';
  category: 'logic_conflict' | 'missing_field' | 'vital_outlier' | 'lab_outlier';
  message: string;
  fieldKey: string;
  stepNumber: number;
}
