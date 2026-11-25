import React, { useState } from 'react';
import { PatientCase } from '../types/medical';
import { Trash2, RotateCcw, AlertTriangle, CheckCircle2, Clock, User, ShieldAlert } from 'lucide-react';

interface TrashViewProps {
  trashedCases: PatientCase[];
  onRestore: (caseId: string) => Promise<void>;
  onPermanentDelete: (caseId: string) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
}

export const TrashView: React.FC<TrashViewProps> = ({
  trashedCases,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEmptyAll, setConfirmEmptyAll] = useState<boolean>(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sortedTrash = [...trashedCases].sort((a, b) => (b.trashedAt || b.updatedAt) - (a.trashedAt || a.updatedAt));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
            CHỈ DÀNH CHO ADMIN
          </span>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
            <Trash2 className="w-6 h-6 text-rose-400" />
            Thùng rác ca bệnh ({sortedTrash.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Các ca bệnh do tài khoản khách xóa sẽ được đưa vào đây. Chỉ Admin có thể xem, hoàn tác hoặc xóa vĩnh viễn.
          </p>
        </div>

        {sortedTrash.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmEmptyAll(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold transition cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa vĩnh viễn tất cả
          </button>
        )}
      </div>

      {/* Empty State */}
      {sortedTrash.length === 0 ? (
        <div className="bg-[#0a1120] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Thùng rác đang trống</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Chưa có ca bệnh nào bị xóa. Khi tài khoản khách hoặc Admin chuyển ca bệnh vào Thùng rác, dữ liệu sẽ hiển thị tại đây để bạn kiểm tra.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTrash.map((c) => {
            const trashedTime = c.trashedAt
              ? new Date(c.trashedAt).toLocaleString('vi-VN')
              : new Date(c.updatedAt).toLocaleString('vi-VN');
            const isBusy = busyId === c.id;

            return (
              <div
                key={c.id}
                className="p-4 sm:p-5 rounded-xl bg-[#0a1120] border border-rose-900/50 hover:border-rose-700/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded">
                      {c.caseCode}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">
                      {c.primaryDiagnosis || 'Chưa rõ chẩn đoán'}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({c.age ? `${c.age} tuổi` : 'Chưa rõ tuổi'} · {c.gender} · Ngày mổ: {c.surgeryDate})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-amber-300">
                      <User className="w-3.5 h-3.5" />
                      Người đưa vào thùng rác: <strong>{c.trashedBy || 'Không rõ'}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {trashedTime}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={async () => {
                      setBusyId(c.id);
                      try {
                        await onRestore(c.id);
                      } finally {
                        setBusyId(null);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Hoàn tác
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => setConfirmDeleteId(c.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa vĩnh viễn
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Single Permanent Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#090f1d] border border-rose-700/70 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-serif font-bold text-base text-white">
                Xác nhận xóa vĩnh viễn ca bệnh?
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thao tác này sẽ xóa hoàn toàn ca bệnh và hình ảnh đính kèm khỏi hệ thống và tất cả thiết bị. Không thể hoàn tác sau khi xóa vĩnh viễn.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = confirmDeleteId;
                  setConfirmDeleteId(null);
                  setBusyId(target);
                  try {
                    await onPermanentDelete(target);
                  } finally {
                    setBusyId(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Empty All Trash Modal */}
      {confirmEmptyAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#090f1d] border border-rose-700/70 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif font-bold text-base text-white">
                Làm trống toàn bộ Thùng rác ({sortedTrash.length} ca)?
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tất cả {sortedTrash.length} ca bệnh trong Thùng rác sẽ bị xóa vĩnh viễn khỏi Cloud và mọi thiết bị.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEmptyAll(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmEmptyAll(false);
                  await onEmptyTrash();
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Xóa vĩnh viễn tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
