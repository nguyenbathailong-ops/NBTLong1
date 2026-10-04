import React, { useState, useRef } from 'react';
import { ClinicalImage } from '../../types/medical';
import { Plus, Trash2, Eye, X, Image as ImageIcon, Camera, FileText } from 'lucide-react';

interface StepImagesProps {
  ctScanImages: ClinicalImage[];
  endoscopyImages: ClinicalImage[];
  onUpdateImages: (
    ctImages: ClinicalImage[],
    endoImages: ClinicalImage[]
  ) => void;
}

export const StepImages: React.FC<StepImagesProps> = ({
  ctScanImages,
  endoscopyImages,
  onUpdateImages,
}) => {
  const [selectedPreview, setSelectedPreview] = useState<ClinicalImage | null>(null);
  const ctFileInputRef = useRef<HTMLInputElement>(null);
  const endoFileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null, type: 'CT_SCAN' | 'ENDOSCOPY') => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        const newImg: ClinicalImage = {
          id: 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          dataUrl,
          title: file.name.replace(/\.[^/.]+$/, ''),
          uploadedAt: Date.now(),
          type,
          timing: 'PRE_OP',
          notes: '',
        };

        if (type === 'CT_SCAN') {
          onUpdateImages([...ctScanImages, newImg], endoscopyImages);
        } else {
          onUpdateImages(ctScanImages, [...endoscopyImages, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = (e: React.ClipboardEvent, type: 'CT_SCAN' | 'ENDOSCOPY') => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const newImg: ClinicalImage = {
              id: 'img-paste-' + Date.now(),
              dataUrl,
              title: `${type === 'CT_SCAN' ? 'CT Scan' : 'Nội soi'} (Ảnh dán ${new Date().toLocaleTimeString('vi-VN')})`,
              uploadedAt: Date.now(),
              type,
              timing: 'PRE_OP',
              notes: 'Ảnh dán từ clipboard',
            };
            if (type === 'CT_SCAN') {
              onUpdateImages([...ctScanImages, newImg], endoscopyImages);
            } else {
              onUpdateImages(ctScanImages, [...endoscopyImages, newImg]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'CT_SCAN' | 'ENDOSCOPY') => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files, type);
  };

  const handleDelete = (id: string, type: 'CT_SCAN' | 'ENDOSCOPY') => {
    if (type === 'CT_SCAN') {
      onUpdateImages(
        ctScanImages.filter((img) => img.id !== id),
        endoscopyImages
      );
    } else {
      onUpdateImages(
        ctScanImages,
        endoscopyImages.filter((img) => img.id !== id)
      );
    }
    if (selectedPreview?.id === id) {
      setSelectedPreview(null);
    }
  };

  const handleUpdateNote = (id: string, notes: string, type: 'CT_SCAN' | 'ENDOSCOPY') => {
    if (type === 'CT_SCAN') {
      onUpdateImages(
        ctScanImages.map((img) => (img.id === id ? { ...img, notes } : img)),
        endoscopyImages
      );
    } else {
      onUpdateImages(
        ctScanImages,
        endoscopyImages.map((img) => (img.id === id ? { ...img, notes } : img))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wider text-emerald-400 uppercase">
            HÌNH ẢNH TRƯỚC MỔ
          </h2>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400 font-mono">
            TÙY CHỌN
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Lưu trữ ngoại tuyến an toàn trên thiết bị (IndexedDB). Đồng bộ khi có kết nối mạng.
        </p>
      </div>

      {/* 1. CT SCAN UPLOAD BOX */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            CT SCAN
          </label>
          <span className="text-xs font-medium text-slate-400">TRƯỚC MỔ</span>
        </div>

        {/* Dropzone */}
        <div
          tabIndex={0}
          onPaste={(e) => handlePaste(e, 'CT_SCAN')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'CT_SCAN')}
          onClick={() => ctFileInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center rounded-xl border border-dashed border-indigo-500/40 hover:border-indigo-400 bg-[#0f172a]/60 hover:bg-[#131d36]/80 p-6 text-center transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <input
            ref={ctFileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files, 'CT_SCAN')}
          />
          <div className="flex items-center gap-2 text-indigo-300 group-hover:text-indigo-200">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium">
              Dán ảnh (Ctrl+V) · kéo-thả · hoặc bấm chọn tệp
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Hỗ trợ ảnh cắt lớp Coronal, Axial, Sagittal (PNG, JPG, DICOM snapshot)
          </p>
        </div>

        {/* CT Images List */}
        {ctScanImages.length === 0 ? (
          <p className="text-xs italic text-slate-500 pl-1">Chưa có ảnh.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {ctScanImages.map((img, index) => (
              <div
                key={img.id}
                className="group relative rounded-lg border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm hover:border-slate-700 transition"
              >
                <div
                  className="aspect-video w-full bg-black/60 relative cursor-pointer overflow-hidden flex items-center justify-center"
                  onClick={() => setSelectedPreview(img)}
                >
                  <img
                    src={img.dataUrl}
                    alt={img.title || 'CT Scan'}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-2">
                    <span className="p-1 rounded bg-slate-800/80 text-white text-xs flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Xem
                    </span>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium truncate">
                    <span className="truncate">{img.title || `CT Lát ${index + 1}`}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(img.id, 'CT_SCAN');
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ghi chú lát cắt (vd: Mở trán Draf, tiêu xương giấy...)"
                    value={img.notes || ''}
                    onChange={(e) => handleUpdateNote(img.id, e.target.value, 'CT_SCAN')}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-400 placeholder:text-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. ENDOSCOPY UPLOAD BOX */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            NỘI SOI TRƯỚC MỔ
          </label>
          <span className="text-xs font-medium text-slate-400">BASELINE</span>
        </div>

        {/* Dropzone */}
        <div
          tabIndex={0}
          onPaste={(e) => handlePaste(e, 'ENDOSCOPY')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'ENDOSCOPY')}
          onClick={() => endoFileInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center rounded-xl border border-dashed border-teal-500/40 hover:border-teal-400 bg-[#061e24]/40 hover:bg-[#082830]/60 p-6 text-center transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-400"
        >
          <input
            ref={endoFileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files, 'ENDOSCOPY')}
          />
          <div className="flex items-center gap-2 text-teal-300 group-hover:text-teal-200">
            <Plus className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-medium">
              Dán ảnh (Ctrl+V) · kéo-thả · hoặc bấm chọn tệp
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Chụp trực tiếp từ camera nội soi hoặc tải ảnh chụp hốc mũi 0°, 30°, 70°
          </p>
        </div>

        {/* Endoscopy Images List */}
        {endoscopyImages.length === 0 ? (
          <p className="text-xs italic text-slate-500 pl-1">Chưa có ảnh.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {endoscopyImages.map((img, index) => (
              <div
                key={img.id}
                className="group relative rounded-lg border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm hover:border-slate-700 transition"
              >
                <div
                  className="aspect-video w-full bg-black/60 relative cursor-pointer overflow-hidden flex items-center justify-center"
                  onClick={() => setSelectedPreview(img)}
                >
                  <img
                    src={img.dataUrl}
                    alt={img.title || 'Nội soi'}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-2">
                    <span className="p-1 rounded bg-slate-800/80 text-white text-xs flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Xem
                    </span>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium truncate">
                    <span className="truncate">{img.title || `Nội soi ${index + 1}`}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(img.id, 'ENDOSCOPY');
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ghi chú hình ảnh (vd: khe giữa mủ đặc, polyp độ 2...)"
                    value={img.notes || ''}
                    onChange={(e) => handleUpdateNote(img.id, e.target.value, 'ENDOSCOPY')}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-teal-400 placeholder:text-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL PREVIEW MODAL */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {selectedPreview.type === 'CT_SCAN' ? 'CT SCAN' : 'NỘI SOI TRƯỚC MỔ'}
                </span>
                <span className="text-sm font-semibold text-white">
                  {selectedPreview.title || 'Xem ảnh phóng to'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-black/90 flex items-center justify-center p-4 overflow-auto min-h-[300px]">
              <img
                src={selectedPreview.dataUrl}
                alt={selectedPreview.title}
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>

            {selectedPreview.notes && (
              <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Ghi chú lâm sàng:</strong> {selectedPreview.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
