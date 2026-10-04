import React, { useState } from 'react';
import { PatientCase, AuditIssue } from '../types/medical';
import { auditSingleCase } from '../utils/validationAudit';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Edit,
  Download,
  Filter,
  Search,
} from 'lucide-react';

interface DataReconciliationProps {
  cases: PatientCase[];
  onEditCase: (caseItem: PatientCase, initialStep?: number) => void;
  onRefreshCases: () => void;
}

export const DataReconciliation: React.FC<DataReconciliationProps> = ({
  cases,
  onEditCase,
  onRefreshCases,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all audit issues across all cases
  const allAudits = cases.map((c) => ({
    caseItem: c,
    audit: auditSingleCase(c),
  }));

  const allIssues: { issue: AuditIssue; caseItem: PatientCase }[] = [];
  allAudits.forEach(({ caseItem, audit }) => {
    audit.issues.forEach((issue) => {
      allIssues.push({ issue, caseItem });
    });
  });

  const totalErrors = allIssues.filter((i) => i.issue.severity === 'error').length;
  const totalWarnings = allIssues.filter((i) => i.issue.severity === 'warning').length;
  const totalInfos = allIssues.filter((i) => i.issue.severity === 'info').length;

  const avgCompletion =
    cases.length > 0
      ? Math.round(
          allAudits.reduce((acc, curr) => acc + curr.audit.completionPercentage, 0) /
            cases.length
        )
      : 0;

  const filteredIssues = allIssues.filter(({ issue, caseItem }) => {
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        caseItem.caseCode.toLowerCase().includes(q) ||
        issue.message.toLowerCase().includes(q) ||
        caseItem.primaryDiagnosis.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportAuditSummary = () => {
    const headers = ['Mã ca', 'Mức độ', 'Loại vấn đề', 'Bước khắc phục', 'Chi tiết đối soát'];
    const rows = allIssues.map(({ issue, caseItem }) => [
      `"${caseItem.caseCode}"`,
      `"${issue.severity.toUpperCase()}"`,
      `"${issue.category}"`,
      `"Bước ${issue.stepNumber}"`,
      `"${issue.message.replace(/"/g, '""')}"`,
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rhinolog_DoiSoatDuLieu_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
            <span className="w-2.5 h-6 bg-teal-400 rounded-sm" />
            Đối Soát & Kiểm Chuẩn Dữ Liệu Nghiên Cứu
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tự động rà soát mâu thuẫn logic y khoa, giá trị bất thường và độ hoàn thiện biến số lâm sàng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefreshCases}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Quét lại
          </button>
          <button
            type="button"
            onClick={exportAuditSummary}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" /> Xuất kết quả đối soát
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <div className="bg-[#0c1424] border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Độ hoàn thiện TB
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-teal-400">{avgCompletion}%</span>
            <span className="text-[10px] text-slate-500">trên {cases.length} ca</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-teal-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${avgCompletion}%` }}
            />
          </div>
        </div>

        {/* Logic Errors */}
        <div className="bg-[#0c1424] border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" /> Mâu thuẫn Logic
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{totalErrors}</span>
            <span className="text-[10px] text-slate-500">cần sửa ngay</span>
          </div>
          <p className="text-[10px] text-slate-400">Sai lệch phẫu thuật / kết cục</p>
        </div>

        {/* Warnings / Outliers */}
        <div className="bg-[#0c1424] border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo bất thường
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{totalWarnings}</span>
            <span className="text-[10px] text-slate-500">chỉ số sinh hiệu/mắt</span>
          </div>
          <p className="text-[10px] text-slate-400">Chandler, GCS, SpO2, Sốt cao</p>
        </div>

        {/* Missing Fields */}
        <div className="bg-[#0c1424] border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Thiếu biến số
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">{totalInfos}</span>
            <span className="text-[10px] text-slate-500">mục chưa điền</span>
          </div>
          <p className="text-[10px] text-slate-400">Cấy vi sinh, GPB, Ngày ra viện</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0a1120] border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo mã ca, chẩn đoán..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-teal-400"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
            <span className="text-slate-400 hidden md:inline">Lọc mức độ:</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: `Tất cả (${allIssues.length})` },
            { id: 'error', label: `Mâu thuẫn (${totalErrors})`, color: 'text-rose-400' },
            { id: 'warning', label: `Cảnh báo (${totalWarnings})`, color: 'text-amber-400' },
            { id: 'info', label: `Thiếu biến (${totalInfos})`, color: 'text-cyan-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterSeverity(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterSeverity === tab.id
                  ? 'bg-slate-800 text-white border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className={tab.color || ''}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">
            Dữ liệu đối soát đạt chuẩn hoàn hảo!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Không tìm thấy mâu thuẫn logic hoặc vấn đề dữ liệu nào phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map(({ issue, caseItem }, index) => {
            const isError = issue.severity === 'error';
            const isWarning = issue.severity === 'warning';

            return (
              <div
                key={index}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  isError
                    ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-900/60 hover:border-amber-700'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {caseItem.caseCode}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      ({caseItem.age ? `${caseItem.age} tuổi` : 'Chưa rõ tuổi'}, {caseItem.gender})
                    </span>
                    <span className="text-xs text-slate-500">· {caseItem.primaryDiagnosis}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isError
                          ? 'bg-rose-900 text-rose-200'
                          : isWarning
                          ? 'bg-amber-900 text-amber-200'
                          : 'bg-cyan-950 text-cyan-300'
                      }`}
                    >
                      {issue.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p
                    className={`text-xs font-medium ${
                      isError ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-slate-300'
                    }`}
                  >
                    {issue.message}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditCase(caseItem, issue.stepNumber)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Sửa ở Bước {issue.stepNumber}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
