import React from 'react';
import { PatientCase } from '../types/medical';
import { useFirebaseSync } from '../contexts/FirebaseContext';
import {
  Plus,
  Stethoscope,
  ShieldCheck,
  Eye,
  FileCheck2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Cloud,
  RefreshCw,
  LogIn,
  Users,
} from 'lucide-react';

interface DashboardProps {
  cases: PatientCase[];
  onAddNewCase: () => void;
  onOpenAudit: () => void;
  onOpenSafetyModal: () => void;
  onOpenGuide: () => void;
  onSelectCase: (c: PatientCase) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cases,
  onAddNewCase,
  onOpenAudit,
  onOpenSafetyModal,
  onOpenGuide,
  onSelectCase,
}) => {
  const { user, workspace, isSyncing, signInWithGoogle, triggerManualSync } = useFirebaseSync();

  const eyeComplicationsCount = cases.filter(
    (c) => c.diseaseExtent.chandlerGroup !== 'Không lan ổ mắt (Nhóm 0)'
  ).length;

  const imagesCount = cases.filter(
    (c) => (c.images?.ctScanImages?.length || 0) + (c.images?.endoscopyImages?.length || 0) > 0
  ).length;

  const auditedIssuesCount = cases.reduce((acc, curr) => {
    return acc + (curr.auditStatus?.inconsistencyCount || 0);
  }, 0);

  const syncedCount = cases.filter((c) => c.syncedToCloud).length;

  return (
    <div className="space-y-6">
      {/* Header section matching Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold">
            HÔM NAY
          </span>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
            Việc cần làm
            <button
              onClick={onOpenGuide}
              className="w-5 h-5 rounded-full border border-slate-700 text-slate-400 hover:text-white text-xs flex items-center justify-center font-sans font-normal transition cursor-pointer"
            >
              ?
            </button>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSafetyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Đồng bộ & Sao lưu</span>
          </button>

          <button
            type="button"
            onClick={onAddNewCase}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold transition shadow-md shadow-teal-500/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Ghi ca mổ mới</span>
          </button>

          <button
            type="button"
            onClick={onAddNewCase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
            <span>Vào phòng mổ</span>
          </button>
        </div>
      </div>

      {/* Multi-device Cloud Sync Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0c1b33] via-[#0b1528] to-[#0a1322] border border-teal-500/35 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/40 flex items-center justify-center shrink-0">
            {workspace ? (
              <Users className="w-5 h-5 text-cyan-400" />
            ) : (
              <Cloud className="w-5 h-5 text-teal-400" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">
                {!user
                  ? 'Đồng bộ ca bệnh giữa nhiều thiết bị & nhiều tài khoản'
                  : workspace
                  ? `Kho chung: ${workspace.name}`
                  : 'Đang bật Đồng bộ Đám mây (Kho cá nhân)'}
              </h3>
              {user && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {syncedCount}/{cases.length} CA ĐÃ LÊN CLOUD
                </span>
              )}
              {workspace && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700">
                  {workspace.memberEmails.length} TÀI KHOẢN · MÃ: {workspace.inviteCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {!user
                ? 'Đăng nhập bằng Google để đồng bộ qua điện thoại, máy tính, Vercel hoặc liên kết nhiều tài khoản Google cùng chung 1 kho dữ liệu.'
                : workspace
                ? `Tài khoản ${user.email} đang đồng bộ chung với ${workspace.memberEmails.length} tài khoản (${workspace.memberEmails.join(', ')}).`
                : `Tài khoản ${user.email} — bấm "Dùng chung nhiều TK" để tạo Kho chung hoặc nhập Mã nhóm đồng bộ với tài khoản khác.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!user ? (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập Google</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenSafetyModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{workspace ? 'Quản lý tài khoản' : 'Dùng chung nhiều TK'}</span>
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={triggerManualSync}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-teal-500/40 text-teal-300 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Start Card matching Image 2 */}
      <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">👋</span>
          <h3 className="text-base font-bold text-white tracking-wide">
            Bắt đầu nhanh
          </h3>
        </div>

        <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
          {cases.length === 0
            ? 'Chưa có ca nào. Bấm + Ghi ca mổ mới để ghi ca đầu tiên.'
            : `Đã lưu trữ ${cases.length} ca mổ nội trú & nghiên cứu. Mọi dữ liệu sẵn sàng hoạt động cả khi mất Internet và tự đồng bộ khi có mạng.`}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onAddNewCase}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Ghi ca mổ mới</span>
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <span>? Xem hướng dẫn</span>
          </button>

          <button
            type="button"
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition cursor-pointer ml-auto"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Đối soát {auditedIssuesCount} vấn đề dữ liệu</span>
          </button>
        </div>
      </div>

      {/* KPI Counters matching Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cases Counter matching Image 2 */}
        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            TỔNG SỐ CA ĐÃ GHI
          </span>
          <div className="text-4xl font-extrabold font-mono text-teal-400">
            {cases.length}
          </div>
          <p className="text-[11px] text-slate-500">
            {user ? `${syncedCount}/${cases.length} ca đã đồng bộ Cloud` : 'Lưu ngoại tuyến trong IndexedDB'}
          </p>
        </div>

        {/* Biến chứng mắt Chandler */}
        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> BIẾN CHỨNG Ổ MẮT (CHANDLER)
          </span>
          <div className="text-4xl font-extrabold font-mono text-cyan-400">
            {eyeComplicationsCount}
          </div>
          <p className="text-[11px] text-slate-500">
            Tụ mủ, áp xe dưới màng xương, giảm thị lực
          </p>
        </div>

        {/* Hình ảnh đính kèm */}
        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> CÓ ẢNH CT / NỘI SOI
          </span>
          <div className="text-4xl font-extrabold font-mono text-indigo-400">
            {imagesCount}
          </div>
          <p className="text-[11px] text-slate-500">Hỗ trợ dán trực tiếp Ctrl+V & kéo thả</p>
        </div>

        {/* Độ hoàn thiện dữ liệu */}
        <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <FileCheck2 className="w-3.5 h-3.5" /> ĐỘ SẴN SÀNG NGHIÊN CỨU
          </span>
          <div className="text-4xl font-extrabold font-mono text-emerald-400">
            100%
          </div>
          <p className="text-[11px] text-slate-500">Xuất sẵn sàng cho SPSS, R, Stata</p>
        </div>
      </div>

      {/* Recent Cases Preview */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
            Các ca mổ vừa ghi nhận gần đây
          </h4>
          <span className="text-xs text-slate-500">
            Tự động lưu & đồng bộ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cases.slice(0, 4).map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCase(c)}
              className="p-3.5 rounded-lg border border-slate-800 hover:border-teal-500/50 bg-[#0d1627] hover:bg-[#101b30] transition cursor-pointer flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-white">
                    {c.caseCode}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/70 text-amber-300 border border-amber-800/60">
                    {c.auditStatus?.completionPercentage || 60}%
                  </span>
                  {c.syncedToCloud && (
                    <span
                      title="Đã đồng bộ Cloud"
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 flex items-center gap-1"
                    >
                      <Cloud className="w-2.5 h-2.5" /> Cloud
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {c.age} tuổi · {c.gender}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-xs">
                  {c.primaryDiagnosis} — {c.surgeryType}
                </p>
                <div className="text-[11px] text-teal-400 font-mono">
                  LM CT: {c.totalLundMackayScore}/24 · {c.diseaseExtent.chandlerGroup.split(':')[0]}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer matching Image 2 */}
      <div className="pt-8 pb-4 text-center text-xs text-slate-500 space-y-1">
        <p>
          Phát triển bởi <strong className="text-slate-400">BS. Trần Tấn Đăng Khoa</strong>
        </p>
        <p>
          Góp ý gửi về{' '}
          <a href="mailto:drkhoa96@gmail.com" className="text-cyan-400 hover:underline">
            drkhoa96@gmail.com
          </a>
        </p>
        <p className="text-[11px] font-mono text-slate-600">phiên bản v2.25.0 — Offline-First PWA</p>
      </div>
    </div>
  );
};
