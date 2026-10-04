import React from 'react';
import { PatientCase, TreatmentOutcome, YesNo } from '../../types/medical';
import { CheckCircle2, HeartPulse, Clock } from 'lucide-react';

interface StepPostOpProps {
  data: PatientCase;
  onChange: (updates: Partial<PatientCase>) => void;
}

export const StepPostOp: React.FC<StepPostOpProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-emerald-400" />
          KẾT QUẢ ĐIỀU TRỊ & THEO DÕI HẬU PHẪU
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Số ngày điều trị */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              Số ngày điều trị (Nằm viện):
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                placeholder="VD: 7"
                value={data.treatmentFeatures.treatmentDays ?? ''}
                onChange={(e) =>
                  onChange({
                    treatmentFeatures: {
                      ...data.treatmentFeatures,
                      treatmentDays: e.target.value ? parseInt(e.target.value) : null,
                    },
                  })
                }
                className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-emerald-400"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500">ngày</span>
            </div>
          </div>

          {/* Kết quả điều trị */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              Kết quả điều trị lúc xuất viện:
            </label>
            <select
              value={data.treatmentFeatures.treatmentOutcome}
              onChange={(e) =>
                onChange({
                  treatmentFeatures: {
                    ...data.treatmentFeatures,
                    treatmentOutcome: e.target.value as TreatmentOutcome,
                  },
                })
              }
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-emerald-400"
            >
              <option value="Cải thiện">Cải thiện</option>
              <option value="Không thay đổi">Không thay đổi</option>
              <option value="Nặng thêm">Nặng thêm</option>
            </select>
          </div>

          {/* Tử vong */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              Tử vong:
            </label>
            <select
              value={data.treatmentFeatures.mortality}
              onChange={(e) =>
                onChange({
                  treatmentFeatures: {
                    ...data.treatmentFeatures,
                    mortality: e.target.value as YesNo,
                  },
                })
              }
              className={`w-full bg-[#070b14] border rounded-lg px-3 py-2 text-sm font-semibold ${
                data.treatmentFeatures.mortality === 'Có'
                  ? 'border-rose-500 text-rose-300'
                  : 'border-slate-800 text-slate-200'
              }`}
            >
              <option value="Không">Không</option>
              <option value="Có">Có</option>
            </select>
          </div>
        </div>

        {/* Ghi chú lâm sàng */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <label className="block text-xs font-medium text-slate-400">
            Tóm tắt diễn tiến lâm sàng & Hẹn tái khám:
          </label>
          <textarea
            rows={4}
            placeholder="Ghi nhận thị lực phục hồi, giảm lồi mắt, niêm mạc xoang biểu mô hóa, lịch hút rửa hốc mổ..."
            value={data.treatmentFeatures.notes || ''}
            onChange={(e) =>
              onChange({
                treatmentFeatures: {
                  ...data.treatmentFeatures,
                  notes: e.target.value,
                },
              })
            }
            className="w-full bg-[#070b14] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-emerald-400"
          />
        </div>
      </div>
    </div>
  );
};
