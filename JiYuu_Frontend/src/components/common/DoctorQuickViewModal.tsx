import React from 'react';
import { DoctorProfile, DEFAULT_DOCTOR_AVATAR } from '../../types';
import { X, Star, Phone, Building2, Award, FileText, Calendar, MessageSquare, CheckCircle2 } from 'lucide-react';

interface DoctorQuickViewModalProps {
  doctor: DoctorProfile | null;
  onClose: () => void;
  onSelectDoctor?: (doctor: DoctorProfile) => void;
  isSelected?: boolean;
}

export const DoctorQuickViewModal: React.FC<DoctorQuickViewModalProps> = ({
  doctor,
  onClose,
  onSelectDoctor,
  isSelected,
}) => {
  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Doctor Banner */}
        <div className="relative bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <img
              src={doctor.avatar || DEFAULT_DOCTOR_AVATAR}
              alt={doctor.fullName}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_DOCTOR_AVATAR;
              }}
              className="w-24 h-24 rounded-2xl object-cover border-3 border-white/80 shadow-md bg-teal-50 shrink-0"
            />
            <div className="text-center sm:text-left flex-1">
              <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-teal-100 bg-white/20 rounded-full mb-1">
                {doctor.specialty}
              </span>
              <h3 className="text-2xl font-bold tracking-tight">{doctor.fullName}</h3>
              <p className="text-teal-100 text-sm flex items-center justify-center sm:justify-start gap-2 mt-1">
                <Building2 className="w-4 h-4" />
                {doctor.clinicRoom}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                <div className="flex items-center gap-1 bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md text-sm font-semibold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{doctor.rating}</span>
                </div>
                <span className="text-teal-100 text-xs">({doctor.reviewCount} lượt đánh giá thực tế)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Award className="w-4 h-4 text-teal-600" />
                Kinh nghiệm
              </div>
              <div className="text-base font-bold text-slate-900">{doctor.experienceYears} năm lâm sàng</div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Phone className="w-4 h-4 text-teal-600" />
                SĐT liên hệ
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">{doctor.phone}</div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Calendar className="w-4 h-4 text-teal-600" />
                Tình trạng lịch
              </div>
              <div className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang mở đặt lịch
              </div>
            </div>
          </div>

          {/* Bio / Giới thiệu */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              Tiểu sử & Chuyên môn
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed bg-teal-50/50 p-4 rounded-xl border border-teal-100">
              {doctor.bio}
            </p>
          </div>

          {/* Bằng cấp & Chứng chỉ */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-600" />
              Bằng cấp & Chứng chỉ đào tạo
            </h4>
            <div className="space-y-2">
              {doctor.degrees?.map((deg, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{deg}</span>
                </div>
              ))}
              {doctor.certificates?.map((cert, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phản hồi đánh giá của người bệnh */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                Đánh giá gần đây từ người bệnh
              </span>
              <span className="text-xs font-normal text-slate-500">{doctor.reviews?.length || 0} nhận xét</span>
            </h4>

            {doctor.reviews && doctor.reviews.length > 0 ? (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {doctor.reviews.map(rev => (
                  <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{rev.patientName}</span>
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-slate-400 text-[10px] ml-1">{rev.date}</span>
                      </div>
                    </div>
                    <p className="text-slate-600 italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Chưa có nhận xét nào được công khai cho bác sĩ này.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
          {onSelectDoctor && (
            <button
              onClick={() => {
                onSelectDoctor(doctor);
                onClose();
              }}
              className={`px-5 py-2.5 text-sm font-semibold rounded-xl text-white shadow-sm transition flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isSelected ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Đang chọn bác sĩ này
                </>
              ) : (
                <>Chọn Bác sĩ {doctor.fullName}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
