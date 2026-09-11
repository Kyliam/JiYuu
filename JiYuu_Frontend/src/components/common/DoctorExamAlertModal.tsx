import React from 'react';
import { Appointment } from '../../types';
import { BellRing, Stethoscope, Clock, MapPin, User, X } from 'lucide-react';

interface DoctorExamAlertModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onStartExam?: (appointment: Appointment) => void;
  onConfirm?: (appointment: Appointment) => void;
}

export const DoctorExamAlertModal: React.FC<DoctorExamAlertModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onStartExam,
  onConfirm,
}) => {
  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-teal-500 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Animated Banner */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center animate-bounce">
              <BellRing className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-teal-100 bg-white/20 px-2.5 py-0.5 rounded-full">
                Thông báo khẩn
              </span>
              <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
                Đến giờ khám bệnh!
              </h3>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Bệnh nhân đã có mặt tại phòng chờ khám bệnh. Bác sĩ vui lòng bắt đầu phiên khám bệnh ngay để đảm bảo tiến độ:
          </p>

          <div className="p-4 bg-teal-50/60 border border-teal-100 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-teal-100/60 pb-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" />
                Bệnh nhân:
              </span>
              <span className="text-sm font-bold text-slate-900">{appointment.patientName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-teal-100/60 pb-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                Thời gian hẹn:
              </span>
              <span className="text-xs font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md">
                {appointment.appointmentTime} - {appointment.appointmentDate}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-teal-100/60 pb-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600" />
                Phòng khám:
              </span>
              <span className="text-xs font-bold text-slate-800">{appointment.clinicRoom}</span>
            </div>

            <div className="pt-1">
              <span className="text-xs text-slate-500 block mb-1 font-medium">Lý do khám bệnh:</span>
              <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-teal-100/70">
                "{appointment.reason}"
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm transition cursor-pointer"
            >
              Để sau
            </button>
            <button
              onClick={() => {
                if (typeof onStartExam === 'function') {
                  onStartExam(appointment);
                } else if (typeof onConfirm === 'function') {
                  onConfirm(appointment);
                }
                onClose();
              }}
              className="flex-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg active:scale-98"
            >
              <Stethoscope className="w-5 h-5" />
              Khám bệnh ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
