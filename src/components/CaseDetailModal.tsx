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
              <p>• <strong>Phương pháp phẫu thuật:</strong> {caseItem.treatmentFeatures.surgicalProcedures?.join(', ') || 'Chưa ghi'}</p>
              <p>• <strong>Kháng sinh:</strong> {caseItem.treatmentFeatures.antibiotics || 'Chưa ghi'}</p>
              <p>• <strong>Thuốc kháng nấm:</strong> {caseItem.treatmentFeatures.antifungals?.length ? caseItem.treatmentFeatures.antifungals.join(', ') : 'Không'}</p>
              <p>• <strong>Số ngày điều trị:</strong> {caseItem.treatmentFeatures.treatmentDays ?? '-'} ngày</p>
              <p>
                • <strong>Kết quả điều trị lúc xuất viện:</strong>{' '}
                <span
                  className={`font-bold ${
                    caseItem.treatmentFeatures.treatmentOutcome === 'Tử vong'
                      ? 'text-rose-400'
                      : caseItem.treatmentFeatures.treatmentOutcome === 'Còn di chứng sau điều trị'
                      ? 'text-amber-300'
                      : 'text-emerald-400'
                  }`}
                >
                  {caseItem.treatmentFeatures.treatmentOutcome}
                </span>
              </p>
              <p>• <strong>Di chứng sau điều trị:</strong> {(() => {
                const sq = caseItem.treatmentFeatures.sequelae;
                if (!sq) return 'Không ghi nhận';
                const list = [
                  sq.ptosis === 'Có' ? 'Sụp mi' : null,
                  sq.proptosis === 'Có' ? 'Lồi mắt' : null,
                  sq.visualLossOrDecrease === 'Có' ? 'Mất/giảm thị lực' : null,
                  sq.ocularMobilityDisorder === 'Có' ? 'Rối loạn vận nhãn' : null,
                  sq.diplopia === 'Có' ? 'Nhìn đôi' : null,
                  sq.focalNeurologicalDeficit === 'Có' ? 'Dấu thần kinh định vị' : null,
                  sq.seizures === 'Có' ? 'Co giật' : null,
                  sq.meningitis === 'Có' ? 'Viêm màng não' : null,
                  sq.brainAbscess === 'Có' ? 'Áp xe não' : null,
                  sq.csfLeak === 'Có' ? 'Rò dịch não tủy' : null,
                  sq.cerebralInfarction === 'Có' ? 'Nhồi máu não' : null,
                  sq.otherSequelae === 'Có' ? (sq.otherSequelaeDetails || 'Di chứng khác') : null,
                ].filter(Boolean);
                return list.length > 0 ? <span className="text-amber-300 font-semibold">{list.join(', ')}</span> : 'Không có di chứng';
              })()}</p>
              <p>• <strong>Tử vong:</strong> {caseItem.treatmentFeatures.mortality}</p>
            </div>
          </div>

          {/* Row 3: HÌNH ẢNH TRƯỚC MỔ & KHI XUẤT VIỆN */}
          {(() => {
            const allImages: ClinicalImage[] = [
              ...(caseItem.images?.clinicalImages || []),
              ...(caseItem.images?.ctScanImages || []),
              ...(caseItem.images?.endoscopyImages || []),
            ];
            const preOpImages = allImages.filter(
              (img) => img.timing !== 'DISCHARGE' && img.timing !== 'POST_OP'
            );
            const dischargeImages = allImages.filter(
              (img) => img.timing === 'DISCHARGE' || img.timing === 'POST_OP'
            );
            const typeBadge = (type: ClinicalImage['type']) =>
              type === 'CLINICAL_PHOTO'
                ? { text: 'LÂM SÀNG', cls: 'text-amber-300' }
                : type === 'ENDOSCOPY'
                ? { text: 'NỘI SOI', cls: 'text-emerald-300' }
                : { text: 'CT', cls: 'text-cyan-300' };

            return (
              <div className="space-y-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-400 uppercase text-[11px] flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Hình ảnh Trước mổ &amp; Khi xuất viện
                  </h4>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {preOpImages.length} trước mổ · {dischargeImages.length} xuất viện
                  </span>
                </div>

                {allImages.length === 0 ? (
                  <p className="text-slate-500 italic py-2">Ca này chưa đính kèm hình ảnh.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Trước mổ */}
                    <div className="space-y-2">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                        Trước mổ ({preOpImages.length})
                      </span>
                      {preOpImages.length === 0 ? (
                        <p className="text-slate-500 italic text-[11px]">Chưa có ảnh trước mổ.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {preOpImages.map((img) => {
                            const badge = typeBadge(img.type);
                            return (
                              <div
                                key={img.id}
                                onClick={() => setActiveImage(img)}
                                className="group rounded-lg border border-slate-800 overflow-hidden bg-black/60 cursor-pointer hover:border-cyan-500 transition"
                              >
                                <div className="aspect-video relative">
                                  <img
                                    src={img.dataUrl}
                                    alt={img.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <span
                                    className={`absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono ${badge.cls}`}
                                  >
                                    {badge.text}
                                  </span>
                                </div>
                                <div className="p-1.5 text-[10px] text-slate-300 truncate">
                                  {img.notes || img.title}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Khi xuất viện */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/70">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
                        Khi xuất viện ({dischargeImages.length})
                      </span>
                      {dischargeImages.length === 0 ? (
                        <p className="text-slate-500 italic text-[11px]">Chưa có ảnh khi xuất viện.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {dischargeImages.map((img) => {
                            const badge = typeBadge(img.type);
                            return (
                              <div
                                key={img.id}
                                onClick={() => setActiveImage(img)}
                                className="group rounded-lg border border-slate-800 overflow-hidden bg-black/60 cursor-pointer hover:border-emerald-500 transition"
                              >
                                <div className="aspect-video relative">
                                  <img
                                    src={img.dataUrl}
                                    alt={img.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <span
                                    className={`absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono ${badge.cls}`}
                                  >
                                    {badge.text}
                                  </span>
                                </div>
                                <div className="p-1.5 text-[10px] text-slate-300 truncate">
                                  {img.notes || img.title}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Modal viewer for single image */}
        {activeImage && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
            <div className="relative max-w-3xl w-full flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      activeImage.timing === 'DISCHARGE' || activeImage.timing === 'POST_OP'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}
                  >
                    {activeImage.timing === 'DISCHARGE' || activeImage.timing === 'POST_OP'
                      ? 'KHI XUẤT VIỆN'
                      : 'TRƯỚC MỔ'}
                  </span>
                  <span className="text-xs font-bold text-white">{activeImage.title}</span>
                </div>
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
