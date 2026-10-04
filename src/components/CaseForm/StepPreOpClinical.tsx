import React from 'react';
import { PatientCase, YesNo, GCSStatus, TreatmentBeforeAdmission } from '../../types/medical';
import { AlertTriangle, Activity } from 'lucide-react';

interface StepPreOpClinicalProps {
  data: PatientCase;
  onChange: (updates: Partial<PatientCase>) => void;
}

export const StepPreOpClinical: React.FC<StepPreOpClinicalProps> = ({ data, onChange }) => {
  const admissionReasonOptions = [
    'Sưng mắt',
    'Đau đầu',
    'Nhìn mờ',
    'Nhìn đôi (song thị)',
    'Sụp mi, hạn chế vận nhãn',
    'Nghẹt mũi, chảy mủ hôi',
    'Sốt cao',
  ];

  const toggleAdmissionReason = (reason: string) => {
    const current = data.admissionReasons || [];
    const next = current.includes(reason)
      ? current.filter((r) => r !== reason)
      : [...current, reason];
    onChange({ admissionReasons: next });
  };

  const renderYesNoToggle = (
    label: string,
    currentValue: YesNo,
    onSelect: (val: YesNo) => void
  ) => {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800">
        <span className="text-xs text-slate-300 font-medium">{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelect('Có')}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              currentValue === 'Có'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            Có
          </button>
          <button
            type="button"
            onClick={() => onSelect('Không')}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              currentValue === 'Không'
                ? 'bg-slate-700 text-slate-200 border border-slate-600'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            Không
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Bệnh lý đi kèm */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-cyan-400 rounded-xs" />
          BỆNH LÝ ĐI KÈM (TIỀN CĂN)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: 'hypertension', label: 'Tăng huyết áp' },
            { key: 'diabetes', label: 'Đái tháo đường' },
            { key: 'tuberculosis', label: 'Lao' },
            { key: 'cancer', label: 'Ung thư' },
            { key: 'liverKidneyFailure', label: 'Suy gan/thận' },
            { key: 'priorSinusSurgery', label: 'Tiền căn mổ mũi xoang' },
          ].map((item) => {
            const isChecked = data.comorbidities[item.key as keyof typeof data.comorbidities] as boolean;
            return (
              <label
                key={item.key}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium cursor-pointer transition select-none ${
                  isChecked
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) =>
                    onChange({
                      comorbidities: {
                        ...data.comorbidities,
                        [item.key]: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>
        <div>
          <input
            type="text"
            placeholder="Các bệnh lý khác (vd: Tăng huyết áp, hen suyễn, suy giảm miễn dịch...)"
            value={data.comorbidities.otherDiseases}
            onChange={(e) =>
              onChange({
                comorbidities: {
                  ...data.comorbidities,
                  otherDiseases: e.target.value,
                },
              })
            }
            className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-400"
          />
        </div>
      </div>

      {/* 2. Lý do vào viện & Khởi phát */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-teal-400 rounded-xs" />
          LÝ DO VÀO VIỆN & BỆNH SỬ
        </h3>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Lý do vào viện chính (chọn nhiều):
          </label>
          <div className="flex flex-wrap gap-2">
            {admissionReasonOptions.map((reason) => {
              const active = data.admissionReasons?.includes(reason);
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => toggleAdmissionReason(reason)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    active
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/60'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {reason}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Thời gian có triệu chứng đến khi nhập viện (Số ngày):
            </label>
            <input
              type="number"
              min={0}
              placeholder="VD: 5"
              value={data.symptomDurationDays ?? ''}
              onChange={(e) =>
                onChange({
                  symptomDurationDays: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Điều trị trước nhập viện:
            </label>
            <select
              value={data.treatmentBeforeAdmission}
              onChange={(e) =>
                onChange({
                  treatmentBeforeAdmission: e.target.value as TreatmentBeforeAdmission,
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              <option value="Không điều trị">Không điều trị</option>
              <option value="Có điều trị">Có điều trị</option>
            </select>
          </div>
        </div>

        {data.treatmentBeforeAdmission === 'Có điều trị' && (
          <div>
            <input
              type="text"
              placeholder="Chi tiết thuốc / nơi điều trị trước (vd: Kháng sinh uống Augmentin, thuốc nhỏ mũi...)"
              value={data.priorTreatmentDetails || ''}
              onChange={(e) => onChange({ priorTreatmentDetails: e.target.value })}
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-teal-400"
            />
          </div>
        )}
      </div>

      {/* 3. Triệu chứng cơ năng Mũi Xoang & Mắt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mũi xoang */}
        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-1 border-b border-slate-800">
            TRIỆU CHỨNG MŨI XOANG
          </h4>
          <div className="space-y-1.5 pt-1">
            {renderYesNoToggle('Nghẹt mũi', data.nasalSymptoms.nasalObstruction, (v) =>
              onChange({ nasalSymptoms: { ...data.nasalSymptoms, nasalObstruction: v } })
            )}
            {renderYesNoToggle('Chảy mũi', data.nasalSymptoms.rhinorrhea, (v) =>
              onChange({ nasalSymptoms: { ...data.nasalSymptoms, rhinorrhea: v } })
            )}
            {renderYesNoToggle('Chảy mũi sau (đờm xuống họng)', data.nasalSymptoms.postNasalDrip, (v) =>
              onChange({ nasalSymptoms: { ...data.nasalSymptoms, postNasalDrip: v } })
            )}
            {renderYesNoToggle('Dịch mũi đặc', data.nasalSymptoms.thickSecretions, (v) =>
              onChange({ nasalSymptoms: { ...data.nasalSymptoms, thickSecretions: v } })
            )}
            {renderYesNoToggle('Giảm/mất khứu giác hoặc vị giác', data.nasalSymptoms.hyposmiaOrAnosmia, (v) =>
              onChange({ nasalSymptoms: { ...data.nasalSymptoms, hyposmiaOrAnosmia: v } })
            )}
            {renderYesNoToggle('Hắt hơi', data.nasalSymptoms.sneezing, (v) =>
              onChange({ nasalSymptoms: { ...data.nasalSymptoms, sneezing: v } })
            )}
          </div>
        </div>

        {/* Triệu chứng mắt */}
        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-1 border-b border-slate-800">
            TRIỆU CHỨNG MẮT (BIẾN CHỨNG Ổ MẮT)
          </h4>
          <div className="space-y-1.5 pt-1">
            {renderYesNoToggle('Sụp mi', data.eyeSymptoms.ptosis, (v) =>
              onChange({ eyeSymptoms: { ...data.eyeSymptoms, ptosis: v } })
            )}
            {renderYesNoToggle('Lồi mắt', data.eyeSymptoms.proptosis, (v) =>
              onChange({ eyeSymptoms: { ...data.eyeSymptoms, proptosis: v } })
            )}
            {renderYesNoToggle('Mất hoặc giảm thị lực', data.eyeSymptoms.visualLossOrDecrease, (v) =>
              onChange({ eyeSymptoms: { ...data.eyeSymptoms, visualLossOrDecrease: v } })
            )}
            {renderYesNoToggle('Rối loạn vận nhãn (nhìn đôi)', data.eyeSymptoms.ocularMobilityDisorder, (v) =>
              onChange({ eyeSymptoms: { ...data.eyeSymptoms, ocularMobilityDisorder: v } })
            )}
          </div>
        </div>
      </div>

      {/* 4. Triệu chứng thần kinh & Sinh hiệu */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          TRIỆU CHỨNG THẦN KINH & SINH HIỆU LÚC NHẬP VIỆN
        </h3>

        {/* Thần kinh row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Thang điểm Glasgow (GCS):
            </label>
            <select
              value={data.neurologicalSymptoms.gcsCategory}
              onChange={(e) =>
                onChange({
                  neurologicalSymptoms: {
                    ...data.neurologicalSymptoms,
                    gcsCategory: e.target.value as GCSStatus,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="Tỉnh (GCS: 13-15 điểm)">Tỉnh (GCS: 13–15 điểm)</option>
              <option value="Lơ mơ (GCS: 9-12 điểm)">Lơ mơ (GCS: 9–12 điểm)</option>
              <option value="Mê (GCS: 3-8 điểm)">Mê (GCS: 3–8 điểm)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Dấu thần kinh định vị:
            </label>
            <select
              value={data.neurologicalSymptoms.focalNeurologicalDeficit}
              onChange={(e) =>
                onChange({
                  neurologicalSymptoms: {
                    ...data.neurologicalSymptoms,
                    focalNeurologicalDeficit: e.target.value as YesNo,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="Không">Không</option>
              <option value="Có">Có</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Co giật:
            </label>
            <select
              value={data.neurologicalSymptoms.seizures}
              onChange={(e) =>
                onChange({
                  neurologicalSymptoms: {
                    ...data.neurologicalSymptoms,
                    seizures: e.target.value as YesNo,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="Không">Không</option>
              <option value="Có">Có</option>
            </select>
          </div>
        </div>

        {/* Sinh hiệu row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Mạch (Lần/phút):
            </label>
            <input
              type="number"
              placeholder="VD: 88"
              value={data.vitalSigns.pulse ?? ''}
              onChange={(e) =>
                onChange({
                  vitalSigns: {
                    ...data.vitalSigns,
                    pulse: e.target.value ? parseInt(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nhiệt độ (°C):
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="VD: 38.5"
              value={data.vitalSigns.temperature ?? ''}
              onChange={(e) =>
                onChange({
                  vitalSigns: {
                    ...data.vitalSigns,
                    temperature: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              className={`w-full bg-[#070b14] border rounded-lg px-3 py-1.5 text-xs text-slate-200 ${
                data.vitalSigns.temperature && data.vitalSigns.temperature >= 39
                  ? 'border-amber-500 text-amber-300'
                  : 'border-slate-800'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              HA tâm thu (mmHg):
            </label>
            <input
              type="number"
              placeholder="VD: 120"
              value={data.vitalSigns.systolicBP ?? ''}
              onChange={(e) =>
                onChange({
                  vitalSigns: {
                    ...data.vitalSigns,
                    systolicBP: e.target.value ? parseInt(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              SpO2 (%):
            </label>
            <input
              type="number"
              placeholder="VD: 98"
              value={data.vitalSigns.spo2 ?? ''}
              onChange={(e) =>
                onChange({
                  vitalSigns: {
                    ...data.vitalSigns,
                    spo2: e.target.value ? parseInt(e.target.value) : null,
                  },
                })
              }
              className={`w-full bg-[#070b14] border rounded-lg px-3 py-1.5 text-xs text-slate-200 ${
                data.vitalSigns.spo2 && data.vitalSigns.spo2 < 95
                  ? 'border-amber-500 text-amber-300'
                  : 'border-slate-800'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
