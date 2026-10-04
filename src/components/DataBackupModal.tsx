import React, { useRef, useState } from 'react';
import { PatientCase } from '../types/medical';
import { db } from '../db/indexedDB';
import { ShieldCheck, Download, Upload, Trash2, Check, RefreshCw, X, AlertTriangle } from 'lucide-react';

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
          await db.cases.bulkPut(imported);
          setMsg(`✓ Đã phục hồi thành công ${imported.length} ca bệnh!`);
          onRefresh();
        } else {
          alert('Tập tin không đúng cấu trúc danh sách ca bệnh.');
        }
      } catch (err) {
        alert('Lỗi đọc tập tin JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (confirm('CẢNH BÁO: Thao tác này sẽ xoá toàn bộ ca bệnh khỏi bộ nhớ máy này. Bạn đã sao lưu JSON chưa?')) {
      await db.cases.clear();
      onRefresh();
      setMsg('Đã xoá sạch bộ nhớ đệm.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#090f1d] border border-slate-700 shadow-2xl p-6 text-slate-100 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h3 className="font-serif font-bold text-base text-white">
              An Toàn & Đồng Bộ Dữ Liệu
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {msg && (
          <div className="p-3 rounded-lg bg-teal-950/80 border border-teal-600 text-teal-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            {msg}
          </div>
        )}

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
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
