import React, { useState } from 'react';
import { Appointment } from '../../types';
import {
  UserCheck,
  X,
  Bell,
  User,
  Phone,
  Stethoscope,
  Building2,
  Clock,
  FileText,
  Send,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface CheckInConfirmModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (appointment: Appointment, note?: string) => void;
}

export const CheckInConfirmModal: React.FC<CheckInConfirmModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [note, setNote] = useState('');
  const [notifyDoctor, setNotifyDoctor] = useState(true);

  if (!isOpen || !appointment) return null;

  const handleConfirm = () => {
    onConfirm(appointment, note.trim());
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Lễ tân Tiếp đón
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">
                Xác nhận Đã đến khám bệnh
              </h3>
              <p className="text-xs text-emerald-100 font-mono mt-0.5">
                Mã phiếu đặt lịch: {appointment.bookingCode}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Patient Details Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                Họ và tên bệnh nhân:
              </span>
              <span className="text-sm font-bold text-slate-900">{appointment.patientName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                Số điện thoại:
              </span>
              <span className="font-mono font-bold text-slate-800">{appointment.patientPhone}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Bác sĩ phụ trách:
              </span>
              <span className="font-bold text-teal-900">{appointment.doctorName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-600" />
                Phòng khám:
              </span>
              <span className="font-semibold text-slate-800">{appointment.clinicRoom}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                Giờ hẹn khám:
              </span>
              <span className="font-bold font-mono text-slate-900">
                {appointment.appointmentTime} - {appointment.appointmentDate}
              </span>
            </div>

            {appointment.reason && (
              <div className="pt-1">
                <span className="text-slate-500 font-medium block mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Triệu chứng / Lý do đăng ký:
                </span>
                <p className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-700 italic">
                  "{appointment.reason}"
                </p>
              </div>
            )}
          </div>

          {/* Doctor Notification Banner */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                  Thông báo tức thì cho Bác sĩ phụ trách
                </h4>
                <p className="text-emerald-800 leading-relaxed">
                  Bệnh nhân sẽ được chuyển vào <strong>Hàng chờ khám</strong>. Hệ thống sẽ phát thông báo đẩy đến Bác sĩ <strong>{appointment.doctorName}</strong> tại <strong>{appointment.clinicRoom}</strong> để sẵn sàng bắt đầu phiên khám bệnh.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-2 border-t border-emerald-200/60 text-xs text-emerald-900 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={notifyDoctor}
                onChange={e => setNotifyDoctor(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300"
              />
              <span>Gửi chuông thông báo và đồng bộ hàng chờ đến Bác sĩ ngay</span>
            </label>
          </div>

          {/* Optional Note / Vitals */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Ghi chú tiếp đón / Sinh hiệu ban đầu (tùy chọn):
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="VD: Đã đo huyết áp 120/80 mmHg, SpO2 98%, đang ngồi chờ tại ghế số 4..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Xác nhận Đã đến & Thông báo cho Bác sĩ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
