import React, { useRef, useState } from 'react';
import { PatientCase } from '../types/medical';
import { db } from '../db/indexedDB';
import { useFirebaseSync } from '../contexts/FirebaseContext';
import {
  ShieldCheck,
  Download,
  Upload,
  Trash2,
  Check,
  RefreshCw,
  X,
  AlertTriangle,
  Cloud,
  LogIn,
  LogOut,
  Users,
  Copy,
  UserPlus,
  KeyRound,
} from 'lucide-react';

interface DataBackupModalProps {
  cases: PatientCase[];
  onClose: () => void;
  onRefresh: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  cases,
  onClose,
  onRefresh,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [workspaceNameInput, setWorkspaceNameInput] = useState<string>('Kho Mũi Xoang Chung');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [memberEmailInput, setMemberEmailInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const {
    user,
    workspace,
    isSyncing,
    lastSyncedAt,
    authError,
    clearAuthError,
    signInWithGoogle,
    signOutUser,
    triggerManualSync,
    createWorkspace,
    joinWorkspace,
    addMemberEmail,
    removeMemberEmail,
    leaveWorkspace,
  } = useFirebaseSync();

  const pendingCount = cases.filter((c) => !c.syncedToCloud).length;
  const isWorkspaceOwner = Boolean(user && workspace && workspace.ownerId === user.uid);

  const handleCopyInviteCode = async () => {
    if (!workspace?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(workspace.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setMsg(`Mã nhóm của bạn: ${workspace.inviteCode}`);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorkspace(workspaceNameInput);
      setMsg('✓ Đã tạo Kho đồng bộ chung! Hãy thêm Gmail khác hoặc gửi Mã Nhóm để đồng bộ chung.');
    } catch {
      // authError already set in context
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinWorkspace(joinCodeInput);
      setJoinCodeInput('');
      setMsg('✓ Đã tham gia Kho đồng bộ chung thành công!');
    } catch {
      // authError already set in context
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMemberEmail(memberEmailInput);
      setMsg(`✓ Đã cấp quyền đồng bộ chung cho ${memberEmailInput.trim().toLowerCase()}!`);
      setMemberEmailInput('');
    } catch {
      // authError already set in context
    }
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(cases, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rhinolog_Backup_AllCases_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setMsg('Đã tải xuống tập tin sao lưu JSON hoàn chỉnh!');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const normalized = imported.map((item) => ({
            ...item,
            syncedToCloud: false,
            updatedAt: Date.now(),
          }));
          await db.cases.bulkPut(normalized);
          setMsg(`✓ Đã phục hồi thành công ${normalized.length} ca bệnh!`);
          onRefresh();
          if (user && navigator.onLine) {
            await triggerManualSync();
          }
        } else {
          setMsg('Tập tin không đúng cấu trúc danh sách ca bệnh.');
        }
      } catch {
        setMsg('Lỗi đọc tập tin JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'CẢNH BÁO: Thao tác này sẽ xoá toàn bộ ca bệnh khỏi bộ nhớ máy này (không xoá dữ liệu đã đồng bộ trên Cloud). Bạn đã sao lưu JSON chưa?'
      )
    ) {
      await db.cases.clear();
      onRefresh();
      setMsg('Đã xoá sạch bộ nhớ cục bộ trên thiết bị này.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-[#090f1d] border border-slate-700 shadow-2xl p-6 text-slate-100 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h3 className="font-serif font-bold text-base text-white">
              Đồng Bộ Đám Mây & Nhiều Tài Khoản
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {msg && (
          <div className="p-3 rounded-lg bg-teal-950/80 border border-teal-600 text-teal-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {authError && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-200 text-xs space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
              <button
                type="button"
                onClick={clearAuthError}
                className="text-rose-300 hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* CLOUD SYNC PANEL */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0e1b33] to-[#0a1324] border border-teal-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-teal-300">
                Tài khoản đồng bộ (Cloud Sync)
              </span>
            </div>
            {user && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                {isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'ĐÃ KẾT NỐI'}
              </span>
            )}
          </div>

          {!user ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Đăng nhập bằng Google để đồng bộ ca bệnh giữa nhiều thiết bị, hoặc liên kết{' '}
                <strong>nhiều tài khoản Google khác nhau</strong> vào cùng một Kho Đồng Bộ Chung.
              </p>
              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full py-2.5 px-4 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-teal-500/15"
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập bằng Google
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-teal-500/50 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-xs shrink-0">
                      {(user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {user.displayName || 'Bác sĩ'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">
                      {user.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={signOutUser}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" /> Đăng xuất
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>
                  {pendingCount === 0
                    ? `✓ Tất cả ${cases.length} ca đã đồng bộ`
                    : `⏳ Còn ${pendingCount} ca chưa đẩy lên Cloud`}
                </span>
                {lastSyncedAt && (
                  <span className="font-mono text-slate-400">
                    {new Date(lastSyncedAt).toLocaleTimeString('vi-VN')}
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={isSyncing}
                onClick={async () => {
                  await triggerManualSync();
                  setMsg('✓ Đã đồng bộ dữ liệu hai chiều với Cloud!');
                }}
                className="w-full py-2 px-3 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Đang đồng bộ dữ liệu...' : 'Đồng bộ ngay bây giờ'}
              </button>
            </div>
          )}
        </div>

        {/* MULTI-ACCOUNT SHARED WORKSPACE PANEL */}
        {user && (
          <div className="p-4 rounded-xl bg-[#0d162a] border border-cyan-500/35 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-cyan-300">
                  Đồng bộ chung nhiều tài khoản
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                {workspace ? `${workspace.memberEmails.length} TÀI KHOẢN` : 'KHO CÁ NHÂN'}
              </span>
            </div>

            {!workspace ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hiện tài khoản này đang đồng bộ riêng. Để nhiều tài khoản Google khác nhau dùng chung 1 cơ sở dữ liệu ca bệnh, bạn có thể <strong>Tạo Kho Chung</strong> hoặc <strong>Nhập Mã Nhóm</strong> của tài khoản kia:
                </p>

                {/* Create Shared Workspace */}
                <form onSubmit={handleCreateWorkspace} className="space-y-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <label className="text-[11px] font-bold text-slate-200 block">
                    Cách 1: Tạo Kho Chung mới (trên tài khoản chính)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={workspaceNameInput}
                      onChange={(e) => setWorkspaceNameInput(e.target.value)}
                      placeholder="Tên kho chung..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={isSyncing}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      Tạo Kho Chung
                    </button>
                  </div>
                </form>

                {/* Join Existing Workspace by Invite Code */}
                <form onSubmit={handleJoinWorkspace} className="space-y-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <label className="text-[11px] font-bold text-slate-200 block">
                    Cách 2: Tham gia Kho Chung bằng Mã Nhóm
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder="Nhập mã (VD: RHINO-A3F9K2)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white uppercase focus:outline-none focus:border-teal-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSyncing || !joinCodeInput.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      Tham gia
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Workspace Header & Invite Code */}
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white">{workspace.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Tất cả tài khoản dưới đây đều tự động đồng bộ chung
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-700 text-cyan-300 font-mono text-xs font-bold">
                      {workspace.inviteCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyInviteCode}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer"
                      title="Sao chép Mã Nhóm"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Add Collaborator Email (Owner only) */}
                {isWorkspaceOwner && (
                  <form onSubmit={handleAddEmail} className="space-y-1.5">
                    <label className="text-[11px] text-slate-300 font-semibold block">
                      Thêm Gmail khác để cùng đồng bộ chung (tài khoản đó đăng nhập là tự thấy ngay):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={memberEmailInput}
                        onChange={(e) => setMemberEmailInput(e.target.value)}
                        placeholder="nhap-gmail-khac@gmail.com"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="submit"
                        disabled={isSyncing || !memberEmailInput.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Thêm
                      </button>
                    </div>
                  </form>
                )}

                {/* Member Emails List */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Danh sách tài khoản đồng bộ chung ({workspace.memberEmails.length}/20):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {workspace.memberEmails.map((email) => {
                      const isSelf = email === (user.email || '').toLowerCase();
                      return (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-200"
                        >
                          <span>{email}</span>
                          {isSelf && (
                            <span className="text-[10px] text-teal-400">(bạn)</span>
                          )}
                          {isWorkspaceOwner && !isSelf && (
                            <button
                              type="button"
                              onClick={() => removeMemberEmail(email)}
                              className="text-slate-500 hover:text-rose-400 cursor-pointer"
                              title="Xóa quyền đồng bộ của email này"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Chuyển tài khoản này về Kho Cá Nhân riêng?')) {
                        await leaveWorkspace();
                        setMsg('Đã chuyển tài khoản về chế độ Kho Cá Nhân.');
                      }
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    Ngắt kết nối kho chung (về kho cá nhân)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOCAL JSON BACKUP */}
        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Sao lưu dự phòng (JSON)</span>
              <span className="text-slate-400">Xuất toàn bộ {cases.length} ca bệnh & hình ảnh ra máy</span>
            </div>
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Tải về
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Phục hồi từ tập tin sao lưu</span>
              <span className="text-slate-400">Nhập dữ liệu từ file sao lưu JSON trước đó</span>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJson}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Chọn tệp
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
            <div>
              <span className="font-bold text-rose-300 block">Xóa dữ liệu bộ nhớ cục bộ</span>
              <span className="text-slate-400">Đặt lại cơ sở dữ liệu IndexedDB trên thiết bị này</span>
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold text-xs transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xoá sạch
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
