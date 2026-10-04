import React from 'react';
import {
  PatientCase,
  ChandlerGrade,
  CultureResult,
  PathologyResult,
  IntracranialSpread,
} from '../../types/medical';
import { LundMackayDiagram } from './LundMackayDiagram';
import { calculateLundMackayTotal } from '../../utils/validationAudit';
import { FlaskConical, Eye, Layers } from 'lucide-react';

interface StepPreOpLabCTProps {
  data: PatientCase;
  onChange: (updates: Partial<PatientCase>) => void;
}

export const StepPreOpLabCT: React.FC<StepPreOpLabCTProps> = ({ data, onChange }) => {
  const chandlerOptions: ChandlerGrade[] = [
    'Không lan ổ mắt (Nhóm 0)',
    'Nhóm I: Viêm mô tế bào trước vách',
    'Nhóm II: Viêm mô tế bào ổ mắt',
    'Nhóm III: Áp xe dưới màng xương (dưới cốt mạc)',
    'Nhóm IV: Áp xe ổ mắt',
    'Nhóm V: Viêm tắc xoang hang',
  ];

  const intracranialOptions: IntracranialSpread[] = [
    'Viêm màng não',
    'Áp xe ngoài màng cứng',
    'Áp xe dưới màng cứng',
    'Áp xe não',
  ];

  const cultureOptions: CultureResult[] = [
    'Không mọc',
    'Tụ cầu vàng (S. aureus)',
    'Phế cầu (S. pneumoniae)',
    'Pseudomonas aeruginosa',
    'Nấm Aspergillus',
    'Nấm Mucor / Rhizopus',
    'Vi khuẩn khác',
  ];

  const pathologyOptions: PathologyResult[] = [
    'Mô viêm mãn tính',
    'Nhiễm nấm xâm lấn',
    'Polyp mũi xoang lành tính',
    'U nhú đảo ngược',
    'Khác',
  ];

  const toggleIntracranial = (item: IntracranialSpread) => {
    let current: IntracranialSpread[] = [...data.diseaseExtent.intracranialExtension].filter((x) => x !== 'Không');
    if (current.includes(item)) {
      current = current.filter((x) => x !== item);
    } else {
      current.push(item);
    }
    if (current.length === 0) {
      current = ['Không'];
    }
    onChange({
      diseaseExtent: {
        ...data.diseaseExtent,
        intracranialExtension: current,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. LUND-MACKAY CT DIAGRAM */}
      <LundMackayDiagram
        score={data.lundMackay}
        onChange={(newScore) => {
          const total = calculateLundMackayTotal(newScore);
          onChange({
            lundMackay: newScore,
            totalLundMackayScore: total,
          });
        }}
      />

      {/* 2. NASAL POLYP SCORE (0-8) & SNOT-22 */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            SỐ ĐO NỘI SOI & BỆNH NHÂN TỰ BÁO (PROM)
          </h3>
          <span className="text-xs text-teal-400 font-mono font-medium">
            NPS: {data.nasalPolypScoreR + data.nasalPolypScoreL}/8
          </span>
        </div>

        {/* Nasal Polyp Score Table */}
        <div className="space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">
            NASAL POLYP SCORE (NPS: 0–8)
          </span>
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phải */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">PHẢI (0–4):</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onChange({ nasalPolypScoreR: v })}
                      className={`w-7 h-7 rounded text-xs font-bold transition ${
                        data.nasalPolypScoreR === v
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trái */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">TRÁI (0–4):</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onChange({ nasalPolypScoreL: v })}
                      className={`w-7 h-7 rounded text-xs font-bold transition ${
                        data.nasalPolypScoreL === v
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SNOT-22 */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs text-slate-300 font-medium">
              Điểm triệu chứng SNOT-22 (0 = tốt, 110 = rất nặng):
            </span>
            <p className="text-[11px] text-slate-500">
              Đánh giá chất lượng cuộc sống mũi xoang theo chuẩn quốc tế
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={110}
              value={data.snot22Score ?? ''}
              onChange={(e) =>
                onChange({
                  snot22Score: e.target.value ? parseInt(e.target.value) : 0,
                })
              }
              placeholder="0–110"
              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-center text-emerald-400 font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* 3. MỨC ĐỘ LAN RỘNG CỦA BỆNH (Bảng 4 trong ảnh) */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          MỨC ĐỘ LAN RỘNG CỦA BỆNH (Ổ MẮT & NỘI SỌ)
        </h3>

        {/* Số bên & Các xoang cạnh mũi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Số bên tổn thương:
            </label>
            <select
              value={data.diseaseExtent.laterality}
              onChange={(e) =>
                onChange({
                  diseaseExtent: {
                    ...data.diseaseExtent,
                    laterality: e.target.value as any,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="1 bên (Phải)">1 bên (Phải)</option>
              <option value="1 bên (Trái)">1 bên (Trái)</option>
              <option value="2 bên">2 bên</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Các xoang cạnh mũi tổn thương:
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { key: 'maxillary', label: 'Xoang hàm' },
                { key: 'ethmoid', label: 'Xoang sàng' },
                { key: 'sphenoid', label: 'Xoang bướm' },
                { key: 'frontal', label: 'Xoang trán' },
              ].map((s) => {
                const checked = data.diseaseExtent.involvedSinuses[s.key as keyof typeof data.diseaseExtent.involvedSinuses];
                return (
                  <label
                    key={s.key}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium cursor-pointer transition select-none ${
                      checked
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={(e) =>
                        onChange({
                          diseaseExtent: {
                            ...data.diseaseExtent,
                            involvedSinuses: {
                              ...data.diseaseExtent.involvedSinuses,
                              [s.key]: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    {s.label}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lan vào mắt/ổ mắt (Chandler I - V) */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Lan vào mắt / ổ mắt (theo phân độ Chandler):
          </label>
          <select
            value={data.diseaseExtent.chandlerGroup}
            onChange={(e) =>
              onChange({
                diseaseExtent: {
                  ...data.diseaseExtent,
                  chandlerGroup: e.target.value as ChandlerGrade,
                },
              })
            }
            className="w-full bg-[#070b14] border border-cyan-800/80 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-cyan-300 font-medium"
          >
            {chandlerOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Lan vào nội sọ */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-medium text-slate-400">
            Lan vào nội sọ (chọn nếu có):
          </label>
          <div className="flex flex-wrap gap-2">
            {intracranialOptions.map((opt) => {
              const active = data.diseaseExtent.intracranialExtension.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleIntracranial(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    active
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/60'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cấy vi sinh & Giải phẫu bệnh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Kết quả cấy vi sinh / nấm:
            </label>
            <select
              value={data.diseaseExtent.cultureResult}
              onChange={(e) =>
                onChange({
                  diseaseExtent: {
                    ...data.diseaseExtent,
                    cultureResult: e.target.value as CultureResult,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              {cultureOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {data.diseaseExtent.cultureResult !== 'Không mọc' && (
              <input
                type="text"
                placeholder="Tên vi khuẩn/nấm cụ thể & kháng sinh đồ..."
                value={data.diseaseExtent.cultureBacteriaName || ''}
                onChange={(e) =>
                  onChange({
                    diseaseExtent: {
                      ...data.diseaseExtent,
                      cultureBacteriaName: e.target.value,
                    },
                  })
                }
                className="mt-1.5 w-full bg-[#070b14] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Kết quả giải phẫu bệnh:
            </label>
            <select
              value={data.diseaseExtent.pathologyResult}
              onChange={(e) =>
                onChange({
                  diseaseExtent: {
                    ...data.diseaseExtent,
                    pathologyResult: e.target.value as PathologyResult,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              {pathologyOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. XÉT NGHIỆM MÁU & CẬN LÂM SÀNG CẤP CỨU */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          KẾT QUẢ XÉT NGHIỆM MÁU
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Hemoglobin (g/L)</label>
            <input
              type="number"
              placeholder="VD: 135"
              value={data.labResults.hemoglobin ?? ''}
              onChange={(e) =>
                onChange({
                  labResults: {
                    ...data.labResults,
                    hemoglobin: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Bạch cầu (G/L)</label>
            <input
              type="number"
              step="0.1"
              placeholder="VD: 16.5"
              value={data.labResults.whiteBloodCells ?? ''}
              onChange={(e) =>
                onChange({
                  labResults: {
                    ...data.labResults,
                    whiteBloodCells: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              className={`w-full bg-[#070b14] border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 ${
                data.labResults.whiteBloodCells && data.labResults.whiteBloodCells > 20
                  ? 'border-amber-500 text-amber-300'
                  : 'border-slate-800'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Tiểu cầu (G/L)</label>
            <input
              type="number"
              placeholder="VD: 280"
              value={data.labResults.platelets ?? ''}
              onChange={(e) =>
                onChange({
                  labResults: {
                    ...data.labResults,
                    platelets: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Natri (mmol/L)</label>
            <input
              type="number"
              step="0.1"
              placeholder="VD: 138"
              value={data.labResults.sodium ?? ''}
              onChange={(e) =>
                onChange({
                  labResults: {
                    ...data.labResults,
                    sodium: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Kali (mmol/L)</label>
            <input
              type="number"
              step="0.1"
              placeholder="VD: 4.1"
              value={data.labResults.potassium ?? ''}
              onChange={(e) =>
                onChange({
                  labResults: {
                    ...data.labResults,
                    potassium: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Creatinine (mg/dL)</label>
            <input
              type="number"
              step="0.01"
              placeholder="VD: 0.9"
              value={data.labResults.creatinine ?? ''}
              onChange={(e) =>
                onChange({
                  labResults: {
                    ...data.labResults,
                    creatinine: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">CRP (mg/L)</label>
            <input
              type="number"
              step="0.1"
              placeholder="VD: 45"
              value={data.labResults.crp ?? ''}
              onChange={(e) =>
                onChange({
                  labResults: {
                    ...data.labResults,
                    crp: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Glucose (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              placeholder="VD: 110"
              value={data.labResults.glucose ?? ''}
              onChange={(e) =>
                onChange({
                  labResults: {
                    ...data.labResults,
                    glucose: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Albumin (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              placeholder="VD: 38"
              value={data.labResults.albumin ?? ''}
              onChange={(e) =>
                onChange({
                  labResults: {
                    ...data.labResults,
                    albumin: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
