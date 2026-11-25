import React, { useState } from 'react';
import { PatientCase, ComplexityGrade } from '../types/medical';
import {
  exportCasesToCsv,
  exportDeidentifiedCsv,
  exportHtmlReport,
} from '../utils/exportTools';
import { useFirebaseSync } from '../contexts/FirebaseContext';
import {
  Search,
  Download,
  Trash2,
  Image as ImageIcon,
  Cloud,
  AlertTriangle,
} from 'lucide-react';

interface CaseListProps {
  cases: PatientCase[];
  onAddNew: () => void;
  onEdit: (caseItem: PatientCase) => void;
  onMoveToTrash: (caseId: string) => Promise<void>;
  onPermanentDelete: (caseId: string) => Promise<void>;
  onViewDetails: (caseItem: PatientCase) => void;
}

export const CaseList: React.FC<CaseListProps> = ({
  cases,
  onAddNew,
  onEdit,
  onMoveToTrash,
  onPermanentDelete,
  onViewDetails,
}) => {
  const { isAdmin } = useFirebaseSync();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'score_desc'>('date_desc');
  const [pendingDeleteCase, setPendingDeleteCase] = useState<PatientCase | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

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
                  const clinCount = c.images?.clinicalImages?.length || 0;
                  const totalImgCount = ctCount + endoCount + clinCount;

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
                          {c.syncedToCloud && (
                            <span
                              title="Đã đồng bộ lên Cloud"
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 flex items-center gap-0.5"
                            >
                              <Cloud className="w-2.5 h-2.5" />
                            </span>
                          )}
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
                          {totalImgCount > 0 ? (
                            <span className="flex items-center gap-1 text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                              <ImageIcon className="w-3 h-3" />
                              {ctCount} CT · {endoCount} NS{clinCount > 0 ? ` · ${clinCount} LS` : ''}
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
                            c.treatmentFeatures.treatmentOutcome === 'Tử vong'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                              : c.treatmentFeatures.treatmentOutcome === 'Còn di chứng sau điều trị'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                              : c.treatmentFeatures.treatmentOutcome === 'Hồi phục hoàn toàn' ||
                                (c.treatmentFeatures.treatmentOutcome as string) === 'Cải thiện'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
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
                            onClick={() => setPendingDeleteCase(c)}
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

      {/* Role-aware Delete Confirmation Modal */}
      {pendingDeleteCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#090f1d] border border-slate-700 p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">
                  {isAdmin
                    ? `Xử lý ca bệnh ${pendingDeleteCase.caseCode}`
                    : `Chuyển ca ${pendingDeleteCase.caseCode} vào Thùng rác?`}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {pendingDeleteCase.primaryDiagnosis}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isAdmin
                ? 'Với quyền Admin, bạn có thể chuyển ca này vào Thùng rác (có thể hoàn tác sau) hoặc xóa vĩnh viễn khỏi hệ thống.'
                : 'Tài khoản khách không xóa vĩnh viễn dữ liệu. Ca bệnh này sẽ được chuyển vào Thùng rác để Admin xem xét hoàn tác hoặc xóa bỏ.'}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDeleteCase(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  const id = pendingDeleteCase.id;
                  setDeleting(true);
                  try {
                    await onMoveToTrash(id);
                    setPendingDeleteCase(null);
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Chuyển vào Thùng rác
              </button>

              {isAdmin && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    const id = pendingDeleteCase.id;
                    setDeleting(true);
                    try {
                      await onPermanentDelete(id);
                      setPendingDeleteCase(null);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa vĩnh viễn
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
