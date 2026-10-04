/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PatientCase } from './types/medical';
import { db, initializeDatabase, createBlankCase } from './db/indexedDB';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CaseList } from './components/CaseList';
import { DataReconciliation } from './components/DataReconciliation';
import { AnalyticsView } from './components/AnalyticsView';
import { ClinicalKnowledge } from './components/ClinicalKnowledge';
import { CaseWizard } from './components/CaseForm/CaseWizard';
import { CaseDetailModal } from './components/CaseDetailModal';
import { DataBackupModal } from './components/DataBackupModal';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { auditSingleCase } from './utils/validationAudit';
import { WifiOff, Plus, HelpCircle, X, ShieldAlert } from 'lucide-react';

export default function App() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'cases' | 'reconciliation' | 'analytics' | 'knowledge' | 'security'
  >('dashboard');

  const [editingCase, setEditingCase] = useState<PatientCase | null>(null);
  const [viewingCase, setViewingCase] = useState<PatientCase | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const isOnline = useOnlineStatus();

  // Load cases from IndexedDB
  const reloadCases = async () => {
    try {
      await initializeDatabase();
      const all = await db.cases.toArray();
      // Sort newest first
      all.sort((a, b) => b.updatedAt - a.updatedAt);
      setCases(all);
    } catch (e) {
      console.error('Error loading cases:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadCases();
  }, []);

  // Calculate total audit issues count for badge
  const totalIssuesCount = cases.reduce((acc, curr) => {
    const audit = auditSingleCase(curr);
    return acc + audit.inconsistencyCount;
  }, 0);

  const handleAddNewCase = () => {
    const blank = createBlankCase();
    setEditingCase(blank);
  };

  const handleEditCase = (c: PatientCase, initialStep?: number) => {
    setEditingCase(c);
  };

  const handleDeleteCase = async (id: string) => {
    await db.cases.delete(id);
    await reloadCases();
  };

  const handleSaveCase = async (saved: PatientCase) => {
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
                cases={cases}
                onAddNewCase={handleAddNewCase}
                onOpenAudit={() => setCurrentTab('reconciliation')}
                onOpenSafetyModal={() => setShowSafetyModal(true)}
                onOpenGuide={() => setShowGuideModal(true)}
                onSelectCase={(c) => setViewingCase(c)}
              />
            )}

            {currentTab === 'cases' && (
              <CaseList
                cases={cases}
                onAddNew={handleAddNewCase}
                onEdit={handleEditCase}
                onDelete={handleDeleteCase}
                onViewDetails={(c) => setViewingCase(c)}
              />
            )}

            {currentTab === 'reconciliation' && (
              <DataReconciliation
                cases={cases}
                onEditCase={handleEditCase}
                onRefreshCases={reloadCases}
              />
            )}

            {currentTab === 'analytics' && <AnalyticsView cases={cases} />}

            {currentTab === 'knowledge' && <ClinicalKnowledge />}
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

      {/* SAFETY & BACKUP MODAL */}
      {showSafetyModal && (
        <DataBackupModal
          cases={cases}
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
                <strong className="text-teal-400 block mb-1">1. Khả năng chạy Offline & Cài đặt App (PWA):</strong>
                Rhinolog hoạt động 100% không cần kết nối mạng. Bạn có thể bấm nút <strong>"Cài App Android/Web"</strong> trên thanh điều hướng để cài trực tiếp lên màn hình điện thoại Android như một ứng dụng gốc.
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-teal-400 block mb-1">2. Chèn hình ảnh CT Scan & Nội soi trước mổ:</strong>
                Ở bước 6 (Hình ảnh) hoặc bất cứ lúc nào, bạn có thể bấm trực tiếp vào vùng tải ảnh, kéo thả ảnh hoặc nhấn <code>Ctrl+V</code> để dán ảnh chụp màn hình ngay tức thì.
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-teal-400 block mb-1">3. Tính năng Đối Soát Dữ Liệu (Reconciliation):</strong>
                Tab <strong>"Đối soát"</strong> sẽ tự động kiểm tra xem có mâu thuẫn logic y học nào không (ví dụ: Không mổ nhưng lại có số lần mổ, điểm GCS lệch với phân loại hôn mê, hoặc biến chứng ổ mắt Chandler không khớp với triệu chứng mắt). Bạn có thể bấm vào nút "Sửa ở Bước X" để mở ngay trường cần sửa.
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
