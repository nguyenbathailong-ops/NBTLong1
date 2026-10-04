import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled || justInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-md">
        <Check className="w-3.5 h-3.5" />
        Đã cài đặt App
      </span>
    );
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setJustInstalled(true);
    }
  };

  return (
    <>
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 text-xs font-medium transition cursor-pointer shadow-sm hover:shadow"
          title="Cài đặt Rhinolog làm App trên Android hoặc Máy tính"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Cài App Android/Web</span>
          <span className="md:hidden">Cài App</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700/80 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cài iOS</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Cài đặt trên iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-300 space-y-2">
              1. Bấm vào nút <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng Safari.<br />
              2. Kéo xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.<br />
              3. Ứng dụng sẽ hoạt động offline 100% như app gốc.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-semibold text-white transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
