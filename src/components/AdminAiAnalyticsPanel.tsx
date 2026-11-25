import React, { useState } from 'react';
import { PatientCase } from '../types/medical';
import { requestAdminAiAnalysis, AiAnalysisResponse } from '../services/aiAnalytics';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import {
  Sparkles,
  Shield,
  Send,
  Copy,
  Check,
  AlertTriangle,
  WifiOff,
  Loader2,
  Lock,
} from 'lucide-react';

interface AdminAiAnalyticsPanelProps {
  cases: PatientCase[];
}

const PRESET_PROMPTS = [
  {
    id: 'overview',
    title: 'Tổng quan dịch tễ & mức độ nặng',
    prompt:
      'Phân tích tổng quan đặc điểm dịch tễ (tuổi, giới, địa chỉ, bệnh nền), điểm CT Lund-Mackay, phân độ biến chứng ổ mắt Chandler và kết quả điều trị lúc xuất viện trong tập dữ liệu hiện tại.',
  },
  {
    id: 'risk-factors',
    title: 'Yếu tố liên quan biến chứng & di chứng',
    prompt:
      'Đánh giá mối liên quan giữa bệnh lý nền (đái tháo đường, tăng huyết áp), chỉ số xét nghiệm (bạch cầu, CRP), điểm Lund-Mackay với mức độ lan ổ mắt Chandler, lan nội sọ và di chứng sau điều trị.',
  },
  {
    id: 'regimen',
    title: 'Kháng sinh, kháng nấm & phẫu thuật',
    prompt:
      'So sánh thời gian nằm viện, tỷ lệ hồi phục hoàn toàn và di chứng giữa các phác đồ kháng sinh, thuốc kháng nấm và phương pháp phẫu thuật đã sử dụng.',
  },
  {
    id: 'manuscript',
    title: 'Tóm tắt chuẩn bài báo khoa học',
    prompt:
      'Viết bản nháp phần Kết quả nghiên cứu (Results) bằng văn phong y khoa tiếng Việt chuẩn mực từ tập số liệu hiện tại, trình bày rõ các biến định lượng và định tính chính.',
  },
];

export const AdminAiAnalyticsPanel: React.FC<AdminAiAnalyticsPanelProps> = ({ cases }) => {
  const isOnline = useOnlineStatus();
  const [question, setQuestion] = useState<string>(PRESET_PROMPTS[0].prompt);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiAnalysisResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleAnalyze = async (promptToRun?: string) => {
    const activeQuestion = (promptToRun ?? question).trim();
    if (!activeQuestion) {
      setError('Vui lòng nhập nội dung câu hỏi hoặc chọn mẫu phân tích.');
      return;
    }
    if (cases.length === 0) {
      setError('Chưa có ca bệnh nào trong danh sách để phân tích.');
      return;
    }
    if (!isOnline) {
      setError('Chế độ AI yêu cầu kết nối Internet để gửi dữ liệu phân tích tới máy chủ.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await requestAdminAiAnalysis(activeQuestion, cases);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Không thể hoàn tất phân tích AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.analysis) return;
    try {
      await navigator.clipboard.writeText(result.analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="space-y-5">
      {/* Admin-only Security & De-identification Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#13172b] via-[#0c1428] to-[#0a1322] border border-amber-500/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">
                Chế Độ AI Phân Tích Số Liệu Nghiên Cứu
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-700">
                <Shield className="w-3 h-3" /> CHỈ DÀNH CHO ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Phân tích tự động {cases.length} ca bệnh đang hoạt động. Hệ thống tự động loại bỏ{' '}
              <strong className="text-teal-300">tên bệnh nhân, mã ca thật và hình ảnh</strong> trước khi phân tích để đảm bảo bảo mật dữ liệu lâm sàng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/70 px-3 py-1.5 rounded-lg shrink-0">
          <Lock className="w-3.5 h-3.5" />
          <span>Khử định danh 100%</span>
        </div>
      </div>

      {!isOnline && (
        <div className="rounded-xl bg-amber-950/60 border border-amber-700/70 p-3 text-xs text-amber-200 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Thiết bị đang ở chế độ Offline. Kết nối Internet để chạy phân tích AI trực tuyến.
          </span>
        </div>
      )}

      {/* Preset Analytical Prompts */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          GỢI Ý PHÂN TÍCH NHANH
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_PROMPTS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={loading}
              onClick={() => {
                setQuestion(preset.prompt);
                handleAnalyze(preset.prompt);
              }}
              className="text-left p-3 rounded-xl bg-[#0a1120] hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition cursor-pointer disabled:opacity-50 space-y-1"
            >
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{preset.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                {preset.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Form */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Câu hỏi phân tích chuyên sâu dành cho AI
        </label>
        <textarea
          rows={3}
          maxLength={1500}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Nhập câu hỏi phân tích số liệu nghiên cứu (VD: So sánh điểm Lund-Mackay trung bình giữa nhóm có biến chứng nội sọ và nhóm không biến chứng nội sọ)..."
          className="w-full bg-[#070b14] border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-500"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            Phạm vi dữ liệu: <strong className="text-slate-300">{cases.length} ca</strong> (đã loại trừ thùng rác &amp; thông tin định danh)
          </span>

          <button
            type="button"
            disabled={loading || !isOnline || cases.length === 0}
            onClick={() => handleAnalyze()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang phân tích số liệu...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Phân tích bằng AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-950/60 border border-rose-700/70 p-3.5 text-xs text-rose-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Output */}
      {result && (
        <div className="bg-[#0a1120] border border-teal-500/40 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 bg-[#0e172a] border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Kết quả phân tích AI
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                · {new Date(result.generatedAt).toLocaleTimeString('vi-VN')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>

          <div className="p-5 text-xs sm:text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap font-sans space-y-2">
            {result.analysis}
          </div>
        </div>
      )}
    </div>
  );
};
