import React from 'react';
import {
  PatientCase,
  Gender,
  AddressType,
  Ethnicity,
  Occupation,
  ComplexityGrade,
} from '../../types/medical';

interface StepPatientProps {
  data: PatientCase;
  onChange: (updates: Partial<PatientCase>) => void;
}

export const StepPatient: React.FC<StepPatientProps> = ({ data, onChange }) => {
  const commonDiagnoses = [
    'Viêm xoang biến chứng mắt',
    'Viêm mũi xoang mạn có polyp (CRSwNP)',
    'Viêm mũi xoang mạn không polyp (CRSsNP)',
    'Viêm xoang biến chứng nội sọ',
    'Nấm xoang xâm lấn cấp / mạn',
    'U nhú đảo ngược mũi xoang (Inverted Papilloma)',
    'Rò dịch não tủy qua xoang sàng / xoang bướm',
    'Chấn thương vỡ sàn ổ mắt / u sàn sọ',
  ];

  const handleDiagnosisChange = (val: string) => {
    let suggestedSurgery = data.surgeryType;
    let suggestedGrade = data.complexityGrade;

    if (val.includes('biến chứng mắt')) {
      suggestedSurgery = 'Mở sàng trước - hàm - dẫn lưu ổ mắt';
      suggestedGrade = 'Grade II — Nâng cao (sàng sau/bướm, Draf I/IIA)';
    } else if (val.includes('biến chứng nội sọ') || val.includes('Rò dịch não tủy')) {
      suggestedSurgery = 'Vá rò DNT / Mở sàng sọ qua nội soi';
      suggestedGrade = 'Grade IV — Rất phức tạp (sàn sọ, mạch máu lớn)';
    } else if (val.includes('CRSwNP')) {
      suggestedSurgery = 'FESS toàn bộ xoang hai bên';
      suggestedGrade = 'Grade II — Nâng cao (sàng sau/bướm, Draf I/IIA)';
    }

    onChange({
      primaryDiagnosis: val,
      surgeryType: suggestedSurgery,
      complexityGrade: suggestedGrade,
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic identifiers row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        {/* Mã ca */}
        <div className="sm:col-span-6 space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            MÃ CA (GIA ĐỊNH DANH) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={data.caseCode}
            onChange={(e) => onChange({ caseCode: e.target.value })}
            placeholder="VD: NT121124412"
            className="w-full bg-[#0a1120] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 font-mono"
          />
          <p className="text-[11px] text-slate-500">
            Mã định danh bảo mật ca bệnh không để lộ tên thật.
          </p>
        </div>

        {/* Tuổi */}
        <div className="sm:col-span-3 space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            TUỔI <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min={0}
            max={120}
            value={data.age ?? ''}
            onChange={(e) => onChange({ age: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="VD: 51"
            className="w-full bg-[#0a1120] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-3.5 py-2.5 text-sm text-slate-100"
          />
        </div>

        {/* Giới */}
        <div className="sm:col-span-3 space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            GIỚI <span className="text-rose-400">*</span>
          </label>
          <select
            value={data.gender}
            onChange={(e) => onChange({ gender: e.target.value as Gender })}
            className="w-full bg-[#0a1120] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-3.5 py-2.5 text-sm text-slate-100"
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
      </div>

      {/* Dịch tễ (Bảng 1 từ hình ảnh nghiên cứu) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        {/* Địa chỉ */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase">
            ĐỊA CHỈ <span className="text-rose-400">*</span>
          </label>
          <select
            value={data.address}
            onChange={(e) => onChange({ address: e.target.value as AddressType })}
            className="w-full bg-[#0a1120] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="TP HCM">TP HCM</option>
            <option value="Tỉnh khác">Tỉnh khác</option>
          </select>
          {data.address === 'Tỉnh khác' && (
            <input
              type="text"
              placeholder="Tên tỉnh (vd: Đồng Nai, Bình Dương...)"
              value={data.provinceDetails || ''}
              onChange={(e) => onChange({ provinceDetails: e.target.value })}
              className="mt-1.5 w-full bg-[#070b14] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600"
            />
          )}
        </div>

        {/* Dân tộc */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase">
            DÂN TỘC <span className="text-rose-400">*</span>
          </label>
          <select
            value={data.ethnicity}
            onChange={(e) => onChange({ ethnicity: e.target.value as Ethnicity })}
            className="w-full bg-[#0a1120] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="Kinh">Kinh</option>
            <option value="Dân tộc khác">Dân tộc khác</option>
          </select>
        </div>

        {/* Nghề nghiệp */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase">
            NGHỀ NGHIỆP <span className="text-rose-400">*</span>
          </label>
          <select
            value={data.occupation}
            onChange={(e) => onChange({ occupation: e.target.value as Occupation })}
            className="w-full bg-[#0a1120] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="Công nhân viên">Công nhân viên</option>
            <option value="Nội trợ">Nội trợ</option>
            <option value="Học sinh, sinh viên">Học sinh, sinh viên</option>
            <option value="Nông dân">Nông dân</option>
            <option value="Buôn bán">Buôn bán</option>
            <option value="Khác">Khác</option>
          </select>
        </div>
      </div>

      {/* Ngày mổ & Độ phức tạp */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        {/* Ngày mổ */}
        <div className="sm:col-span-5 space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            NGÀY MỔ <span className="text-rose-400">*</span>
          </label>
          <input
            type="date"
            value={data.surgeryDate}
            onChange={(e) => onChange({ surgeryDate: e.target.value })}
            className="w-full bg-[#0a1120] border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2.5 text-sm text-slate-100"
          />
        </div>

        {/* Độ phức tạp */}
        <div className="sm:col-span-7 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-teal-400 font-mono font-bold tracking-wider uppercase border-l-2 border-teal-400 pl-1.5">
              QUYẾT ĐỊNH
            </span>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              ĐỘ PHỨC TẠP <span className="text-rose-400">*</span>
            </label>
          </div>
          <select
            value={data.complexityGrade}
            onChange={(e) => onChange({ complexityGrade: e.target.value as ComplexityGrade })}
            className="w-full bg-[#0a1120] border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2.5 text-sm text-slate-100"
          >
            <option value="Grade I — Cơ bản">Grade I — Cơ bản (chọc rửa, mở khe giữa, sàng trước)</option>
            <option value="Grade II — Nâng cao (sàng sau/bướm, Draf I/IIA)">
              Grade II — Nâng cao (sàng sau/bướm, Draf I/IIA)
            </option>
            <option value="Grade III — Phức tạp (Draf IIB/III, u sàng sọ)">
              Grade III — Phức tạp (Draf IIB/III, u sàng sọ, mở sàn hố yên)
            </option>
            <option value="Grade IV — Rất phức tạp (sàn sọ, mạch máu lớn)">
              Grade IV — Rất phức tạp (sàn sọ, xoang hang, động mạch cảnh)
            </option>
          </select>
        </div>
      </div>

      {/* Chẩn đoán & Phẫu thuật */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Chẩn đoán */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            CHẨN ĐOÁN
          </label>
          <div className="relative">
            <input
              type="text"
              list="diagnoses-list"
              value={data.primaryDiagnosis}
              onChange={(e) => handleDiagnosisChange(e.target.value)}
              placeholder="Chọn hoặc gõ chẩn đoán..."
              className="w-full bg-[#0a1120] border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2.5 text-sm text-slate-100"
            />
            <datalist id="diagnoses-list">
              {commonDiagnoses.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Loại phẫu thuật */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            LOẠI PHẪU THUẬT
          </label>
          <input
            type="text"
            value={data.surgeryType}
            onChange={(e) => onChange({ surgeryType: e.target.value })}
            placeholder="VD: Mở sàng trước, FESS toàn bộ xoang..."
            className="w-full bg-[#0a1120] border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2.5 text-sm text-slate-100"
          />
          <p className="text-[11px] text-teal-400/90 flex items-center gap-1">
            ↳ Tự điền theo chẩn đoán · chỉnh sửa tự do
          </p>
        </div>
      </div>
    </div>
  );
};
