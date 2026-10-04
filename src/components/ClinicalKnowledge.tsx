import React, { useState } from 'react';
import { BookOpen, Eye, Layers, Brain, CheckSquare, Search } from 'lucide-react';

export const ClinicalKnowledge: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<'chandler' | 'lundmackay' | 'draf' | 'nps' | 'snot22'>('chandler');

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold">
          SỔ TAY LÂM SÀNG NGOẠI TUYẾN
        </span>
        <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
          Kiến Thức & Thang Điểm Chuẩn Hóa Tai Mũi Họng
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Tra cứu nhanh tiêu chuẩn chẩn đoán, phân loại giải phẫu phẫu thuật nội soi mũi xoang và biến chứng.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'chandler', label: 'Phân độ Chandler (Ổ mắt)' },
          { id: 'lundmackay', label: 'Thang điểm Lund-Mackay CT' },
          { id: 'draf', label: 'Phân loại Draf (Ngách trán)' },
          { id: 'nps', label: 'Nasal Polyp Score (NPS)' },
          { id: 'snot22', label: 'Bảng câu hỏi SNOT-22' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTopic(t.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTopic === t.id
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/60'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Topic Content */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
        {activeTopic === 'chandler' && (
          <div className="space-y-4 text-xs text-slate-300">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
              <Eye className="w-4 h-4" />
              PHÂN ĐỘ BIẾN CHỨNG Ổ MẮT THEO CHANDLER (1970)
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-emerald-400">Nhóm I: Viêm mô tế bào trước vách (Preseptal cellulitis)</span>
                <p className="mt-1 text-slate-400">
                  Phù nề mí mắt, đỏ kết mạc nhưng thị lực bình thường, vận nhãn không giới hạn, không lồi mắt.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-teal-400">Nhóm II: Viêm mô tế bào ổ mắt (Orbital cellulitis)</span>
                <p className="mt-1 text-slate-400">
                  Nhiễm trùng lan qua vách ổ mắt vào mỡ sau hốc mắt. Bệnh nhân có lồi mắt, hạn chế vận nhãn nhẹ nhưng chưa hình thành bọc mủ.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-amber-400">Nhóm III: Áp xe dưới màng xương (Subperiosteal abscess - SPA)</span>
                <p className="mt-1 text-slate-400">
                  Tụ mủ giữa xương giấy và màng xương ổ mắt. Nhãn cầu bị đẩy lệch ra ngoài và xuống dưới. Cần phẫu thuật dẫn lưu FESS khẩn để cứu thị lực.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-rose-400">Nhóm IV: Áp xe ổ mắt (Orbital abscess)</span>
                <p className="mt-1 text-slate-400">
                  Bọc mủ nằm trong nhu mô mỡ ổ mắt hoặc trong chóp mắt. Mất thị lực nặng, liệt hoàn toàn vận nhãn.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-purple-400">Nhóm V: Viêm tắc xoang hang (Cavernous sinus thrombosis)</span>
                <p className="mt-1 text-slate-400">
                  Biến chứng lan cả hai bên mắt, liệt dây thần kinh sọ III, IV, VI, sốt rét run, tri giác xấu dần. Nguy cơ tử vong rất cao.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTopic === 'lundmackay' && (
          <div className="space-y-4 text-xs text-slate-300">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4" />
              QUY ƯỚC CHẤM ĐIỂM CT LUND-MACKAY (0–24)
            </h3>
            <p className="text-slate-400">
              Đánh giá mỗi bên xoang riêng biệt (Tối đa 12 điểm mỗi bên, tổng 2 bên = 24 điểm):
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>Các xoang Trán, Sàng trước, Sàng sau, Hàm, Bướm:</strong> 0 = Sạch hoàn toàn; 1 = Mờ một phần; 2 = Mờ hoàn toàn.</li>
              <li><strong>Phức hợp lỗ ngách (OMC):</strong> 0 = Thông thoáng hoàn toàn; 2 = Tắc nghẽn.</li>
            </ul>
          </div>
        )}

        {activeTopic === 'draf' && (
          <div className="space-y-4 text-xs text-slate-300">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4" />
              PHÂN LOẠI PHẪU THUẬT NGÁCH TRÁN (DRAF I, IIA, IIB, III)
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-teal-400">Draf I:</strong> Dẫn lưu đơn giản ngách trán bằng cách lấy sạch các tế bào sàng trước và tế bào phễu trán mà không chạm vào lỗ xoang trán thật sự.
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-teal-400">Draf IIA:</strong> Mở rộng sàn xoang trán giữa xương giấy và cuốn mũi giữa (phía trong).
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-teal-400">Draf IIB:</strong> Mở rộng sàn xoang trán vào trong tới tận vách ngăn mũi, lấy bỏ phần bám trước của cuốn giữa.
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-teal-400">Draf III (Modified Lothrop):</strong> Mở thông toàn bộ sàn hai bên xoang trán qua đường giữa, cắt bỏ phần trên vách ngăn mũi và gai trán tạo thành khoang xoang trán chung rộng lớn.
              </div>
            </div>
          </div>
        )}

        {activeTopic === 'nps' && (
          <div className="space-y-4 text-xs text-slate-300">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
              NASAL POLYP SCORE (NPS: 0–8)
            </h3>
            <div className="space-y-2">
              <p><strong>0 điểm:</strong> Không có polyp.</p>
              <p><strong>1 điểm:</strong> Polyp nhỏ chỉ giới hạn trong khe giữa.</p>
              <p><strong>2 điểm:</strong> Polyp vượt qua khe giữa nhưng chưa xuống dưới bờ dưới cuốn giữa.</p>
              <p><strong>3 điểm:</strong> Polyp lớn vượt quá bờ dưới cuốn giữa nhưng chưa chạm sàn mũi.</p>
              <p><strong>4 điểm:</strong> Polyp bít tắc hoàn toàn hốc mũi, chạm sàn mũi.</p>
            </div>
          </div>
        )}

        {activeTopic === 'snot22' && (
          <div className="space-y-4 text-xs text-slate-300">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
              THANG ĐIỂM SNOT-22 (SINO-NASAL OUTCOME TEST)
            </h3>
            <p className="text-slate-400">
              Gồm 22 tiêu chí (thang điểm 0–5 mỗi câu, tổng từ 0 đến 110): Cần hỉ mũi, Nghẹt/tắc mũi, Hắt hơi, Chảy nước mũi, Ho, Chảy mũi sau, Dịch mũi đặc, Chóng mặt, Đau tai, Cảm giác đầy tai, Đau mặt, Mất khứu giác/vị giác, Khó ngủ, Thức giấc ban đêm, Mệt mỏi, Giảm năng suất lao động...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
