import React, { useState, useMemo } from 'react';
import { User, DoctorProfile, Specialty, Appointment, DEFAULT_DOCTOR_AVATAR } from '../../types';
import { storage } from '../../services/storage';
import { DoctorQuickViewModal } from '../common/DoctorQuickViewModal';
import { QrCodeModal } from '../common/QrCodeModal';
import {
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Phone,
  MapPin,
  FileText,
  Search,
  Star,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Building2,
  Stethoscope,
} from 'lucide-react';

interface PatientBookingProps {
  currentUser: User | null;
  onBookingSuccess?: (appointment: Appointment) => void;
  onOpenAuth: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const PatientBooking: React.FC<PatientBookingProps> = ({
  currentUser,
  onBookingSuccess,
  onOpenAuth,
  onNavigateTab,
}) => {
  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [isRelative, setIsRelative] = useState(false);
  const [patientName, setPatientName] = useState(currentUser?.fullName || '');
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '');
  const [patientDob, setPatientDob] = useState(currentUser?.dob || '1995-01-01');
  const [patientAddress, setPatientAddress] = useState(currentUser?.address || '');
  const [relationType, setRelationType] = useState('Bố/Mẹ');
  const [reason, setReason] = useState('');

  // Step 2 State
  const [specialty, setSpecialty] = useState<Specialty>('Khoa Nội');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState('09:00');

  // Step 3 State: Doctor selection & search/filters
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [quickViewDoctor, setQuickViewDoctor] = useState<DoctorProfile | null>(null);

