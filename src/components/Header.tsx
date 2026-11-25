import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { useFirebaseSync } from '../contexts/FirebaseContext';
import {
  Home,
  ListFilter,
  BarChart3,
  BookOpen,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  LogIn,
  Shield,
  User as UserIcon,
  Trash2,
} from 'lucide-react';

export type AppTab =
  | 'dashboard'
  | 'cases'
  | 'reconciliation'
  | 'analytics'
  | 'knowledge'
  | 'trash'
  | 'security';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenGuide: () => void;
  issuesCount: number;
  trashCount: number;
  zoomLevel: number;
  onChangeZoom: (delta: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenGuide,
  issuesCount,
  trashCount,
  zoomLevel,
  onChangeZoom,
}) => {
  const isOnline = useOnlineStatus();
  const { account, isAdmin, isSyncing } = useFirebaseSync();

  return (
    <header className="sticky top-0 z-40 bg-[#070d19]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center font-bold text-slate-950 font-mono text-xl shadow-lg shadow-teal-500/20 group-hover:scale-105 transition">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black tracking-wider text-base text-white">
                  RHINOLOG
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-teal-950 text-teal-400 border border-teal-800">
                  OFFLINE + CLOUD
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ghi ca · kết quả · đồng bộ đa thiết bị
              </p>
            </div>
          </div>

          {/* Mobile Right Quick Status */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTab('security')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                account
                  ? isAdmin
                    ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                    : 'bg-cyan-950/70 border-cyan-700 text-cyan-300'
                  : 'bg-teal-500/20 border-teal-500/50 text-teal-300'
              }`}
            >
              {account ? (
                <>
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isAdmin ? 'Admin' : 'Khách'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
            <PWAInstallButton />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              currentTab === 'dashboard'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Hôm nay</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('cases')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              currentTab === 'cases'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Ca bệnh</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('reconciliation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              currentTab === 'reconciliation'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Đối soát</span>
            {issuesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950">
                {issuesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              currentTab === 'analytics'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Kết quả</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('knowledge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              currentTab === 'knowledge'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kiến thức</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onSelectTab('trash')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                currentTab === 'trash'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Thùng rác</span>
              {trashCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white">
                  {trashCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              currentTab === 'security'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'Tài khoản & Sao lưu' : 'Đồng bộ & Sao lưu'}</span>
          </button>
        </nav>

        {/* Right utility buttons */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Account Auth / Role Status */}
          <button
            type="button"
            onClick={() => onSelectTab('security')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition cursor-pointer ${
              account
                ? isAdmin
                  ? 'bg-amber-950/60 border-amber-700 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-cyan-950/60 border-cyan-700 text-cyan-300 hover:bg-cyan-900/60'
                : 'bg-teal-400 hover:bg-teal-300 border-teal-400 text-slate-950 font-bold'
            }`}
            title={
              account
                ? `${account.displayName} (${account.username})`
                : 'Đăng nhập hoặc khởi tạo tài khoản Admin'
            }
          >
            {account ? (
              <>
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isAdmin ? (
                  <Shield className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-cyan-300" />
                )}
                <span>
                  {isSyncing
                    ? 'Đang đồng bộ...'
                    : `${isAdmin ? 'ADMIN' : 'KHÁCH'} · ${account.displayName}`}
                </span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </>
            )}
          </button>

          {/* Online/Offline Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium ${
              isOnline
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400'
                : 'bg-amber-950/60 border border-amber-800 text-amber-300'
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Đã kết nối</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Offline (Lưu máy)</span>
              </>
            )}
          </div>

          {/* PWA Install */}
          <PWAInstallButton />

          {/* Guide button */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hướng dẫn</span>
          </button>

          {/* Text Zoom scale */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 text-xs font-mono text-slate-300 overflow-hidden">
            <button
              type="button"
              onClick={() => onChangeZoom(-10)}
              className="px-2 py-1 hover:bg-slate-800 transition cursor-pointer border-r border-slate-800"
              title="Thu nhỏ chữ"
            >
              A–
            </button>
            <span className="px-2 py-1 text-[11px] text-slate-400 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => onChangeZoom(10)}
              className="px-2 py-1 hover:bg-slate-800 transition cursor-pointer border-l border-slate-800"
              title="Phóng to chữ"
            >
              A+
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
