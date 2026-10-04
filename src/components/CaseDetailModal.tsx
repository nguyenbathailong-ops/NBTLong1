import React, { useState } from 'react';
import { PatientCase, ClinicalImage } from '../types/medical';
import { X, Edit, Eye, Download, Calendar, Activity, Scissors, Image as ImageIcon } from 'lucide-react';

interface CaseDetailModalProps {
  caseItem: PatientCase;
  onClose: () => void;
  onEdit: (c: PatientCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  onClose,
  onEdit,
}) => {
  const [activeImage, setActiveImage] = useState<ClinicalImage | null>(null);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-[#090f1d] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b111e]">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm bg-teal-950 text-teal-400 border border-teal-800 px-2.5 py-1 rounded">
              {caseItem.caseCode}
            </span>
            <h2 className="text-base font-bold text-white">
              {caseItem.primaryDiagnosis}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(caseItem);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition"
            >
              <Edit className="w-3.5 h-3.5" /> Chỉnh sửa ca
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Row 1: Demographics & Surgery summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-slate-500 uppercase font-semibold text-[10px] block">Tuổi / Giới tính</span>
              <span className="text-sm font-bold text-slate-200">{caseItem.age ?? '-'} tuổi / {caseItem.gender}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold text-[10px] block">Địa chỉ & Dân tộc</span>
              <span className="text-sm font-bold text-slate-200">{caseItem.address} ({caseItem.ethnicity})</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold text-[10px] block">Ngày mổ</span>
              <span className="text-sm font-bold font-mono text-cyan-400">{caseItem.surgeryDate}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold text-[10px] block">Độ phức tạp</span>
              <span className="text-sm font-bold text-amber-400">{caseItem.complexityGrade.split('—')[0]}</span>
            </div>
          </div>

          {/* Row 2: Lâm sàng & Biến chứng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <h4 className="font-bold text-teal-400 uppercase text-[11px]">Đặc điểm biến chứng & Mức lan rộng</h4>
              <p>• <strong>Bệnh lý đi kèm:</strong> {[
                caseItem.comorbidities.hypertension ? 'Tăng huyết áp' : null,
                caseItem.comorbidities.diabetes ? 'Đái tháo đường' : null,
                caseItem.comorbidities.tuberculosis ? 'Lao' : null,
                caseItem.comorbidities.cancer ? 'Ung thư' : null,
                caseItem.comorbidities.liverKidneyFailure ? 'Suy gan/thận' : null,
                caseItem.comorbidities.priorSinusSurgery ? 'Tiền căn mổ xoang' : null,
                caseItem.comorbidities.otherDiseases || null,
              ].filter(Boolean).join(', ') || 'Không ghi nhận'}</p>
              <p>• <strong>Lan ổ mắt (Chandler):</strong> {caseItem.diseaseExtent.chandlerGroup}</p>
              <p>• <strong>Lan nội sọ:</strong> {caseItem.diseaseExtent.intracranialExtension.join(', ')}</p>
              <p>• <strong>Điểm CT Lund-Mackay:</strong> <span className="font-mono text-teal-300 font-bold">{caseItem.totalLundMackayScore}/24</span></p>
              <p>• <strong>NPS Polyp Score:</strong> {caseItem.nasalPolypScoreR + caseItem.nasalPolypScoreL}/8</p>
              <p>• <strong>Cấy vi sinh:</strong> {caseItem.diseaseExtent.cultureResult} {caseItem.diseaseExtent.cultureBacteriaName ? `(${caseItem.diseaseExtent.cultureBacteriaName})` : ''}</p>
              <p>• <strong>Giải phẫu bệnh:</strong> {caseItem.diseaseExtent.pathologyResult}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <h4 className="font-bold text-cyan-400 uppercase text-[11px]">Điều trị & Kết cục hậu phẫu</h4>
              <p>• <strong>Phẫu thuật:</strong> {caseItem.treatmentFeatures.surgeryPerformed === 'Có' ? `Có (${caseItem.treatmentFeatures.surgeryCount} lần)` : 'Điều trị nội khoa'}</p>
              <p>• <strong>Thủ thuật thực hiện:</strong> {caseItem.treatmentFeatures.surgicalProcedures?.join(', ') || 'Chưa ghi'}</p>
              <p>• <strong>Kháng sinh:</strong> {caseItem.treatmentFeatures.antibiotics || 'Chưa ghi'}</p>
              <p>• <strong>Số ngày điều trị:</strong> {caseItem.treatmentFeatures.treatmentDays ?? '-'} ngày</p>
              <p>• <strong>Kết quả điều trị:</strong> <span className="text-emerald-400 font-bold">{caseItem.treatmentFeatures.treatmentOutcome}</span></p>
              <p>• <strong>Tử vong:</strong> {caseItem.treatmentFeatures.mortality}</p>
            </div>
          </div>

          {/* Row 3: HÌNH ẢNH CT VÀ NỘI SOI TRƯỚC MỔ */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-emerald-400 uppercase text-[11px] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" /> Hình ảnh CT Scan & Nội soi trước mổ
              </h4>
              <span className="text-slate-400 text-[11px]">
                {(caseItem.images?.ctScanImages?.length || 0) + (caseItem.images?.endoscopyImages?.length || 0)} ảnh
              </span>
            </div>

            {(caseItem.images?.ctScanImages?.length || 0) + (caseItem.images?.endoscopyImages?.length || 0) === 0 ? (
              <p className="text-slate-500 italic py-2">Ca này chưa đính kèm hình ảnh.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {caseItem.images?.ctScanImages?.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActiveImage(img)}
                    className="group rounded-lg border border-slate-800 overflow-hidden bg-black/60 cursor-pointer hover:border-teal-500 transition"
                  >
                    <div className="aspect-video relative">
                      <img src={img.dataUrl} alt={img.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-cyan-300">
                        CT
                      </span>
                    </div>
                    <div className="p-1.5 text-[10px] text-slate-300 truncate">
                      {img.title}
                    </div>
                  </div>
                ))}

                {caseItem.images?.endoscopyImages?.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActiveImage(img)}
                    className="group rounded-lg border border-slate-800 overflow-hidden bg-black/60 cursor-pointer hover:border-teal-500 transition"
                  >
                    <div className="aspect-video relative">
                      <img src={img.dataUrl} alt={img.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-emerald-300">
                        NỘI SOI
                      </span>
                    </div>
                    <div className="p-1.5 text-[10px] text-slate-300 truncate">
                      {img.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal viewer for single image */}
        {activeImage && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
            <div className="relative max-w-3xl w-full flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2 bg-slate-950 border-b border-slate-800">
                <span className="text-xs font-bold text-white">{activeImage.title}</span>
                <button onClick={() => setActiveImage(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 flex items-center justify-center bg-black min-h-[300px]">
                <img src={activeImage.dataUrl} alt={activeImage.title} className="max-h-[70vh] object-contain" />
              </div>
              {activeImage.notes && (
                <div className="p-3 bg-slate-950 text-xs text-slate-300 border-t border-slate-800">
                  <strong>Ghi chú:</strong> {activeImage.notes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
