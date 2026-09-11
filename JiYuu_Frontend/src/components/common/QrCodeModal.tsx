import React from 'react';
import { X, Download, Printer, CheckCircle, ShieldCheck } from 'lucide-react';

interface QrCodeModalProps {
  title: string;
  subtitle?: string;
  qrCodeUrl: string;
  metadata: { label: string; value: string }[];
  isOpen: boolean;
  onClose: () => void;
  type?: 'appointment' | 'medical_record';
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  title,
  subtitle,
  qrCodeUrl,
  metadata,
  isOpen,
  onClose,
  type = 'appointment',
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `JIYUU-${type.toUpperCase()}-QR-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 text-white text-center relative ${
          type === 'appointment'
            ? 'bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800'
            : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Mã QR Xác Thực JiYuu Clinic
          </div>
          <h3 className="text-xl font-bold">{title}</h3>
          {subtitle && <p className="text-xs text-teal-100 mt-1">{subtitle}</p>}
        </div>

        {/* QR Display Container */}
        <div className="p-6 text-center">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-md border-2 border-slate-100 mb-5">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-56 h-56 mx-auto object-contain rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-xs">
                Đang tạo mã QR bảo mật...
              </div>
            )}
          </div>

          <div className="text-left bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 mb-6">
            {metadata.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">{item.label}:</span>
                <span className="text-slate-900 font-bold text-right truncate max-w-[200px]">{item.value}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 italic mb-4">
            {type === 'appointment'
              ? 'Xuất trình mã này cho Tiếp tân tại quầy lễ tân để được check-in khám bệnh tự động.'
              : 'Xuất trình mã này cho Dược sĩ tại quầy thuốc cơ sở khám để lấy thuốc nhanh chóng.'}
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
            >
              <Download className="w-4 h-4 text-teal-600" />
              Tải ảnh QR
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              In phiếu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
