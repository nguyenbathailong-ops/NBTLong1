import React from 'react';
import { LundMackayScore } from '../../types/medical';

interface LundMackayDiagramProps {
  score: LundMackayScore;
  onChange: (newScore: LundMackayScore) => void;
}

export const LundMackayDiagram: React.FC<LundMackayDiagramProps> = ({ score, onChange }) => {
  // Cycle values: Sinuses cycle 0 -> 1 -> 2 -> 0; OMC cycles 0 -> 2 -> 0
  const toggleSinus = (key: keyof LundMackayScore, isOmc: boolean = false) => {
    const current = score[key];
    let next = 0;
    if (isOmc) {
      next = current === 0 ? 2 : 0;
    } else {
      next = (current + 1) % 3;
    }
    onChange({
      ...score,
      [key]: next,
    });
  };

  const setAllZero = () => {
    onChange({
      frontalR: 0,
      frontalL: 0,
      antEthmoidR: 0,
      antEthmoidL: 0,
      postEthmoidR: 0,
      postEthmoidL: 0,
      maxillaryR: 0,
      maxillaryL: 0,
      sphenoidR: 0,
      sphenoidL: 0,
      omcR: 0,
      omcL: 0,
    });
  };

  const total =
    score.frontalR +
    score.frontalL +
    score.antEthmoidR +
    score.antEthmoidL +
    score.postEthmoidR +
    score.postEthmoidL +
    score.maxillaryR +
    score.maxillaryL +
    score.sphenoidR +
    score.sphenoidL +
    score.omcR +
    score.omcL;

  // Box helper
  const renderCell = (
    label: string,
    val: number,
    onClick: () => void,
    isOmc: boolean = false
  ) => {
    const hasValue = val > 0;
    const bgClass =
      val === 2
        ? 'bg-slate-200 text-slate-950 font-bold border-white'
        : val === 1
        ? 'bg-slate-700/80 text-white font-medium border-slate-500'
        : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500';

    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex flex-col items-center justify-center p-3 rounded-lg border border-dashed transition cursor-pointer select-none ${bgClass}`}
      >
        <span className="text-base font-semibold">{hasValue ? val : '·'}</span>
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4 bg-[#0a1120] border border-slate-800 rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              SỐ ĐO TRÊN PHIM
            </span>
            <span className="text-emerald-400 text-sm font-bold">
              LUND–MACKAY CT (0–24)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono font-bold">P</span>
            bên phải bệnh nhân ở <strong>bên trái</strong> hình — quy ước hình ảnh học
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">Tổng điểm CT:</span>{' '}
            <span className="text-lg font-bold text-emerald-400 font-mono">{total}</span>
            <span className="text-xs text-slate-500">/24</span>
          </div>
          <button
            type="button"
            onClick={setAllZero}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            Đặt tất cả = 0
          </button>
        </div>
      </div>

      {/* Anatomical Sinus Grid */}
      <div className="max-w-xl mx-auto py-2">
        <div className="grid grid-cols-2 gap-4">
          {/* PHẢI (P - Patient's Right on Left side of screen) */}
          <div className="space-y-2 border-r border-slate-800/80 pr-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-1">
              <span className="text-cyan-400">P (PHẢI)</span>
              <span className="text-[11px] text-slate-500 font-normal">0=Sạch, 1=Mờ 1 phần, 2=Mờ hoàn toàn</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                {renderCell('OMC', score.omcR, () => toggleSinus('omcR', true), true)}
                {renderCell('Hàm', score.maxillaryR, () => toggleSinus('maxillaryR'))}
              </div>
              <div className="space-y-2">
                {renderCell('Trán', score.frontalR, () => toggleSinus('frontalR'))}
                {renderCell('S.trước', score.antEthmoidR, () => toggleSinus('antEthmoidR'))}
                {renderCell('S.sau', score.postEthmoidR, () => toggleSinus('postEthmoidR'))}
                {renderCell('Bướm', score.sphenoidR, () => toggleSinus('sphenoidR'))}
              </div>
            </div>
          </div>

          {/* TRÁI (T - Patient's Left on Right side of screen) */}
          <div className="space-y-2 pl-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-1">
              <span className="text-cyan-400">T (TRÁI)</span>
              <span className="text-[11px] text-slate-500 font-normal">OMC: 0=Thông thoáng, 2=Tắc</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                {renderCell('Trán', score.frontalL, () => toggleSinus('frontalL'))}
                {renderCell('S.trước', score.antEthmoidL, () => toggleSinus('antEthmoidL'))}
                {renderCell('S.sau', score.postEthmoidL, () => toggleSinus('postEthmoidL'))}
                {renderCell('Bướm', score.sphenoidL, () => toggleSinus('sphenoidL'))}
              </div>
              <div className="space-y-2">
                {renderCell('OMC', score.omcL, () => toggleSinus('omcL', true), true)}
                {renderCell('Hàm', score.maxillaryL, () => toggleSinus('maxillaryL'))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
