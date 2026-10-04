import React, { useState } from 'react';
import { PatientCase, ComplexityGrade } from '../types/medical';
import {
  exportCasesToCsv,
  exportDeidentifiedCsv,
  exportHtmlReport,
} from '../utils/exportTools';
import {
  Search,
  Download,
  Calendar,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Plus,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';

interface CaseListProps {
  cases: PatientCase[];
  onAddNew: () => void;
  onEdit: (caseItem: PatientCase) => void;
  onDelete: (caseId: string) => void;
  onViewDetails: (caseItem: PatientCase) => void;
}

export const CaseList: React.FC<CaseListProps> = ({
  cases,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'score_desc'>('date_desc');

  // Filter logic
  const filteredCases = cases.filter((c) => {
    if (selectedGrade !== 'ALL' && !c.complexityGrade.startsWith(selectedGrade)) {
      return false;
    }
    if (startDate && c.surgeryDate < startDate) {
      return false;
    }
    if (endDate && c.surgeryDate > endDate) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = c.caseCode.toLowerCase().includes(q);
      const matchDiagnosis = c.primaryDiagnosis.toLowerCase().includes(q);
      const matchSurgery = c.surgeryType.toLowerCase().includes(q);
      const matchAddress = c.address.toLowerCase().includes(q);
      return matchCode || matchDiagnosis || matchSurgery || matchAddress;
    }
    return true;
  });

  // Sort logic
  filteredCases.sort((a, b) => {
    if (sortBy === 'date_asc') {
      return a.surgeryDate.localeCompare(b.surgeryDate);
    }
    if (sortBy === 'score_desc') {
      return (b.totalLundMackayScore || 0) - (a.totalLundMackayScore || 0);
    }
    return b.surgeryDate.localeCompare(a.surgeryDate);
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Exports */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold">
            CA BỆNH
          </span>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
            Danh sách ca
            <span className="w-5 h-5 rounded-full border border-slate-700 text-slate-400 text-xs flex items-center justify-center font-sans font-normal">
              ?
            </span>
          </h2>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">
            Xuất <strong className="text-teal-400">tất cả</strong> {cases.length} ca
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
            XUẤT
          </span>

          <button
            type="button"
            onClick={() => exportCasesToCsv(cases)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV ca mổ
          </button>

          <button
            type="button"
            onClick={() => exportCasesToCsv(cases)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV tái khám
          </button>

          <button
            type="button"
            onClick={() => exportDeidentifiedCsv(cases)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            title="Loại bỏ thông tin định danh phục vụ báo cáo khoa học"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" /> CSV khử định danh
          </button>

          <button
            type="button"
            onClick={() => exportHtmlReport(cases)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Báo cáo HTML
          </button>
        </div>
      </div>

      {/* Filter and Search Bar matching Image 9 */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0a1120] border border-slate-800 p-3 rounded-xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm kiếm mã ca, chẩn đoán, phẫu thuật..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-teal-400"
          />
        </div>

        {/* Grade filter */}
        <div>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="ALL">Mọi grade</option>
            <option value="Grade I">Grade I</option>
            <option value="Grade II">Grade II</option>
            <option value="Grade III">Grade III</option>
            <option value="Grade IV">Grade IV</option>
          </select>
        </div>

        {/* Date From */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>TỪ</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>ĐẾN</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
          />
        </div>

        {/* Sort */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
          >
            <option value="date_desc">Ngày ↓</option>
            <option value="date_asc">Ngày ↑</option>
            <option value="score_desc">LM CT ↓</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-500 ml-auto">
          {filteredCases.length}/{cases.length} ca
        </span>
      </div>

      {/* Cases Table */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0e172a] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-900" />
                </th>
                <th className="py-3 px-4">MÃ BA</th>
                <th className="py-3 px-4">TUỔI/GIỚI</th>
                <th className="py-3 px-4">NGÀY</th>
                <th className="py-3 px-4">GRADE</th>
                <th className="py-3 px-4">LM CT</th>
                <th className="py-3 px-4">THỜI GIAN</th>
                <th className="py-3 px-4">HÌNH ẢNH</th>
                <th className="py-3 px-4">HẬU PHẪU</th>
                <th className="py-3 px-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    Chưa có ca bệnh nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const pct = c.auditStatus?.completionPercentage ?? 50;
                  const ctCount = c.images?.ctScanImages?.length || 0;
                  const endoCount = c.images?.endoscopyImages?.length || 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-900/60 transition group cursor-pointer"
                      onClick={() => onViewDetails(c)}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-slate-700 bg-slate-900" />
                      </td>

                      {/* Mã BA */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white group-hover:text-teal-400 transition">
                            {c.caseCode}
                          </span>
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/70 text-amber-300 border border-amber-700/60">
                            📄 {pct}%
                          </span>
                        </div>
                      </td>

                      {/* Tuổi / Giới */}
                      <td className="py-3 px-4">
                        {c.age ? `${c.age}/${c.gender}` : `Chưa rõ/${c.gender}`}
                      </td>

                      {/* Ngày */}
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {c.surgeryDate}
                      </td>

                      {/* Grade */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                          {c.complexityGrade.split('—')[0].trim()}
                        </span>
                      </td>

                      {/* LM CT */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-teal-400 text-sm">
                          {c.totalLundMackayScore}
                        </span>
                      </td>

                      {/* Thời gian mổ */}
                      <td className="py-3 px-4 font-mono text-slate-500">
                        — '
                      </td>

                      {/* Hình ảnh */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          {ctCount + endoCount > 0 ? (
                            <span className="flex items-center gap-1 text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                              <ImageIcon className="w-3 h-3" />
                              {ctCount} CT · {endoCount} NS
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </div>
                      </td>

                      {/* Hậu phẫu */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            c.treatmentFeatures.treatmentOutcome === 'Cải thiện'
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {c.treatmentFeatures.treatmentOutcome || '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onViewDetails(c)}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                          >
                            Xem
                          </button>

                          <button
                            type="button"
                            onClick={() => onEdit(c)}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xoá ca mổ ${c.caseCode}?`)) {
                                onDelete(c.id);
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900 border border-rose-900 text-rose-300 text-xs font-medium transition cursor-pointer"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