  // Step 4 State: Confirmation & Completed Booking
  const [bookingResult, setBookingResult] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Time slots for clinic
  const morningSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const afternoonSlots = ['13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
  const eveningSlots = ['18:00', '18:30', '19:00', '19:30', '20:00'];

  // All doctors matching selected specialty
  const doctors = storage.getDoctors();
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchSpecialty = specialty === 'Chuyên khoa Khác' 
        ? doc.specialty === 'Chuyên khoa Khác' || (doc.specialty !== 'Khoa Nội' && doc.specialty !== 'Khoa Ngoại')
        : doc.specialty === specialty;
      
      const matchName = doc.fullName.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        doc.clinicRoom.toLowerCase().includes(doctorSearch.toLowerCase());
      
      const matchRating = doc.rating >= minRatingFilter;
      return matchSpecialty && matchName && matchRating;
    });
  }, [doctors, specialty, doctorSearch, minRatingFilter]);

  // Handle Step 1 -> Step 2 validation
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!patientName.trim() || !patientPhone.trim() || !patientAddress.trim() || !reason.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ tất cả các thông tin bắt buộc (*).');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  // Handle Step 2 -> Step 3
  const handleProceedToStep3 = () => {
    if (!appointmentDate || !appointmentTime) {
      setErrorMessage('Vui lòng chọn ngày và khung giờ khám.');
      return;
    }
    setErrorMessage('');
    setStep(3);
  };

  // Handle Step 3 -> Booking Submit
  const handleFinalizeBooking = async () => {
    if (!selectedDoctor) {
      setErrorMessage('Vui lòng chọn một bác sĩ để tiến hành đặt lịch.');
      return;
    }

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Calls storage with Concurrent Booking Prevention & Duplicate handling
      const res = await storage.createAppointment({
        patientUserId: currentUser.id,
        patientName: isRelative ? `${patientName} (${relationType})` : patientName,
        patientPhone,
        patientDob,
        patientAddress,
        isRelativeBooking: isRelative,
        relativeName: isRelative ? patientName : undefined,
        relativePhone: isRelative ? patientPhone : undefined,
        relationType: isRelative ? relationType : undefined,
        reason,
        specialty,
        doctorId: selectedDoctor.id,
        appointmentDate,
        appointmentTime,
      });

      if (!res.success || !res.appointment) {
        setErrorMessage(res.message || 'Đặt lịch thất bại do xung đột lịch hoặc lỗi hệ thống.');
        setIsSubmitting(false);
        return;
      }

      setBookingResult(res.appointment);
      setStep(4);
      onBookingSuccess?.(res.appointment);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra trong quá trình đặt lịch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If currently logged in as a Doctor, show appropriate role notice
  if (currentUser?.role === 'doctor') {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-md text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200/70 flex items-center justify-center mx-auto shadow-xs">
          <Stethoscope className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
            Giới hạn phân quyền theo vai trò (Doctor)
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Chức năng Đặt Lịch Khám chỉ dành cho Bệnh Nhân
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            Bạn đang đăng nhập với tài khoản <strong>Bác sĩ: {currentUser.fullName}</strong>. Chức năng đăng ký khám trực tuyến dành cho bệnh nhân và thân nhân. Bác sĩ vui lòng truy cập khu vực khám bệnh hoặc lịch trực công tác.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigateTab?.('doctor_exam')}
            className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Stethoscope className="w-4 h-4" />
            Vào phòng khám bệnh nhân
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab?.('doctor_schedule')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4" />
            Xem lịch làm việc của tôi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Stepper */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Đặt Lịch Khám Bệnh Trực Tuyến
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống phòng khám JiYuu - Hỗ trợ đặt lịch nhanh, chính xác và bảo mật
            </p>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full border border-teal-200">
            Bước {step}/4
          </span>
        </div>

        {/* Stepper Progress */}
        <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
          <div className={`p-2.5 rounded-xl text-center transition ${
            step >= 1 ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
          }`}>
            <span className="block text-[10px] opacity-80">01</span>
            <span className="truncate">Thông tin khám</span>
          </div>
          <div className={`p-2.5 rounded-xl text-center transition ${
            step >= 2 ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
          }`}>
            <span className="block text-[10px] opacity-80">02</span>
            <span className="truncate">Chuyên khoa & Giờ</span>
          </div>
          <div className={`p-2.5 rounded-xl text-center transition ${
            step >= 3 ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
          }`}>
            <span className="block text-[10px] opacity-80">03</span>
            <span className="truncate">Chọn Bác sĩ</span>
          </div>
          <div className={`p-2.5 rounded-xl text-center transition ${
            step === 4 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
          }`}>
            <span className="block text-[10px] opacity-80">04</span>
            <span className="truncate">Phiếu Đặt Lịch</span>
          </div>
        </div>
      </div>

      {/* Error notification banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block mb-0.5">Lưu ý từ hệ thống JiYuu:</span>
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* STEP 1: PATIENT DETAILS & BOOKING FOR RELATIVES */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          {/* Relative booking toggle */}
          <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/70 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-600 text-white rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Đặt lịch khám hộ cho người thân?</h4>
                <p className="text-xs text-slate-500">
                  JiYuu hỗ trợ đặt lịch cho bố mẹ, con cái hoặc bạn bè bằng số điện thoại riêng
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRelative}
                onChange={e => {
                  setIsRelative(e.target.checked);
                  if (e.target.checked) {
                    setPatientName('');
                    setPatientPhone('');
                  } else {
                    setPatientName(currentUser?.fullName || '');
                    setPatientPhone(currentUser?.phone || '');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isRelative ? 'Họ tên người thân được khám' : 'Họ và tên người khám'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="VD: Nguyễn Thị Lan"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={e => setPatientPhone(e.target.value)}
                  placeholder="VD: 0912345678"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                />
              </div>
            </div>

            {isRelative && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mối quan hệ với bạn
                </label>
                <select
                  value={relationType}
                  onChange={e => setRelationType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-white"
                >
                  <option value="Bố/Mẹ">Bố / Mẹ</option>
                  <option value="Con cái">Con cái</option>
                  <option value="Vợ/Chồng">Vợ / Chồng</option>
                  <option value="Ông/Bà">Ông / Bà</option>
                  <option value="Người thân khác">Người thân khác</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày tháng năm sinh
              </label>
              <input
                type="date"
                value={patientDob}
                onChange={e => setPatientDob(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-white"
              />
            </div>

            <div className={isRelative ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Địa chỉ liên hệ / Thường trú <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={patientAddress}
                  onChange={e => setPatientAddress(e.target.value)}
                  placeholder="VD: 124 Phố Huế, Hoàn Kiếm, Hà Nội"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lý do khám bệnh & Triệu chứng ban đầu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                required
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Mô tả cụ thể các triệu chứng: ví dụ đau ngực, sốt kéo dài, đau khớp gối, khó thở, ợ chua..."
                className="w-full p-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <span>Tiếp tục: Chọn Chuyên khoa & Giờ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: CHOOSE SPECIALTY, DATE & TIME */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          {/* Specialty selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Chọn chuyên khoa khám bệnh <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'Khoa Nội' as Specialty,
                  title: 'Khoa Nội',
                  desc: 'Tim mạch, Tiêu hoá, Hô hấp, Gan mật, Nội tiết, Huyết áp',
                },
                {
                  id: 'Khoa Ngoại' as Specialty,
                  title: 'Khoa Ngoại',
                  desc: 'Cơ xương khớp, Chấn thương, Cột sống, Tiểu phẫu ngoại trú',
                },
                {
                  id: 'Chuyên khoa Khác' as Specialty,
                  title: 'Chuyên khoa Khác',
                  desc: 'Tai Mũi Họng, Da Liễu, Mắt, Răng Hàm Mặt, Dị ứng',
                },
              ].map(item => (
                <div
                  key={item.id}
                  onClick={() => setSpecialty(item.id)}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                    specialty === item.id
                      ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-900">{item.title}</span>
                    {specialty === item.id && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-teal-600" />
                Chọn ngày khám
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Lưu ý: Quý khách có thể huỷ lịch hẹn trước giờ khám tối thiểu 4 tiếng.
              </p>
            </div>

            <div className="sm:col-span-2 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                Chọn khung giờ khám (Ca sáng / chiều / tối)
              </label>

              {/* Slots */}
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Ca Sáng</span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {morningSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setAppointmentTime(time)}
                        className={`py-2 px-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                          appointmentTime === time
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Ca Chiều</span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {afternoonSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setAppointmentTime(time)}
                        className={`py-2 px-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                          appointmentTime === time
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Ca Tối</span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {eveningSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setAppointmentTime(time)}
                        className={`py-2 px-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                          appointmentTime === time
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại Bước 1
            </button>

            <button
              type="button"
              onClick={handleProceedToStep3}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <span>Tiếp tục: Xem Danh sách Bác sĩ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: MATCHING DOCTORS LIST WITH SEARCH, RATING FILTER, AND EYE ICON QUICK VIEW */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Danh Sách Bác Sĩ Phù Hợp ({specialty})
              </h3>
              <p className="text-xs text-slate-500">
                Lịch hẹn: <strong>{appointmentTime}</strong> ngày <strong>{appointmentDate}</strong>
              </p>
            </div>

            {/* Search & Rating Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={doctorSearch}
                  onChange={e => setDoctorSearch(e.target.value)}
                  placeholder="Tìm theo tên bác sĩ..."
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 w-44"
                />
              </div>

              <select
                value={minRatingFilter}
                onChange={e => setMinRatingFilter(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
              >
                <option value={0}>Tất cả sao đánh giá</option>
                <option value={4.5}>Từ 4.5 ★ trở lên</option>
                <option value={4.8}>Từ 4.8 ★ xuất sắc</option>
              </select>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="space-y-3">
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm font-medium">
                  Không tìm thấy bác sĩ nào phù hợp với bộ lọc tìm kiếm.
                </p>
                <button
                  onClick={() => {
                    setDoctorSearch('');
                    setMinRatingFilter(0);
                  }}
                  className="mt-2 text-teal-600 text-xs font-bold hover:underline cursor-pointer"
                >
                  Xoá bộ lọc tìm kiếm
                </button>
              </div>
            ) : (
              filteredDoctors.map(doctor => {
                const isSelected = selectedDoctor?.id === doctor.id;
                return (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={doctor.avatar || DEFAULT_DOCTOR_AVATAR}
                        alt={doctor.fullName}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_DOCTOR_AVATAR;
                        }}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0 bg-teal-50"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">{doctor.fullName}</h4>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                            {doctor.specialty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          {doctor.clinicRoom} • {doctor.experienceYears} năm kinh nghiệm
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{doctor.rating}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            ({doctor.reviewCount} lượt đánh giá)
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Hotline: {doctor.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {/* EYE ICON: QUICK VIEW MODAL REQUIREMENT */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setQuickViewDoctor(doctor);
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="Xem nhanh thông tin bác sĩ (Biểu tượng con mắt)"
                      >
                        <Eye className="w-4 h-4 text-teal-600" />
                      </button>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedDoctor(doctor);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Đã chọn bác sĩ
                          </>
                        ) : (
                          'Chọn bác sĩ'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại Bước 2
            </button>

            {/* BUTTON "ĐẶT LỊCH" AS EXPLICITLY REQUESTED */}
            <button
              type="button"
              disabled={!selectedDoctor || isSubmitting}
              onClick={handleFinalizeBooking}
              className={`px-8 py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer ${
                !selectedDoctor || isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20 active:scale-98'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang kiểm tra & Đặt lịch...' : 'Đặt Lịch Khám Ngay'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PHIẾU ĐẶT LỊCH KHÁM (BOOKING TICKET WITH QR CODE) */}
      {step === 4 && bookingResult && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6 animate-in fade-in">
          {/* Success Banner */}
          <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-xl font-black">Đặt Lịch Khám Bệnh Thành Công!</h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Hệ thống đã gửi xác nhận và tạo mã QR khám bệnh chính thức cho bạn
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right bg-white/10 px-4 py-2 rounded-xl">
              <span className="text-[10px] text-emerald-200 block uppercase font-bold">Mã Phiếu Đặt Lịch</span>
              <span className="text-lg font-black font-mono tracking-wider">{bookingResult.bookingCode}</span>
            </div>
          </div>

          {/* Ticket Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* QR Code Container */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center flex flex-col items-center justify-center">
              <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200 mb-3">
                {bookingResult.qrCodeDataUrl ? (
                  <img
                    src={bookingResult.qrCodeDataUrl}
                    alt="QR Code"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                    Mã QR đang xử lý
                  </div>
                )}
              </div>

              <span className="text-xs font-bold text-slate-800">Mã QR Check-in Tiếp Tân</span>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Xuất trình mã này cho tiếp tân tại bàn lễ tân khi đến khám bệnh.
              </p>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="mt-3 px-4 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition cursor-pointer"
              >
                Phóng to & Tải về QR
              </button>
            </div>

            {/* Ticket Details */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
                Chi Tiết Phiếu Đặt Lịch Khám JiYuu
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Người khám bệnh:</span>
                  <span className="font-bold text-slate-900 text-sm">{bookingResult.patientName}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Số điện thoại:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{bookingResult.patientPhone}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Bác sĩ phụ trách:</span>
                  <span className="font-bold text-teal-700 text-sm">{bookingResult.doctorName}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Phòng khám & Chuyên khoa:</span>
                  <span className="font-bold text-slate-900">{bookingResult.clinicRoom} ({bookingResult.specialty})</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">Thời gian hẹn khám:</span>
                  <span className="font-bold text-teal-800 text-base font-mono">
                    {bookingResult.appointmentTime} - Ngày {bookingResult.appointmentDate}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">Lý do khám bệnh:</span>
                  <span className="text-slate-700 italic">"{bookingResult.reason}"</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Quy định huỷ lịch khám:
                </div>
                <p>
                  Quý khách được quyền huỷ lịch trực tuyến trước giờ hẹn <strong>ít nhất 4 tiếng</strong>. Nếu cần hỗ trợ khẩn cấp, vui lòng liên hệ hotline 1900 6868.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setBookingResult(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
                >
                  Đặt thêm lịch khám khác
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Quick View Modal (Eye Icon) */}
      <DoctorQuickViewModal
        doctor={quickViewDoctor}
        onClose={() => setQuickViewDoctor(null)}
        onSelectDoctor={doc => setSelectedDoctor(doc)}
        isSelected={selectedDoctor?.id === quickViewDoctor?.id}
      />

      {/* High-res QR Modal */}
      {bookingResult && (
        <QrCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title="Phiếu Đặt Lịch Khám Bệnh"
          subtitle={`Mã đặt lịch: ${bookingResult.bookingCode}`}
          qrCodeUrl={bookingResult.qrCodeDataUrl || ''}
          metadata={[
            { label: 'Bệnh nhân', value: bookingResult.patientName },
            { label: 'Bác sĩ', value: bookingResult.doctorName },
            { label: 'Thời gian', value: `${bookingResult.appointmentTime} - ${bookingResult.appointmentDate}` },
            { label: 'Phòng khám', value: bookingResult.clinicRoom },
            { label: 'SĐT bệnh nhân', value: bookingResult.patientPhone },
          ]}
          type="appointment"
        />
      )}
    </div>
  );
};
