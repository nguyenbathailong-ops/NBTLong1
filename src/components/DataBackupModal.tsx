import React, { useRef, useState } from 'react';
import { AppAccount, PatientCase } from '../types/medical';
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
  Lock,
  Unlock,
  Shield,
  User as UserIcon,
  ExternalLink,
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
  const [localErr, setLocalErr] = useState<string | null>(null);

  const {
    account,
    isAdmin,
    bootstrapState,
    managedAccounts,
    isSyncing,
    lastSyncedAt,
    authError,
    clearAuthError,
    initializeAdminAccount,
    signInWithAccount,
    createGuestAccount,
    toggleGuestActive,
    deleteGuestAccount,
    signOutUser,
    triggerManualSync,
  } = useFirebaseSync();

  // Auth form states
  const [forceLoginMode, setForceLoginMode] = useState<boolean>(false);
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [displayNameInput, setDisplayNameInput] = useState<string>('Admin');

  // Guest creation form states
  const [guestNameInput, setGuestNameInput] = useState<string>('');
  const [guestIdentifierInput, setGuestIdentifierInput] = useState<string>('');
  const [guestPasswordInput, setGuestPasswordInput] = useState<string>('');
  const [createdGuestInfo, setCreatedGuestInfo] = useState<{
    username: string;
    password: string;
    displayName: string;
  } | null>(null);
  const [copiedGuestCreds, setCopiedGuestCreds] = useState<boolean>(false);
  const [confirmClearLocal, setConfirmClearLocal] = useState<boolean>(false);
  const [confirmDeleteGuest, setConfirmDeleteGuest] = useState<AppAccount | null>(null);

  const pendingCount = cases.filter((c) => !c.syncedToCloud).length;
  const showSetupAdminForm = bootstrapState === 'uninitialized' && !forceLoginMode;

  const handleBootstrapAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    setMsg(null);
    if (passwordInput !== confirmPasswordInput) {
      setLocalErr('Mật khẩu xác nhận không khớp.');
      return;
    }
    try {
      await initializeAdminAccount(identifierInput, passwordInput, displayNameInput);
      setPasswordInput('');
      setConfirmPasswordInput('');
      setMsg('✓ Đã khởi tạo Tài khoản Admin và đồng bộ dữ liệu thành công!');
    } catch {
      // authError set by context
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    setMsg(null);
    try {
      const loggedIn = await signInWithAccount(identifierInput, passwordInput);
      setPasswordInput('');
      setMsg(
        `✓ Đăng nhập thành công (${loggedIn.role === 'admin' ? 'Admin' : 'Tài khoản khách'}: ${loggedIn.displayName})!`
      );
    } catch {
      // authError set by context
    }
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    setMsg(null);
    try {
      const created = await createGuestAccount(
        guestIdentifierInput,
        guestPasswordInput,
        guestNameInput
      );
      setCreatedGuestInfo({
        username: created.username,
        password: guestPasswordInput,
        displayName: created.displayName,
      });
      setGuestNameInput('');
      setGuestIdentifierInput('');
      setGuestPasswordInput('');
      setMsg(`✓ Đã tạo tài khoản khách "${created.displayName}" (${created.username})!`);
    } catch {
      // authError set by context
    }
  };

  const handleCopyGuestCredentials = async () => {
    if (!createdGuestInfo) return;
    const text = `Thông tin đăng nhập RHINOLOG:\n- Tên hiển thị: ${createdGuestInfo.displayName}\n- Tên đăng nhập: ${createdGuestInfo.username}\n- Mật khẩu: ${createdGuestInfo.password}\n- Trang web: ${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedGuestCreds(true);
      setTimeout(() => setCopiedGuestCreds(false), 2500);
    } catch {
      setMsg(`Tài khoản: ${createdGuestInfo.username} | Mật khẩu: ${createdGuestInfo.password}`);
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
            isTrashed: false,
            trashedAt: undefined,
            trashedBy: undefined,
            syncedToCloud: false,
            updatedAt: Date.now(),
          }));
          await db.cases.bulkPut(normalized);
          setMsg(`✓ Đã phục hồi thành công ${normalized.length} ca bệnh!`);
          onRefresh();
          if (account && navigator.onLine) {
            await triggerManualSync();
          }
        } else {
          setLocalErr('Tập tin không đúng cấu trúc danh sách ca bệnh.');
        }
      } catch {
        setLocalErr('Lỗi đọc tập tin JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearLocalDb = async () => {
    await db.cases.clear();
    setConfirmClearLocal(false);
    onRefresh();
    setMsg('Đã xoá sạch bộ nhớ cục bộ trên thiết bị này.');
  };

  const combinedError = localErr || authError;
  const needsEmailProviderNotice = Boolean(
    combinedError && combinedError.includes('Email/Password')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-[#090f1d] border border-slate-700 shadow-2xl p-6 text-slate-100 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h3 className="font-serif font-bold text-base text-white">
              Tài Khoản Hệ Thống & Đồng Bộ Dữ Liệu
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

        {combinedError && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-200 text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{combinedError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocalErr(null);
                  clearAuthError();
                }}
                className="text-rose-300 hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {needsEmailProviderNotice && (
              <a
                href="https://console.firebase.google.com/project/keen-buckeye-qflln/authentication/providers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-900/70 hover:bg-rose-800 text-white font-semibold text-[11px] transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mở Firebase Console để bật Email/Password
              </a>
            )}
          </div>
        )}

        {/* AUTH / CLOUD SYNC PANEL */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0e1b33] to-[#0a1324] border border-teal-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-teal-300">
                {account
                  ? 'Tài khoản đang đồng bộ'
                  : showSetupAdminForm
                  ? 'Khởi tạo Tài khoản Admin đầu tiên'
                  : 'Đăng nhập tài khoản tự tạo'}
              </span>
            </div>
            {account && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                  isAdmin
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                    : 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                }`}
              >
                {isAdmin ? 'ADMIN TOÀN QUYỀN' : 'TÀI KHOẢN KHÁCH'}
              </span>
            )}
          </div>

          {!account ? (
            showSetupAdminForm ? (
              <form onSubmit={handleBootstrapAdmin} className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tạo tài khoản <strong>Admin chính</strong> của bạn. Tài khoản này có toàn quyền tạo tài khoản khách, xóa vĩnh viễn ca bệnh và kiểm soát Thùng rác.
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Tên hiển thị (VD: BS. Nguyễn Bá Thái Long)
                    </label>
                    <input
                      type="text"
                      required
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="Nhập tên hiển thị..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Tên đăng nhập hoặc Email tự tạo (VD: admin hoặc nguyenbathailong@gmail.com)
                    </label>
                    <input
                      type="text"
                      required
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      placeholder="VD: admin hoặc email của bạn"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Mật khẩu (tối thiểu 6 ký tự)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Nhập lại mật khẩu
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Xác nhận mật khẩu..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  {isSyncing ? 'Đang khởi tạo...' : 'Tạo Tài Khoản Admin & Bắt Đầu'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setForceLoginMode(true);
                      setLocalErr(null);
                      clearAuthError();
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Đã có tài khoản Admin hoặc Khách? Chuyển sang Đăng nhập
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Đăng nhập bằng tài khoản <strong>Admin</strong> hoặc <strong>Tài khoản khách</strong> do Admin cấp để đồng bộ dữ liệu trên mọi thiết bị.
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Tên đăng nhập hoặc Email
                    </label>
                    <input
                      type="text"
                      required
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      placeholder="VD: admin, khach1 hoặc email..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  {isSyncing ? 'Đang đăng nhập...' : 'Đăng nhập & Đồng bộ'}
                </button>

                {bootstrapState === 'uninitialized' && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setForceLoginMode(false);
                        setLocalErr(null);
                        clearAuthError();
                      }}
                      className="text-[11px] text-teal-400 hover:underline cursor-pointer"
                    >
                      Chưa có Admin? Khởi tạo Tài khoản Admin đầu tiên
                    </button>
                  </div>
                )}
              </form>
            )
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                      isAdmin
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    }`}
                  >
                    {isAdmin ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {account.displayName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">
                      TK: {account.username}
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

        {/* GUEST ROLE PERMISSIONS SUMMARY */}
        {account && !isAdmin && (
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/60 text-xs text-cyan-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-cyan-300">
              <KeyRound className="w-3.5 h-3.5" /> Quyền hạn Tài khoản Khách
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Bạn có quyền <strong>Xem dữ liệu</strong>, <strong>Thêm ca bệnh mới</strong> và <strong>Chỉnh sửa ca bệnh</strong>. Khi bạn bấm xóa một ca bệnh, dữ liệu sẽ được chuyển vào <strong>Thùng rác của Admin</strong> để Admin duyệt hoàn tác hoặc xóa vĩnh viễn.
            </p>
          </div>
        )}

        {/* ADMIN ONLY: GUEST ACCOUNT MANAGEMENT PANEL */}
        {account && isAdmin && (
          <div className="p-4 rounded-xl bg-[#0d162a] border border-cyan-500/35 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-cyan-300">
                  Quản lý Tài khoản Khách (Admin)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                {managedAccounts.filter((a) => a.role === 'guest').length} TÀI KHOẢN KHÁCH
              </span>
            </div>

            <form
              onSubmit={handleCreateGuest}
              className="space-y-2.5 p-3 rounded-lg bg-slate-950/70 border border-slate-800"
            >
              <label className="text-[11px] font-bold text-slate-200 block">
                Tạo tài khoản khách mới (chỉ xem, thêm, sửa; xóa sẽ vào Thùng rác):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  placeholder="Tên hiển thị (VD: BS. Lan)"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  required
                  value={guestIdentifierInput}
                  onChange={(e) => setGuestIdentifierInput(e.target.value)}
                  placeholder="Tên ĐN (VD: khach1)"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  required
                  minLength={6}
                  value={guestPasswordInput}
                  onChange={(e) => setGuestPasswordInput(e.target.value)}
                  placeholder="Mật khẩu (>= 6 ký tự)"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="submit"
                disabled={isSyncing}
                className="w-full py-2 px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isSyncing ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản Khách'}
              </button>
            </form>

            {createdGuestInfo && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/70 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">
                    Thông tin tài khoản khách vừa tạo:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyGuestCredentials}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 text-[11px] font-semibold cursor-pointer"
                  >
                    {copiedGuestCreds ? (
                      <>
                        <Check className="w-3 h-3" /> Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Sao chép gửi khách
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-200 space-y-0.5">
                  <div>• Tên: {createdGuestInfo.displayName}</div>
                  <div>• Tên đăng nhập: {createdGuestInfo.username}</div>
                  <div>• Mật khẩu: {createdGuestInfo.password}</div>
                </div>
              </div>
            )}

            {/* List of Guest Accounts */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Danh sách tài khoản đã tạo:
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {managedAccounts.filter((a) => a.role === 'guest').length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">
                    Chưa có tài khoản khách nào. Bạn có thể tạo ở biểu mẫu phía trên.
                  </p>
                ) : (
                  managedAccounts
                    .filter((a) => a.role === 'guest')
                    .map((guest) => (
                      <div
                        key={guest.uid}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {guest.displayName}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                                guest.active
                                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                                  : 'bg-rose-950 border-rose-700 text-rose-300'
                              }`}
                            >
                              {guest.active ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate">
                            {guest.username}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={isSyncing}
                            onClick={() => toggleGuestActive(guest.uid, !guest.active)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            title={guest.active ? 'Tạm khóa tài khoản này' : 'Mở khóa tài khoản này'}
                          >
                            {guest.active ? (
                              <>
                                <Lock className="w-3 h-3 text-amber-400" /> Khóa
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3 text-emerald-400" /> Mở
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isSyncing}
                            onClick={() => setConfirmDeleteGuest(guest)}
                            className="px-2 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-200 text-[11px] font-semibold cursor-pointer"
                            title="Thu hồi & xóa tài khoản khách"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* LOCAL JSON BACKUP */}
        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Sao lưu dự phòng (JSON)</span>
              <span className="text-slate-400">
                Xuất toàn bộ {cases.length} ca bệnh & hình ảnh ra máy
              </span>
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

          {/* Admin-only Local Reset */}
          {(!account || isAdmin) && (
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-300 block">
                    Xóa dữ liệu bộ nhớ cục bộ
                  </span>
                  <span className="text-slate-400">
                    Đặt lại cơ sở dữ liệu IndexedDB trên thiết bị này
                  </span>
                </div>
                {!confirmClearLocal && (
                  <button
                    type="button"
                    onClick={() => setConfirmClearLocal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold text-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xoá sạch
                  </button>
                )}
              </div>

              {confirmClearLocal && (
                <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-700 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-200">
                    Xác nhận xoá toàn bộ dữ liệu cục bộ trên máy này?
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmClearLocal(false)}
                      className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 text-[11px] cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLocalDb}
                      className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Xóa sạch
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm Delete Guest Modal */}
        {confirmDeleteGuest && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-700 space-y-2.5">
            <div className="text-xs font-bold text-white">
              Thu hồi và xóa tài khoản khách "{confirmDeleteGuest.displayName}" (
              {confirmDeleteGuest.username})?
            </div>
            <p className="text-[11px] text-rose-200">
              Tài khoản này sẽ không thể xem hay đồng bộ ca bệnh nữa.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteGuest(null)}
                className="px-3 py-1 rounded bg-slate-800 text-slate-200 text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = confirmDeleteGuest;
                  setConfirmDeleteGuest(null);
                  await deleteGuestAccount(target.uid);
                  setMsg(`✓ Đã xóa quyền truy cập của ${target.displayName}.`);
                }}
                className="px-3 py-1 rounded bg-rose-600 text-white font-bold text-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        )}

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
