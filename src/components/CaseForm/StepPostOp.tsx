import React from 'react';
import { PatientCase, TreatmentOutcome, TreatmentSequelae, YesNo } from '../../types/medical';
import { HeartPulse, ShieldAlert } from 'lucide-react';

interface StepPostOpProps {
  data: PatientCase;
  onChange: (updates: Partial<PatientCase>) => void;
}

const DEFAULT_SEQUELAE: TreatmentSequelae = {
  ptosis: 'Không',
  proptosis: 'Không',
  visualLossOrDecrease: 'Không',
  ocularMobilityDisorder: 'Không',
  diplopia: 'Không',
  focalNeurologicalDeficit: 'Không',
  seizures: 'Không',
  meningitis: 'Không',
  brainAbscess: 'Không',
  csfLeak: 'Không',
  cerebralInfarction: 'Không',
  otherSequelae: 'Không',
};

const SEQUELAE_ITEMS: { key: Exclude<keyof TreatmentSequelae, 'otherSequelaeDetails'>; label: string }[] = [
  { key: 'ptosis', label: 'Sụp mi' },
  { key: 'proptosis', label: 'Lồi mắt' },
  { key: 'visualLossOrDecrease', label: 'Mất/giảm thị lực' },
  { key: 'ocularMobilityDisorder', label: 'Rối loạn vận nhãn' },
  { key: 'diplopia', label: 'Nhìn đôi' },
  { key: 'focalNeurologicalDeficit', label: 'Dấu thần kinh định vị' },
  { key: 'seizures', label: 'Co giật' },
  { key: 'meningitis', label: 'Viêm màng não' },
  { key: 'brainAbscess', label: 'Áp xe não' },
  { key: 'csfLeak', label: 'Rò dịch não tủy' },
  { key: 'cerebralInfarction', label: 'Nhồi máu não' },
  { key: 'otherSequelae', label: 'Di chứng khác' },
];

export const StepPostOp: React.FC<StepPostOpProps> = ({ data, onChange }) => {
  const sequelae: TreatmentSequelae = {
    ...DEFAULT_SEQUELAE,
    ...(data.treatmentFeatures.sequelae || {}),
  };

  const positiveSequelaeCount = SEQUELAE_ITEMS.filter(
    (item) => sequelae[item.key] === 'Có'
  ).length;

  const updateSequelaeField = (
    key: Exclude<keyof TreatmentSequelae, 'otherSequelaeDetails'>,
    val: YesNo
  ) => {
    const nextSequelae: TreatmentSequelae = {
      ...sequelae,
      [key]: val,
    };
    const hasAnyPositive = SEQUELAE_ITEMS.some((item) => nextSequelae[item.key] === 'Có');
    let nextOutcome = data.treatmentFeatures.treatmentOutcome;
    if (data.treatmentFeatures.mortality !== 'Có') {
      if (hasAnyPositive && nextOutcome === 'Hồi phục hoàn toàn') {
        nextOutcome = 'Còn di chứng sau điều trị';
      } else if (!hasAnyPositive && nextOutcome === 'Còn di chứng sau điều trị') {
        nextOutcome = 'Hồi phục hoàn toàn';
      }
    }

    onChange({
      treatmentFeatures: {
        ...data.treatmentFeatures,
        treatmentOutcome: nextOutcome,
        sequelae: nextSequelae,
      },
    });
  };

  const standardOutcomes: TreatmentOutcome[] = [
    'Hồi phục hoàn toàn',
    'Còn di chứng sau điều trị',
    'Tử vong',
  ];
  const currentOutcome = data.treatmentFeatures.treatmentOutcome;
  const isLegacyOutcome =
    Boolean(currentOutcome) && !standardOutcomes.includes(currentOutcome);

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
              value={currentOutcome}
              onChange={(e) => {
                const nextOutcome = e.target.value as TreatmentOutcome;
                onChange({
                  treatmentFeatures: {
                    ...data.treatmentFeatures,
                    treatmentOutcome: nextOutcome,
                    mortality: nextOutcome === 'Tử vong' ? 'Có' : 'Không',
                  },
                });
              }}
              className={`w-full bg-[#070b14] border rounded-lg px-3 py-2 text-sm font-semibold focus:border-emerald-400 ${
                currentOutcome === 'Tử vong'
                  ? 'border-rose-500 text-rose-300'
                  : currentOutcome === 'Còn di chứng sau điều trị'
                  ? 'border-amber-500/70 text-amber-300'
                  : 'border-slate-800 text-emerald-300'
              }`}
            >
              {isLegacyOutcome && (
                <option value={currentOutcome} disabled>
                  {currentOutcome} (Giá trị cũ — chọn lại)
                </option>
              )}
              <option value="Hồi phục hoàn toàn">Hồi phục hoàn toàn</option>
              <option value="Còn di chứng sau điều trị">Còn di chứng sau điều trị</option>
              <option value="Tử vong">Tử vong</option>
            </select>
          </div>

          {/* Tử vong */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              Tử vong:
            </label>
            <select
              value={data.treatmentFeatures.mortality}
              onChange={(e) => {
                const nextMortality = e.target.value as YesNo;
                const nextOutcome: TreatmentOutcome =
                  nextMortality === 'Có'
                    ? 'Tử vong'
                    : positiveSequelaeCount > 0
                    ? 'Còn di chứng sau điều trị'
                    : 'Hồi phục hoàn toàn';
                onChange({
                  treatmentFeatures: {
                    ...data.treatmentFeatures,
                    mortality: nextMortality,
                    treatmentOutcome: nextOutcome,
                  },
                });
              }}
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

        {/* Di chứng sau điều trị */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              DI CHỨNG SAU ĐIỀU TRỊ
            </h4>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                positiveSequelaeCount > 0
                  ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                  : 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              }`}
            >
              {positiveSequelaeCount > 0
                ? `${positiveSequelaeCount} di chứng ghi nhận`
                : 'Không có di chứng'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SEQUELAE_ITEMS.map((item) => {
              const currentValue = sequelae[item.key];
              return (
                <div
                  key={item.key}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg border transition ${
                    currentValue === 'Có'
                      ? 'bg-amber-950/25 border-amber-600/60'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <span className="text-xs text-slate-200 font-medium pr-2">{item.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateSequelaeField(item.key, 'Có')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        currentValue === 'Có'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      Có
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSequelaeField(item.key, 'Không')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
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
            })}
          </div>

          {sequelae.otherSequelae === 'Có' && (
            <input
              type="text"
              placeholder="Ghi rõ di chứng khác sau điều trị..."
              value={sequelae.otherSequelaeDetails || ''}
              onChange={(e) =>
                onChange({
                  treatmentFeatures: {
                    ...data.treatmentFeatures,
                    sequelae: {
                      ...sequelae,
                      otherSequelaeDetails: e.target.value,
                    },
                  },
                })
              }
              className="w-full bg-[#070b14] border border-amber-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-amber-400"
            />
          )}
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
