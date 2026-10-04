import React from 'react';
import { PatientCase } from '../types/medical';
import { exportCasesToCsv, exportDeidentifiedCsv } from '../utils/exportTools';
import { BarChart3, PieChart, TrendingUp, Users, Activity, Download } from 'lucide-react';

interface AnalyticsViewProps {
  cases: PatientCase[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ cases }) => {
  const totalCases = cases.length;

  // Chandler Distribution
  const chandlerCounts: Record<string, number> = {};
  cases.forEach((c) => {
    const key = c.diseaseExtent.chandlerGroup.split(':')[0];
    chandlerCounts[key] = (chandlerCounts[key] || 0) + 1;
  });

  // Culture Distribution
  const cultureCounts: Record<string, number> = {};
  cases.forEach((c) => {
    const key = c.diseaseExtent.cultureResult;
    cultureCounts[key] = (cultureCounts[key] || 0) + 1;
  });

  // Outcome
  const outcomeCounts: Record<string, number> = {};
  cases.forEach((c) => {
    const key = c.treatmentFeatures.treatmentOutcome || 'Chưa ghi nhận';
    outcomeCounts[key] = (outcomeCounts[key] || 0) + 1;
  });

  const avgLMScore =
    totalCases > 0
      ? (
          cases.reduce((acc, c) => acc + (c.totalLundMackayScore || 0), 0) /
          totalCases
        ).toFixed(1)
      : '0';

  const maleCount = cases.filter((c) => c.gender === 'Nam').length;
  const femaleCount = cases.filter((c) => c.gender === 'Nữ').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold">
            KẾT QUẢ & THỐNG KÊ
          </span>
          <h2 className="text-xl font-serif font-bold text-white tracking-tight">
            Phân Tích Đa Biến Số Nghiên Cứu Lâm Sàng
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tổng hợp dịch tễ, mức độ lan rộng ổ mắt Chandler, vi sinh và kết cục điều trị.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportDeidentifiedCsv(cases)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" /> Xuất tập dữ liệu nghiên cứu (CSV)
          </button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tổng mẫu nghiên cứu
          </span>
          <div className="text-2xl font-bold font-mono text-teal-400">{totalCases} ca</div>
          <p className="text-[10px] text-slate-500">Nam: {maleCount} · Nữ: {femaleCount}</p>
        </div>

        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Điểm Lund-Mackay TB
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-400">{avgLMScore} / 24</div>
          <p className="text-[10px] text-slate-500">Mức độ cản quang trên CT</p>
        </div>

        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            Tỷ lệ mổ thành công
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-400">
            {totalCases > 0
              ? `${Math.round(((outcomeCounts['Cải thiện'] || 0) / totalCases) * 100)}%`
              : '0%'}
          </div>
          <p className="text-[10px] text-slate-500">Hồi phục thị lực & hết nhiễm trùng</p>
        </div>

        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
            Tử vong
          </span>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {cases.filter((c) => c.treatmentFeatures.mortality === 'Có').length} ca
          </div>
          <p className="text-[10px] text-slate-500">Do sốc nhiễm trùng/nội sọ</p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phân độ Chandler */}
        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-cyan-400 rounded-xs" />
            PHÂN ĐỘ BIẾN CHỨNG Ổ MẮT (CHANDLER)
          </h3>
          <div className="space-y-2.5">
            {Object.entries(chandlerCounts).map(([grade, count]) => {
              const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
              return (
                <div key={grade} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{grade}</span>
                    <span className="font-mono font-bold text-teal-400">
                      {count} ca ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kết quả cấy vi sinh */}
        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-emerald-400 rounded-xs" />
            KẾT QUẢ CẤY VI SINH / NẤM
          </h3>
          <div className="space-y-2.5">
            {Object.entries(cultureCounts).map(([culture, count]) => {
              const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
              return (
                <div key={culture} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{culture}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {count} ca ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
