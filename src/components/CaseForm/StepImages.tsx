import React, { useState, useRef } from 'react';
import { ClinicalImage } from '../../types/medical';
import { compressImageToDataUrl } from '../../utils/imageCompression';
import {
  Plus,
  Trash2,
  Eye,
  X,
  FileText,
  Camera,
  Scan,
  Stethoscope,
  ArrowLeftRight,
} from 'lucide-react';

interface StepImagesProps {
  ctScanImages: ClinicalImage[];
  endoscopyImages: ClinicalImage[];
  clinicalImages: ClinicalImage[];
  onUpdateImages: (
    ctImages: ClinicalImage[],
    endoImages: ClinicalImage[],
    clinImages: ClinicalImage[]
  ) => void;
}

type ImageType = 'CLINICAL_PHOTO' | 'CT_SCAN' | 'ENDOSCOPY';
type ActiveTab = 'PRE_OP' | 'DISCHARGE' | 'COMPARE';

function isDischargeTiming(timing: ClinicalImage['timing']): boolean {
  return timing === 'DISCHARGE' || timing === 'POST_OP';
}

function getTypeLabel(type: ClinicalImage['type']): string {
  if (type === 'CLINICAL_PHOTO') return 'ẢNH LÂM SÀNG';
  if (type === 'ENDOSCOPY') return 'NỘI SOI';
  return 'CT SCAN';
}

function getTimingLabel(timing: ClinicalImage['timing']): string {
  return isDischargeTiming(timing) ? 'KHI XUẤT VIỆN' : 'TRƯỚC MỔ';
}

