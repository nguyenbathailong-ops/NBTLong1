/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PatientCase } from './types/medical';
import { db, initializeDatabase, createBlankCase } from './db/indexedDB';
import { AppTab, Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CaseList } from './components/CaseList';
import { DataReconciliation } from './components/DataReconciliation';
import { AnalyticsView } from './components/AnalyticsView';
import { ClinicalKnowledge } from './components/ClinicalKnowledge';
import { TrashView } from './components/TrashView';
import { CaseWizard } from './components/CaseForm/CaseWizard';
import { CaseDetailModal } from './components/CaseDetailModal';
import { DataBackupModal } from './components/DataBackupModal';
import { FirebaseProvider, useFirebaseSync } from './contexts/FirebaseContext';
import {
  moveCaseToTrash,
  permanentlyDeleteCase,
  restoreCaseFromTrash,
} from './services/cloudSync';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { auditSingleCase } from './utils/validationAudit';
import { WifiOff, Plus, HelpCircle, X } from 'lucide-react';

interface AppContentProps {
  cases: PatientCase[];
  loading: boolean;
  reloadCases: () => Promise<void>;
}

function AppContent({ cases, loading, reloadCases }: AppContentProps) {
  const { account, isAdmin } = useFirebaseSync();
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');

  const [editingCase, setEditingCase] = useState<PatientCase | null>(null);
  const [viewingCase, setViewingCase] = useState<PatientCase | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const isOnline = useOnlineStatus();

  const activeCases = useMemo(() => cases.filter((c) => !c.isTrashed), [cases]);
  const trashedCases = useMemo(
    () => (isAdmin ? cases.filter((c) => c.isTrashed === true) : []),
    [cases, isAdmin]
  );

  // If a user logs out or switches to Guest while on Admin-only tabs, return to dashboard
  useEffect(() => {
    if ((currentTab === 'trash' || currentTab === 'ai') && !isAdmin) {
      setCurrentTab('dashboard');
    }
  }, [currentTab, isAdmin]);

  // Calculate total audit issues count for badge (active cases only)
  const totalIssuesCount = activeCases.reduce((acc, curr) => {
    const audit = auditSingleCase(curr);
    return acc + audit.inconsistencyCount;
  }, 0);

  const handleAddNewCase = () => {
    const blank = createBlankCase();
    setEditingCase(blank);
  };

  const handleEditCase = (c: PatientCase) => {
    setEditingCase(c);
  };

  const handleMoveToTrash = async (id: string) => {
    await moveCaseToTrash(account, id);
    await reloadCases();
  };

  const handleRestoreFromTrash = async (id: string) => {
    if (!account || account.role !== 'admin') return;
    await restoreCaseFromTrash(account, id);
    await reloadCases();
  };

  const handlePermanentDelete = async (id: string) => {
    if (account && account.role !== 'admin') return;
    await permanentlyDeleteCase(account, id);
    await reloadCases();
  };

  const handleEmptyTrash = async () => {
    if (!account || account.role !== 'admin') return;
    for (const c of trashedCases) {
      await permanentlyDeleteCase(account, c.id);
    }
    await reloadCases();
  };

  const handleSaveCase = async () => {
    setEditingCase(null);
    await reloadCases();
  };

  const handleChangeZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(130, Math.max(80, prev + delta)));
  };

  return (
    <div
      className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans transition-all duration-150"
      style={{ fontSize: `${zoomLevel}%` }}
    >
      {/* HEADER */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'security') {
            setShowSafetyModal(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenGuide={() => setShowGuideModal(true)}
        issuesCount={totalIssuesCount}
        trashCount={trashedCases.length}
        zoomLevel={zoomLevel}
        onChangeZoom={handleChangeZoom}
      />

      {/* OFFLINE STATUS NOTIFICATION BANNER */}
      {!isOnline && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>Chế độ Ngoại tuyến (Offline):</strong> Bạn có thể tiếp tục nhập số liệu, dán ảnh CT & nội soi bình thường. Dữ liệu sẽ lưu trữ an toàn trong IndexedDB và tự động đồng bộ khi có Internet.
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400 uppercase">OFFLINE ACTIVE</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Đang nạp cơ sở dữ liệu lâm sàng IndexedDB...</p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                cases={activeCases}
                trashedCount={trashedCases.length}
                onAddNewCase={handleAddNewCase}
                onOpenAudit={() => setCurrentTab('reconciliation')}
                onOpenTrash={() => setCurrentTab('trash')}
                onOpenAiAnalytics={() => setCurrentTab('ai')}
                onOpenSafetyModal={() => setShowSafetyModal(true)}
                onOpenGuide={() => setShowGuideModal(true)}
                onSelectCase={(c) => setViewingCase(c)}
              />
            )}

            {currentTab === 'cases' && (
              <CaseList
                cases={activeCases}
                onAddNew={handleAddNewCase}
                onEdit={handleEditCase}
                onMoveToTrash={handleMoveToTrash}
                onPermanentDelete={handlePermanentDelete}
                onViewDetails={(c) => setViewingCase(c)}
              />
            )}

            {currentTab === 'reconciliation' && (
              <DataReconciliation
                cases={activeCases}
                onEditCase={handleEditCase}
                onRefreshCases={reloadCases}
              />
            )}

            {currentTab === 'analytics' && <AnalyticsView cases={activeCases} initialMode="stats" />}

            {currentTab === 'ai' && isAdmin && <AnalyticsView cases={activeCases} initialMode="ai" />}

            {currentTab === 'knowledge' && <ClinicalKnowledge />}

            {currentTab === 'trash' && isAdmin && (
              <TrashView
                trashedCases={trashedCases}
                onRestore={handleRestoreFromTrash}
                onPermanentDelete={handlePermanentDelete}
                onEmptyTrash={handleEmptyTrash}
              />
            )}
          </>
        )}
      </main>

      {/* FLOATING ACTION BUTTON (MOBILE QUICK NEW CASE) */}
      <div className="fixed bottom-5 right-5 z-40 lg:hidden">
        <button
          type="button"
          onClick={handleAddNewCase}
          className="w-13 h-13 rounded-full bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold flex items-center justify-center shadow-2xl shadow-teal-500/40 cursor-pointer transition active:scale-95"
          title="Ghi ca mổ mới"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* WIZARD MODAL (NEW / EDIT CASE) */}
      {editingCase && (
        <CaseWizard
          initialCase={editingCase}
          onSave={handleSaveCase}
          onCancel={() => setEditingCase(null)}
        />
      )}

      {/* CASE DETAIL VIEW MODAL */}
      {viewingCase && (
        <CaseDetailModal
          caseItem={viewingCase}
          onClose={() => setViewingCase(null)}
          onEdit={(c) => {
            setViewingCase(null);
            setEditingCase(c);
          }}
        />
      )}

      {/* ACCOUNT, SYNC & BACKUP MODAL */}
      {showSafetyModal && (
        <DataBackupModal
          cases={activeCases}
          onClose={() => setShowSafetyModal(false)}
          onRefresh={reloadCases}
        />
      )}

      {/* HELP GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#090f1d] border border-slate-700 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-400" />
                <h3 className="font-serif font-bold text-base text-white">
                  Hướng Dẫn Sử Dụng Rhinolog Offline
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-teal-400 block mb-1">1. Phân quyền Admin & Tài khoản khách:</strong>
                Tài khoản <strong>Admin</strong> có thể tạo thêm tài khoản khách, xóa vĩnh viễn ca bệnh và xem <strong>Thùng rác</strong> để hoàn tác hoặc xóa bỏ ca bệnh do khách xóa. Tài khoản khách chỉ thêm, sửa, xem ca bệnh; khi xóa sẽ chuyển vào Thùng rác của Admin.
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-teal-400 block mb-1">2. Khả năng chạy Offline & Cài đặt App (PWA):</strong>
                Rhinolog hoạt động 100% không cần kết nối mạng. Dữ liệu lưu trong IndexedDB và tự động đồng bộ hai chiều ngay khi có Internet.
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-teal-400 block mb-1">3. Chèn hình ảnh CT Scan & Nội soi trước mổ:</strong>
                Ở bước 6 (Hình ảnh) hoặc bất cứ lúc nào, bạn có thể bấm trực tiếp vào vùng tải ảnh, kéo thả ảnh hoặc nhấn <code>Ctrl+V</code> để dán ảnh chụp màn hình ngay tức thì.
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-teal-400 block mb-1">4. Xuất dữ liệu nghiên cứu khoa học:</strong>
                Tại tab "Ca bệnh", bạn có thể xuất CSV đầy đủ, CSV khử định danh (phục vụ viết bài báo khoa học) hoặc xuất Báo cáo in ấn HTML.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
            >
              Đã hiểu & Bắt đầu làm việc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const reloadCases = useCallback(async () => {
    try {
      await initializeDatabase();
      const all = await db.cases.toArray();
      all.sort((a, b) => b.updatedAt - a.updatedAt);
      setCases(all);
    } catch (e) {
      console.error('Error loading cases:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadCases();
  }, [reloadCases]);

  return (
    <FirebaseProvider onCasesChanged={reloadCases}>
      <AppContent cases={cases} loading={loading} reloadCases={reloadCases} />
    </FirebaseProvider>
  );
}
