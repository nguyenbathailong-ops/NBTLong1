import React from 'react';
import { PatientCase, YesNo } from '../../types/medical';
import { Syringe, Scissors, CheckSquare } from 'lucide-react';

interface StepIntraOpProps {
  data: PatientCase;
  onChange: (updates: Partial<PatientCase>) => void;
}

export const StepIntraOp: React.FC<StepIntraOpProps> = ({ data, onChange }) => {
  const quickProcedures = [
    'FESS GIỚI HẠN (SÀNG TRƯỚC–HÀM)',
    'FESS TOÀN BỘ XOANG',
    'DRAF IIA (MỞ NGÁCH TRÁN)',
    'DRAF IIB',
    'DRAF III (MODIFIED LOTHROP)',
    'CHỈNH HÌNH VÁCH NGĂN',
    'SÀN SỌ / VÁ RÒ DNT',
    'U MŨI XOANG / SÀN SỌ',
    'CA MỔ LẠI (REVISION)',
    'DẪN LƯU ÁP XE DƯỚI MÀNG XƯƠNG',
    'GIẢI ÁP Ổ MẮT / GIẢI ÁP THẦN KINH THỊ',
  ];

  const commonAntibiotics = [
    'Vancomycin + Ceftriaxone',
    'Augmentin 1.2g IV + Metronidazole',
    'Meropenem + Vancomycin',
    'Ceftazidime + Amikacin',
    'Amphotericin B (Kháng nấm)',
    'Voriconazole (Kháng nấm)',
    'Khác',
  ];

  const toggleProcedure = (proc: string) => {
    const current = data.treatmentFeatures.surgicalProcedures || [];
    const next = current.includes(proc)
      ? current.filter((p) => p !== proc)
      : [...current, proc];
    onChange({
      treatmentFeatures: {
        ...data.treatmentFeatures,
        surgicalProcedures: next,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Phân loại thủ thuật phẫu thuật (Giao diện giống Rhinolog) */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              PHÂN LOẠI CA
            </span>
            <span className="rounded bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-300">
              CHỌN NHANH · NHIỀU LỰA CHỌN
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Chạm để chọn <strong>nhiều thủ thuật</strong> cùng lúc
          </span>
        </div>

        {/* Procedures Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {quickProcedures.map((proc) => {
            const active = data.treatmentFeatures.surgicalProcedures?.includes(proc);
            return (
              <button
                key={proc}
                type="button"
                onClick={() => toggleProcedure(proc)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left text-xs font-bold transition cursor-pointer select-none ${
                  active
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/80 shadow-xs'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                    active
                      ? 'bg-teal-500 border-teal-500 text-slate-950'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                >
                  {active && <span className="text-[10px] font-black">✓</span>}
                </div>
                <span className="leading-tight">{proc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Chi tiết phẫu thuật & Dấu hiệu trong mổ (Bảng 5) */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Scissors className="w-4 h-4 text-cyan-400" />
          ĐẶC ĐIỂM PHẪU THUẬT & DẤU HIỆU TRONG MỔ
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Phẫu thuật:
            </label>
            <select
              value={data.treatmentFeatures.surgeryPerformed}
              onChange={(e) =>
                onChange({
                  treatmentFeatures: {
                    ...data.treatmentFeatures,
                    surgeryPerformed: e.target.value as YesNo,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="Có">Có</option>
              <option value="Không">Không</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Số lần phẫu thuật:
            </label>
            <input
              type="number"
              min={1}
              placeholder="VD: 1"
              disabled={data.treatmentFeatures.surgeryPerformed === 'Không'}
              value={data.treatmentFeatures.surgeryCount ?? ''}
              onChange={(e) =>
                onChange({
                  treatmentFeatures: {
                    ...data.treatmentFeatures,
                    surgeryCount: e.target.value ? parseInt(e.target.value) : null,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 disabled:opacity-40 rounded-lg px-3 py-2 text-xs text-slate-200"
            />
          </div>
        </div>

        {/* Dấu hiệu trong mổ */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="block text-xs font-semibold text-slate-300 uppercase">
            Dấu hiệu quan sát trong phẫu thuật (chọn nhiều):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'purulentSecretions', label: 'Nhầy mủ' },
              { key: 'edemaMucosa', label: 'Phù nề' },
              { key: 'necrosisTissue', label: 'Hoại tử' },
              { key: 'papyraceaBoneDestruction', label: 'Hủy xương giấy' },
            ].map((item) => {
              const checked = data.treatmentFeatures.intraoperativeFindings[
                item.key as keyof typeof data.treatmentFeatures.intraoperativeFindings
              ] as boolean;
              return (
                <label
                  key={item.key}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium cursor-pointer transition select-none ${
                    checked
                      ? 'bg-rose-950/30 border-rose-500/60 text-rose-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      onChange({
                        treatmentFeatures: {
                          ...data.treatmentFeatures,
                          intraoperativeFindings: {
                            ...data.treatmentFeatures.intraoperativeFindings,
                            [item.key]: e.target.checked,
                          },
                        },
                      })
                    }
                    className="rounded border-slate-700 text-rose-500 focus:ring-0"
                  />
                  <span>{item.label}</span>
                </label>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="Ghi chú thêm về thương tổn trong mổ (vd: vị trí tụ mủ, tình trạng thần kinh thị...)"
            value={data.treatmentFeatures.intraoperativeFindings.otherFindings || ''}
            onChange={(e) =>
              onChange({
                treatmentFeatures: {
                  ...data.treatmentFeatures,
                  intraoperativeFindings: {
                    ...data.treatmentFeatures.intraoperativeFindings,
                    otherFindings: e.target.value,
                  },
                },
              })
            }
            className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:border-cyan-400"
          />
        </div>
      </div>

      {/* 3. Kháng sinh & Thuốc điều trị */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Syringe className="w-4 h-4 text-emerald-400" />
          KHÁNG SINH / KHÁNG NẤM ĐIỀU TRỊ
        </h3>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Loại kháng sinh hoặc kháng nấm sử dụng:
          </label>
          <input
            type="text"
            list="antibiotics-list"
            placeholder="Nhập hoặc chọn phác đồ (vd: Vancomycin + Ceftriaxone IV)..."
            value={data.treatmentFeatures.antibiotics}
            onChange={(e) =>
              onChange({
                treatmentFeatures: {
                  ...data.treatmentFeatures,
                  antibiotics: e.target.value,
                },
              })
            }
            className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-emerald-400 font-mono"
          />
          <datalist id="antibiotics-list">
            {commonAntibiotics.map((ab) => (
              <option key={ab} value={ab} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
};
