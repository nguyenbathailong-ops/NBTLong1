import { auth } from '../firebase';
import { PatientCase } from '../types/medical';

export interface AiAnalysisResponse {
  analysis: string;
  model: string;
  generatedAt: number;
}

export function buildDeidentifiedAnalysisPayload(cases: PatientCase[]) {
  const totalCases = cases.length;
  const ages = cases.map((c) => c.age).filter((a): a is number => typeof a === 'number' && !Number.isNaN(a));
  const avgAge = ages.length > 0 ? Number((ages.reduce((s, a) => s + a, 0) / ages.length).toFixed(1)) : null;
  const minAge = ages.length > 0 ? Math.min(...ages) : null;
  const maxAge = ages.length > 0 ? Math.max(...ages) : null;

  const avgLundMackay =
    totalCases > 0
      ? Number((cases.reduce((s, c) => s + (c.totalLundMackayScore || 0), 0) / totalCases).toFixed(1))
      : 0;

  const days = cases
    .map((c) => c.treatmentFeatures.treatmentDays)
    .filter((d): d is number => typeof d === 'number' && !Number.isNaN(d));
  const avgTreatmentDays =
    days.length > 0 ? Number((days.reduce((s, d) => s + d, 0) / days.length).toFixed(1)) : null;

  const countBy = (getter: (c: PatientCase) => string) => {
    const map: Record<string, number> = {};
    for (const c of cases) {
      const k = getter(c) || 'Chưa ghi';
      map[k] = (map[k] || 0) + 1;
    }
    return map;
  };

  const summary = {
    totalCases,
    genderBreakdown: countBy((c) => c.gender),
    avgAge,
    minAge,
    maxAge,
    avgLundMackay,
    avgTreatmentDays,
    chandlerCounts: countBy((c) => c.diseaseExtent.chandlerGroup),
    cultureCounts: countBy((c) => c.diseaseExtent.cultureResult),
    pathologyCounts: countBy((c) => c.diseaseExtent.pathologyResult),
    outcomeCounts: countBy((c) => c.treatmentFeatures.treatmentOutcome),
    mortalityCount: cases.filter(
      (c) => c.treatmentFeatures.mortality === 'Có' || c.treatmentFeatures.treatmentOutcome === 'Tử vong'
    ).length,
    comorbiditiesCount: {
      hypertension: cases.filter((c) => c.comorbidities.hypertension).length,
      diabetes: cases.filter((c) => c.comorbidities.diabetes).length,
      tuberculosis: cases.filter((c) => c.comorbidities.tuberculosis).length,
      cancer: cases.filter((c) => c.comorbidities.cancer).length,
      liverKidneyFailure: cases.filter((c) => c.comorbidities.liverKidneyFailure).length,
      priorSinusSurgery: cases.filter((c) => c.comorbidities.priorSinusSurgery).length,
    },
  };

  // Strictly de-identified per-case clinical matrix (no patientName, no caseCode, no exact day, no images)
  const deidentifiedCases = cases.slice(0, 300).map((c, idx) => ({
    subjectId: `SUBJ_${String(idx + 1).padStart(4, '0')}`,
    surgeryYear: c.surgeryDate ? c.surgeryDate.slice(0, 4) : null,
    age: c.age,
    gender: c.gender,
    addressType: c.address,
    ethnicity: c.ethnicity,
    occupation: c.occupation,
    complexityGrade: c.complexityGrade,
    primaryDiagnosis: c.primaryDiagnosis,
    surgeryType: c.surgeryType,
    comorbidities: {
      hypertension: c.comorbidities.hypertension,
      diabetes: c.comorbidities.diabetes,
      tuberculosis: c.comorbidities.tuberculosis,
      cancer: c.comorbidities.cancer,
      liverKidneyFailure: c.comorbidities.liverKidneyFailure,
      priorSinusSurgery: c.comorbidities.priorSinusSurgery,
    },
    admissionReasons: c.admissionReasons,
    symptomDurationDays: c.symptomDurationDays,
    treatmentBeforeAdmission: c.treatmentBeforeAdmission,
    nasalSymptoms: c.nasalSymptoms,
    eyeSymptoms: c.eyeSymptoms,
    neurologicalSymptoms: c.neurologicalSymptoms,
    vitalSigns: c.vitalSigns,
    labResults: c.labResults,
    diseaseExtent: {
      laterality: c.diseaseExtent.laterality,
      involvedSinuses: c.diseaseExtent.involvedSinuses,
      chandlerGroup: c.diseaseExtent.chandlerGroup,
      intracranialExtension: c.diseaseExtent.intracranialExtension,
      cultureResult: c.diseaseExtent.cultureResult,
      pathologyResult: c.diseaseExtent.pathologyResult,
    },
    totalLundMackayScore: c.totalLundMackayScore,
    nasalPolypScoreR: c.nasalPolypScoreR,
    nasalPolypScoreL: c.nasalPolypScoreL,
    snot22Score: c.snot22Score ?? null,
    treatmentFeatures: {
      antibiotics: c.treatmentFeatures.antibiotics,
      antifungals: c.treatmentFeatures.antifungals || [],
      surgeryPerformed: c.treatmentFeatures.surgeryPerformed,
      surgeryCount: c.treatmentFeatures.surgeryCount,
      surgicalProcedures: c.treatmentFeatures.surgicalProcedures,
      intraoperativeFindings: {
        purulentSecretions: c.treatmentFeatures.intraoperativeFindings.purulentSecretions,
        edemaMucosa: c.treatmentFeatures.intraoperativeFindings.edemaMucosa,
        necrosisTissue: c.treatmentFeatures.intraoperativeFindings.necrosisTissue,
        papyraceaBoneDestruction: c.treatmentFeatures.intraoperativeFindings.papyraceaBoneDestruction,
      },
      treatmentDays: c.treatmentFeatures.treatmentDays,
      treatmentOutcome: c.treatmentFeatures.treatmentOutcome,
      mortality: c.treatmentFeatures.mortality,
      sequelae: c.treatmentFeatures.sequelae
        ? {
            ptosis: c.treatmentFeatures.sequelae.ptosis,
            proptosis: c.treatmentFeatures.sequelae.proptosis,
            visualLossOrDecrease: c.treatmentFeatures.sequelae.visualLossOrDecrease,
            ocularMobilityDisorder: c.treatmentFeatures.sequelae.ocularMobilityDisorder,
            diplopia: c.treatmentFeatures.sequelae.diplopia,
            focalNeurologicalDeficit: c.treatmentFeatures.sequelae.focalNeurologicalDeficit,
            seizures: c.treatmentFeatures.sequelae.seizures,
            meningitis: c.treatmentFeatures.sequelae.meningitis,
            brainAbscess: c.treatmentFeatures.sequelae.brainAbscess,
            csfLeak: c.treatmentFeatures.sequelae.csfLeak,
            cerebralInfarction: c.treatmentFeatures.sequelae.cerebralInfarction,
            otherSequelae: c.treatmentFeatures.sequelae.otherSequelae,
          }
        : null,
    },
  }));

  return {
    summary,
    cases: deidentifiedCases,
  };
}

export async function requestAdminAiAnalysis(
  question: string,
  cases: PatientCase[]
): Promise<AiAnalysisResponse> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Vui lòng đăng nhập bằng tài khoản Admin để sử dụng chế độ AI.');
  }

  const idToken = await currentUser.getIdToken();
  const dataset = buildDeidentifiedAnalysisPayload(cases);

  let response: Response;
  try {
    response = await fetch('/api/ai-analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        question: question.trim(),
        dataset,
      }),
    });
  } catch {
    throw new Error('Không thể kết nối tới máy chủ phân tích AI. Vui lòng kiểm tra Internet.');
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const errMsg =
      typeof data.error === 'string' && data.error
        ? data.error
        : `Yêu cầu phân tích AI thất bại (HTTP ${response.status}).`;
    throw new Error(errMsg);
  }

  if (typeof data.analysis !== 'string' || !data.analysis) {
    throw new Error('Dữ liệu phản hồi từ máy chủ AI không hợp lệ.');
  }

  return {
    analysis: data.analysis,
    model: typeof data.model === 'string' ? data.model : 'gemini-4-hydrogen',
    generatedAt: typeof data.generatedAt === 'number' ? data.generatedAt : Date.now(),
  };
}