export const StepImages: React.FC<StepImagesProps> = ({
  ctScanImages,
  endoscopyImages,
  clinicalImages,
  onUpdateImages,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('PRE_OP');
  const [selectedPreview, setSelectedPreview] = useState<ClinicalImage | null>(null);

  const clinInputRef = useRef<HTMLInputElement>(null);
  const ctInputRef = useRef<HTMLInputElement>(null);
  const endoInputRef = useRef<HTMLInputElement>(null);

  const currentTiming: 'PRE_OP' | 'DISCHARGE' =
    activeTab === 'DISCHARGE' ? 'DISCHARGE' : 'PRE_OP';

  const preOpCount =
    clinicalImages.filter((i) => !isDischargeTiming(i.timing)).length +
    ctScanImages.filter((i) => !isDischargeTiming(i.timing)).length +
    endoscopyImages.filter((i) => !isDischargeTiming(i.timing)).length;

  const dischargeCount =
    clinicalImages.filter((i) => isDischargeTiming(i.timing)).length +
    ctScanImages.filter((i) => isDischargeTiming(i.timing)).length +
    endoscopyImages.filter((i) => isDischargeTiming(i.timing)).length;

  const appendImages = (type: ImageType, newImgs: ClinicalImage[]) => {
    if (newImgs.length === 0) return;
    if (type === 'CT_SCAN') {
      onUpdateImages([...ctScanImages, ...newImgs], endoscopyImages, clinicalImages);
    } else if (type === 'ENDOSCOPY') {
      onUpdateImages(ctScanImages, [...endoscopyImages, ...newImgs], clinicalImages);
    } else {
      onUpdateImages(ctScanImages, endoscopyImages, [...clinicalImages, ...newImgs]);
    }
  };

  const handleFiles = async (
    files: FileList | null,
    type: ImageType,
    timing: 'PRE_OP' | 'DISCHARGE'
  ) => {
    if (!files || files.length === 0) return;

    const newImages: ClinicalImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await compressImageToDataUrl(file);
      if (!dataUrl) continue;

      newImages.push({
        id: 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        dataUrl,
        title: file.name.replace(/\.[^/.]+$/, ''),
        uploadedAt: Date.now(),
        type,
        timing,
        notes: '',
      });
    }

    appendImages(type, newImages);
  };

  const handlePaste = async (
    e: React.ClipboardEvent,
    type: ImageType,
    timing: 'PRE_OP' | 'DISCHARGE'
  ) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const pasted: ClinicalImage[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const dataUrl = await compressImageToDataUrl(file);
          if (!dataUrl) continue;
          const timingText = timing === 'DISCHARGE' ? 'Khi xuất viện' : 'Trước mổ';
          pasted.push({
            id: 'img-paste-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            dataUrl,
            title: `${getTypeLabel(type)} — ${timingText} (${new Date().toLocaleTimeString('vi-VN')})`,
            uploadedAt: Date.now(),
            type,
            timing,
            notes: '',
          });
        }
      }
    }

    appendImages(type, pasted);
  };

  const handleDrop = (
    e: React.DragEvent,
    type: ImageType,
    timing: 'PRE_OP' | 'DISCHARGE'
  ) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files, type, timing);
  };

  const handleDelete = (id: string, type: ImageType) => {
    if (type === 'CT_SCAN') {
      onUpdateImages(
        ctScanImages.filter((img) => img.id !== id),
        endoscopyImages,
        clinicalImages
      );
    } else if (type === 'ENDOSCOPY') {
      onUpdateImages(
        ctScanImages,
        endoscopyImages.filter((img) => img.id !== id),
        clinicalImages
      );
    } else {
      onUpdateImages(
        ctScanImages,
        endoscopyImages,
        clinicalImages.filter((img) => img.id !== id)
      );
    }
    if (selectedPreview?.id === id) {
      setSelectedPreview(null);
    }
  };

  const handleUpdateNote = (id: string, notes: string, type: ImageType) => {
    if (type === 'CT_SCAN') {
      onUpdateImages(
        ctScanImages.map((img) => (img.id === id ? { ...img, notes } : img)),
        endoscopyImages,
        clinicalImages
      );
    } else if (type === 'ENDOSCOPY') {
      onUpdateImages(
        ctScanImages,
        endoscopyImages.map((img) => (img.id === id ? { ...img, notes } : img)),
        clinicalImages
      );
    } else {
      onUpdateImages(
        ctScanImages,
        endoscopyImages,
        clinicalImages.map((img) => (img.id === id ? { ...img, notes } : img))
      );
    }
  };

  const handleToggleTiming = (id: string, type: ImageType) => {
    const toggle = (img: ClinicalImage): ClinicalImage => ({
      ...img,
      timing: isDischargeTiming(img.timing) ? 'PRE_OP' : 'DISCHARGE',
    });

    if (type === 'CT_SCAN') {
      onUpdateImages(
        ctScanImages.map((img) => (img.id === id ? toggle(img) : img)),
        endoscopyImages,
        clinicalImages
      );
    } else if (type === 'ENDOSCOPY') {
      onUpdateImages(
        ctScanImages,
        endoscopyImages.map((img) => (img.id === id ? toggle(img) : img)),
        clinicalImages
      );
    } else {
      onUpdateImages(
        ctScanImages,
        endoscopyImages,
        clinicalImages.map((img) => (img.id === id ? toggle(img) : img))
      );
    }
  };

  const categories: {
    type: ImageType;
    title: string;
    subtitle: string;
    placeholderPreOp: string;
    placeholderDischarge: string;
    accentBorder: string;
    accentBg: string;
    accentText: string;
    accentFocus: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    images: ClinicalImage[];
    icon: React.ReactNode;
  }[] = [
    {
      type: 'CLINICAL_PHOTO',
      title: 'ẢNH LÂM SÀNG (MẮT / MẶT / VẾT MỔ)',
      subtitle: 'Chụp đánh giá sưng nề, sụp mi, lồi mắt, vận nhãn hoặc sẹo mổ',
      placeholderPreOp: 'Ghi chú trước mổ (vd: Sụp mi P, lồi mắt 3mm, hạn chế vận nhãn...)',
      placeholderDischarge: 'Ghi chú khi xuất viện (vd: Hết sưng mắt, mở mắt tốt, thị lực hồi phục...)',
      accentBorder: 'border-amber-500/40 hover:border-amber-400',
      accentBg: 'bg-[#1a1508]/40 hover:bg-[#241d0b]/60',
      accentText: 'text-amber-300',
      accentFocus: 'focus:border-amber-400 focus:ring-amber-400',
      inputRef: clinInputRef,
      images: clinicalImages,
      icon: <Camera className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      type: 'CT_SCAN',
      title: 'CT SCAN MŨI XOANG',
      subtitle: 'Hỗ trợ ảnh cắt lớp Coronal, Axial, Sagittal (PNG, JPG, DICOM snapshot)',
      placeholderPreOp: 'Ghi chú lát cắt trước mổ (vd: Tiêu xương giấy, tụ dịch dưới màng xương...)',
      placeholderDischarge: 'Ghi chú kiểm tra khi xuất viện (vd: Xoang thông thoáng, hết khối áp xe...)',
      accentBorder: 'border-indigo-500/40 hover:border-indigo-400',
      accentBg: 'bg-[#0f172a]/60 hover:bg-[#131d36]/80',
      accentText: 'text-indigo-300',
      accentFocus: 'focus:border-indigo-400 focus:ring-indigo-400',
      inputRef: ctInputRef,
      images: ctScanImages,
      icon: <Scan className="w-3.5 h-3.5 text-indigo-400" />,
    },
    {
      type: 'ENDOSCOPY',
      title: 'NỘI SOI MŨI XOANG',
      subtitle: 'Chụp từ camera nội soi hốc mũi 0°, 30°, 70°',
      placeholderPreOp: 'Ghi chú nội soi trước mổ (vd: Khe giữa mủ đặc, polyp độ 2...)',
      placeholderDischarge: 'Ghi chú nội soi khi xuất viện (vd: Hốc mổ sạch, niêm mạc biểu mô hóa tốt...)',
      accentBorder: 'border-teal-500/40 hover:border-teal-400',
      accentBg: 'bg-[#061e24]/40 hover:bg-[#082830]/60',
      accentText: 'text-teal-300',
      accentFocus: 'focus:border-teal-400 focus:ring-teal-400',
      inputRef: endoInputRef,
      images: endoscopyImages,
      icon: <Stethoscope className="w-3.5 h-3.5 text-teal-400" />,
    },
  ];

  const allPreOpImages = [
    ...clinicalImages.filter((i) => !isDischargeTiming(i.timing)),
    ...ctScanImages.filter((i) => !isDischargeTiming(i.timing)),
    ...endoscopyImages.filter((i) => !isDischargeTiming(i.timing)),
  ];

  const allDischargeImages = [
    ...clinicalImages.filter((i) => isDischargeTiming(i.timing)),
    ...ctScanImages.filter((i) => isDischargeTiming(i.timing)),
    ...endoscopyImages.filter((i) => isDischargeTiming(i.timing)),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wider text-emerald-400 uppercase">
            HÌNH ẢNH TRƯỚC MỔ &amp; KHI XUẤT VIỆN
          </h2>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400 font-mono">
            TÙY CHỌN
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Lưu ngoại tuyến an toàn (IndexedDB) &amp; đồng bộ Cloud theo giai đoạn.
        </p>
      </div>

      {/* Timing Segmented Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0a1120] border border-slate-800 p-1.5 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('PRE_OP')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'PRE_OP'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <span>1. Hình ảnh Trước mổ</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono">
            {preOpCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DISCHARGE')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'DISCHARGE'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <span>2. Hình ảnh Khi xuất viện</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono">
            {dischargeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMPARE')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'COMPARE'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>So sánh ({preOpCount + dischargeCount})</span>
        </button>
      </div>

      {/* Mode 1 & 2: Upload / Manage Pre-Op or Discharge */}
      {activeTab !== 'COMPARE' ? (
        <div className="space-y-5">
          {categories.map((cat) => {
            const scopedImages = cat.images.filter((img) =>
              currentTiming === 'DISCHARGE'
                ? isDischargeTiming(img.timing)
                : !isDischargeTiming(img.timing)
            );

            return (
              <div key={cat.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    {cat.icon}
                    <span>{cat.title}</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                      currentTiming === 'DISCHARGE'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                    }`}
                  >
                    {currentTiming === 'DISCHARGE' ? 'KHI XUẤT VIỆN' : 'TRƯỚC MỔ'} ({scopedImages.length})
                  </span>
                </div>

                {/* Dropzone */}
                <div
                  tabIndex={0}
                  onPaste={(e) => handlePaste(e, cat.type, currentTiming)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, cat.type, currentTiming)}
                  onClick={() => cat.inputRef.current?.click()}
                  className={`group relative flex flex-col items-center justify-center rounded-xl border border-dashed ${cat.accentBorder} ${cat.accentBg} p-5 text-center transition cursor-pointer focus:outline-none focus:ring-1 ${cat.accentFocus}`}
                >
                  <input
                    ref={cat.inputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleFiles(e.target.files, cat.type, currentTiming);
                      e.target.value = '';
                    }}
                  />
                  <div className={`flex items-center gap-2 ${cat.accentText}`}>
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      Dán ảnh (Ctrl+V) · kéo-thả · hoặc bấm chọn tệp (
                      {currentTiming === 'DISCHARGE' ? 'Khi xuất viện' : 'Trước mổ'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{cat.subtitle}</p>
                </div>

                {/* Images Grid */}
                {scopedImages.length === 0 ? (
                  <p className="text-xs italic text-slate-500 pl-1">
                    Chưa có ảnh {currentTiming === 'DISCHARGE' ? 'khi xuất viện' : 'trước mổ'}.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                    {scopedImages.map((img, index) => (
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
                            alt={img.title || cat.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-2">
                            <span className="p-1 rounded bg-slate-800/80 text-white text-xs flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> Xem
                            </span>
                          </div>
                        </div>

                        <div className="p-2 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium gap-1">
                            <span className="truncate">
                              {img.title || `${getTypeLabel(cat.type)} ${index + 1}`}
                            </span>
                            <div className="flex items-center shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTiming(img.id, cat.type);
                                }}
                                className="text-slate-500 hover:text-cyan-300 p-1 cursor-pointer"
                                title={
                                  isDischargeTiming(img.timing)
                                    ? 'Chuyển sang Trước mổ'
                                    : 'Chuyển sang Khi xuất viện'
                                }
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(img.id, cat.type);
                                }}
                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                title="Xóa ảnh"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder={
                              currentTiming === 'DISCHARGE'
                                ? cat.placeholderDischarge
                                : cat.placeholderPreOp
                            }
                            value={img.notes || ''}
                            onChange={(e) => handleUpdateNote(img.id, e.target.value, cat.type)}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-teal-400 placeholder:text-slate-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Mode 3: Side-by-side comparison Pre-Op vs Discharge */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-cyan-800/50 bg-[#0a1324] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                TRƯỚC MỔ (PRE-OP)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {allPreOpImages.length} ảnh
              </span>
            </div>
            {allPreOpImages.length === 0 ? (
              <p className="text-xs italic text-slate-500 py-6 text-center">
                Chưa có hình ảnh trước mổ.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {allPreOpImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedPreview(img)}
                    className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden cursor-pointer hover:border-cyan-500/60 transition"
                  >
                    <div className="aspect-video relative bg-black">
                      <img
                        src={img.dataUrl}
                        alt={img.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-cyan-300">
                        {getTypeLabel(img.type)}
                      </span>
                    </div>
                    <div className="p-1.5 text-[10px] text-slate-300 truncate">
                      {img.notes || img.title || 'Ảnh trước mổ'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-emerald-800/50 bg-[#08171c] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                KHI XUẤT VIỆN (DISCHARGE)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {allDischargeImages.length} ảnh
              </span>
            </div>
            {allDischargeImages.length === 0 ? (
              <p className="text-xs italic text-slate-500 py-6 text-center">
                Chưa có hình ảnh khi xuất viện.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {allDischargeImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedPreview(img)}
                    className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden cursor-pointer hover:border-emerald-500/60 transition"
                  >
                    <div className="aspect-video relative bg-black">
                      <img
                        src={img.dataUrl}
                        alt={img.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-emerald-300">
                        {getTypeLabel(img.type)}
                      </span>
                    </div>
                    <div className="p-1.5 text-[10px] text-slate-300 truncate">
                      {img.notes || img.title || 'Ảnh khi xuất viện'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs px-2 py-0.5 rounded font-mono font-medium border ${
                    isDischargeTiming(selectedPreview.timing)
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  }`}
                >
                  {getTimingLabel(selectedPreview.timing)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-slate-800 text-slate-200 border border-slate-700">
                  {getTypeLabel(selectedPreview.type)}
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
                <span>
                  <strong>Ghi chú lâm sàng:</strong> {selectedPreview.notes}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
