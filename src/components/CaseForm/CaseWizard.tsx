import React, { useState, useEffect } from 'react';
import { PatientCase } from '../../types/medical';
import { StepPatient } from './StepPatient';
import { StepPreOpClinical } from './StepPreOpClinical';
import { StepPreOpLabCT } from './StepPreOpLabCT';
import { StepIntraOp } from './StepIntraOp';
import { StepPostOp } from './StepPostOp';
import { StepImages } from './StepImages';
import { auditSingleCase } from '../../utils/validationAudit';
import { db } from '../../db/indexedDB';
import { Check, HelpCircle, ArrowLeft, ArrowRight, Save, X } from 'lucide-react';

interface CaseWizardProps {
  initialCase: PatientCase;
  onSave: (savedCase: PatientCase) => void;
  onCancel: () => void;
}

export const CaseWizard: React.FC<CaseWizardProps> = ({
  initialCase,
  onSave,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [caseData, setCaseData] = useState<PatientCase>({ ...initialCase });
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Keyboard shortcut: Ctrl/Cmd + Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [caseData]);

  const updateCase = (updates: Partial<PatientCase>) => {
    setCaseData((prev) => ({
      ...prev,
      ...updates,
      updatedAt: Date.now(),
    }));
  };

  // Count steps with entered data
  const calculateDataStepsCount = (): number => {
    let count = 0;
    if (caseData.caseCode && caseData.age) count++;
    if (caseData.admissionReasons?.length > 0 || caseData.symptomDurationDays !== null) count++;
    if (caseData.totalLundMackayScore > 0 || caseData.diseaseExtent.chandlerGroup !== 'Không lan ổ mắt (Nhóm 0)') count++;
    if (caseData.treatmentFeatures.surgicalProcedures?.length > 0 || caseData.treatmentFeatures.antibiotics) count++;
    if (caseData.treatmentFeatures.treatmentDays !== null || caseData.treatmentFeatures.treatmentOutcome) count++;
    if ((caseData.images?.ctScanImages?.length || 0) + (caseData.images?.endoscopyImages?.length || 0) > 0) count++;
    return count;
  };

  const steps = [
    { number: 1, label: 'Bệnh nhân' },
    { number: 2, label: 'Trước mổ' },
    { number: 3, label: 'Checklist CT' },
    { number: 4, label: 'Trong mổ' },
    { number: 5, label: 'Kết quả' },
    { number: 6, label: 'Hình ảnh' },
  ];

  const handleSave = async () => {
    // Run audit before saving
    const audit = auditSingleCase(caseData);
    const updatedCase: PatientCase = {
      ...caseData,
      updatedAt: Date.now(),
      auditStatus: {
        completionPercentage: audit.completionPercentage,
        hasInconsistencies: audit.inconsistencyCount > 0,
        inconsistencyCount: audit.inconsistencyCount,
        missingRequiredCount: audit.missingRequiredCount,
        issues: audit.issues.map((i) => i.message),
        lastAuditedAt: Date.now(),
      },
    };

    // Save to IndexedDB
    await db.cases.put(updatedCase);
    setSaveSuccessMsg('✓ Đã lưu hồ sơ thành công vào cơ sở dữ liệu nội tuyến!');
    setTimeout(() => {
      onSave(updatedCase);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs flex flex-col p-2 sm:p-4 md:p-6">
      <div className="relative w-full max-w-5xl mx-auto my-auto bg-[#070b14] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0b111e]">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-serif font-bold text-white tracking-tight">
              {caseData.id.startsWith('case-') ? 'Ghi nhận ca mổ mới' : `Chỉnh sửa ca: ${caseData.caseCode}`}
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {caseData.caseCode || 'Chưa đặt mã'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-xs font-mono text-slate-400">
              Ctrl/⌘+Enter để lưu
            </span>
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Đóng (Hủy)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEPPER PROGRESS */}
        <div className="px-5 pt-4 pb-3 bg-[#090f1d] border-b border-slate-800/80">
          {/* Stepper circles */}
          <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4">
            {/* Connecting line */}
            <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-slate-800 -z-0">
              <div
                className="h-full bg-teal-400 transition-all duration-300"
                style={{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {steps.map((s) => {
              const isCurrent = s.number === currentStep;
              const isCompleted = s.number < currentStep;

              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => setCurrentStep(s.number)}
                  className="flex flex-col items-center group relative z-10 cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition duration-200 border-2 ${
                      isCurrent
                        ? 'bg-teal-400 border-teal-400 text-slate-950 shadow-md shadow-teal-500/20'
                        : isCompleted
                        ? 'bg-slate-900 border-teal-500 text-teal-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 group-hover:border-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.number}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 transition ${
                      isCurrent
                        ? 'text-teal-400'
                        : isCompleted
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-status line */}
          <div className="flex items-center justify-between pt-3 text-xs text-slate-400 max-w-3xl mx-auto">
            <div className="text-cyan-400 font-mono text-[11px] flex items-center gap-1.5">
              <span>
                Bước {currentStep}/6 — {steps[currentStep - 1].label}
              </span>
              <span>·</span>
              <span className="text-teal-400">
                đã có dữ liệu ở {calculateDataStepsCount()} bước
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-[11px] text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                {showAdvanced ? '– Ẩn nâng cao' : '+ Hiện nâng cao'}
              </button>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="w-5 h-5 rounded-full border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[11px]"
                title="Hướng dẫn nhập liệu"
              >
                ?
              </button>
            </div>
          </div>
        </div>

        {/* STEP CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 max-h-[68vh] space-y-4">
          {saveSuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              {saveSuccessMsg}
            </div>
          )}

          {currentStep === 1 && (
            <StepPatient data={caseData} onChange={updateCase} />
          )}

          {currentStep === 2 && (
            <StepPreOpClinical data={caseData} onChange={updateCase} />
          )}

          {currentStep === 3 && (
            <StepPreOpLabCT data={caseData} onChange={updateCase} />
          )}

          {currentStep === 4 && (
            <StepIntraOp data={caseData} onChange={updateCase} />
          )}

          {currentStep === 5 && (
            <StepPostOp data={caseData} onChange={updateCase} />
          )}

          {currentStep === 6 && (
            <StepImages
              ctScanImages={caseData.images.ctScanImages}
              endoscopyImages={caseData.images.endoscopyImages}
              onUpdateImages={(ctImages, endoImages) =>
                updateCase({
                  images: {
                    ctScanImages: ctImages,
                    endoscopyImages: endoImages,
                  },
                })
              }
            />
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-[#090f1d]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-300 transition cursor-pointer"
          >
            Hủy
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
              </button>
            )}

            {currentStep < 6 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
              >
                Tiếp <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Lưu ngay
            </button>
          </div>
        </div>

        {/* HELP MODAL */}
        {showHelpModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4">
            <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Hướng dẫn nhập liệu
                </h4>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs space-y-2.5 mt-3 text-slate-300">
                <p>
                  • <strong>Quy ước Lund-Mackay CT</strong>: Bên phải bệnh nhân (P) hiển thị ở bên trái giao diện màn hình.
                </p>
                <p>
                  • <strong>Chèn hình ảnh</strong>: Ở bước 6 hoặc dán bất cứ lúc nào bằng tổ hợp phím <code>Ctrl+V</code>.
                </p>
                <p>
                  • <strong>Phím tắt</strong>: Nhấn <code>Ctrl+Enter</code> (hoặc <code>Cmd+Enter</code> trên Mac) để lưu nhanh hồ sơ bất cứ lúc nào.
                </p>
                <p>
                  • <strong>Chạy ngoại tuyến (Offline)</strong>: Dữ liệu được lưu ngay vào bộ nhớ trình duyệt / Android máy của bạn mà không cần mạng. Khi có mạng, dữ liệu sẽ tự động đồng bộ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="mt-4 w-full py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
